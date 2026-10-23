/**
 * /api/chat 오케스트레이션 — 소유: 개발자 B (BE-5). PRD §8.1 처리 순서.
 * 의도 추출 → 이벤트 필터 → 카카오 후보 수집 → Gemini 큐레이션 → 서버 ID 검증 → 응답.
 */
import "server-only";
import type {
  ChatRequest, ChatResponse, Course, HalloweenEvent, PlaceKind, Recommendation, Place,
} from "@/lib/contracts";
import { TOGGLE_TO_KINDS } from "@/lib/contracts";
import spookyKeywords from "../../../content/spooky-keywords.json";
import { loadEvents, todayKst } from "./events";
import { GeminiError, curate, extractIntent, type Candidate, type Curation, type Intent } from "./gemini";
import { KakaoQuotaError, searchKeyword } from "./kakao";
import {
  CROWD_NOTICE, SAFE_ONE_LINER, UNSAFE_PLACE_TEXT, isCrowdedArea, isKidSafeEvent,
  mentionsUnsafePlace, resolveScare, sanitizeOneLiner,
} from "./policy";
import { walkMinutes } from "./walk";

const MAX_ITEMS = 6; // BR-004
const MAX_STOPS = 4;
const MIN_STOPS = 2;
const MAX_EVENTS = 4;
const SPOOKY_KEYWORD_COUNT = 2;
const SPOOKY_RADIUS = 5000;
const WIDE_RADIUS = 20000; // E2: 반경 확대 1회
const REST_RADIUS = 1000;
const CLARIFY_OPTIONS = ["서울 홍대", "서울 잠실", "경기 용인", "부산 서면"];
const ALL_KINDS: PlaceKind[] = ["spooky", "event", "food", "cafe"];

interface Entry {
  kind: PlaceKind;
  place: Place;
  event?: HalloweenEvent;
}
interface Center { lat: number; lng: number }

type ErrorCode = Extract<ChatResponse, { type: "error" }>["code"];
const error = (code: ErrorCode, text: string): ChatResponse => ({ type: "error", code, text });

const toCenter = (p: Place): Center => ({ lat: Number(p.y), lng: Number(p.x) });

function shuffled<T>(items: readonly T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function wantedKinds(req: ChatRequest): PlaceKind[] {
  const kinds = req.toggles.flatMap((t) => TOGGLE_TO_KINDS[t]);
  return kinds.length > 0 ? kinds : ALL_KINDS;
}

const isUnsafeName = (p: Place) =>
  mentionsUnsafePlace(p.place_name) || mentionsUnsafePlace(p.category_name);

async function resolveCenter(req: ChatRequest, intent: Intent): Promise<Center | null> {
  if (req.location) return req.location;
  if (!intent.region) return null;
  const [hit] = await searchKeyword({ query: intent.region, size: 1 });
  return hit ? toCenter(hit) : null;
}

async function findSpooky(center: Center, region: string | null): Promise<Entry[]> {
  const search = async (radius: number) => {
    const keywords = shuffled(spookyKeywords.keywords).slice(0, SPOOKY_KEYWORD_COUNT);
    const lists = await Promise.all(
      keywords.map((kw) =>
        searchKeyword({
          query: region ? `${region} ${kw}` : kw,
          x: center.lng, y: center.lat, radius, size: 8, sort: "distance",
        }),
      ),
    );
    return lists.flat().filter((p) => !isUnsafeName(p));
  };
  let places = await search(SPOOKY_RADIUS);
  if (places.length === 0) places = await search(WIDE_RADIUS); // E2
  return places.map((place) => ({ kind: "spooky" as const, place }));
}

async function findEvents(center: Center, intent: Intent, today: string): Promise<Entry[]> {
  const date = intent.date && intent.date >= today ? intent.date : undefined;
  let events = loadEvents({ to: date, region: intent.region ?? undefined });
  if (intent.withKids) events = events.filter(isKidSafeEvent);
  const found = await Promise.all(
    events.slice(0, MAX_EVENTS).map(async (event): Promise<Entry | null> => {
      const [place] = await searchKeyword({
        query: event.venueName, x: center.lng, y: center.lat, radius: WIDE_RADIUS, size: 1,
      });
      return place ? { kind: "event", place, event } : null;
    }),
  );
  return found.filter((e): e is Entry => e !== null);
}

async function findRest(anchor: Center, kinds: PlaceKind[]): Promise<Entry[]> {
  const jobs: Promise<Entry[]>[] = [];
  const add = (kind: "food" | "cafe", query: string, category: "FD6" | "CE7") =>
    jobs.push(
      searchKeyword({ query, category, x: anchor.lng, y: anchor.lat, radius: REST_RADIUS, size: 5, sort: "distance" })
        .then((ps) => ps.map((place) => ({ kind, place }))),
    );
  if (kinds.includes("food")) add("food", "맛집", "FD6");
  if (kinds.includes("cafe")) add("cafe", "카페", "CE7");
  return (await Promise.all(jobs)).flat();
}

function dedupe(entries: Entry[]): Entry[] {
  const seen = new Map<string, Entry>();
  for (const e of entries) if (!seen.has(e.place.id)) seen.set(e.place.id, e);
  return [...seen.values()];
}

const toCandidate = (e: Entry): Candidate => ({
  id: e.place.id,
  kind: e.kind,
  name: e.place.place_name,
  category: e.place.category_name,
  distance: e.place.distance || undefined,
  eventTitle: e.event?.title,
  period: e.event ? `${e.event.startDate}~${e.event.endDate}` : undefined,
});

function toRecommendation(e: Entry, oneLiner: string, scare: Recommendation["scare"]): Recommendation {
  const rec: Recommendation = { kind: e.kind, place: e.place, oneLiner };
  if (e.event) rec.event = e.event;
  if (scare && (e.kind === "spooky" || e.kind === "event")) rec.scare = scare;
  return rec;
}

/** E4: AI가 후보 밖 ID를 말하면 제거, 0이면 상위 후보 기본 노출 */
function buildItems(entries: Entry[], curation: Curation | null, intent: Intent): Recommendation[] {
  const byId = new Map(entries.map((e) => [e.place.id, e]));
  const picked: Recommendation[] = [];
  for (const pick of curation?.picks ?? []) {
    const entry = byId.get(pick.id);
    if (!entry || picked.some((r) => r.place.id === pick.id)) continue;
    picked.push(toRecommendation(entry, sanitizeOneLiner(pick.oneLiner), resolveScare(intent.withKids, pick.scare)));
    if (picked.length === MAX_ITEMS) break;
  }
  if (picked.length > 0) return picked;
  return ALL_KINDS.flatMap((k) => entries.filter((e) => e.kind === k).slice(0, 2))
    .slice(0, MAX_ITEMS)
    .map((e) => toRecommendation(e, SAFE_ONE_LINER, resolveScare(intent.withKids, intent.scare)));
}

/** BR-004·006: 코스는 items 안의 2~4곳, 이벤트(혼잡 거리)는 1곳만 */
function buildCourse(curation: Curation | null, items: Recommendation[]): Course | undefined {
  if (!curation?.course) return undefined;
  const byId = new Map(items.map((r) => [r.place.id, r]));
  const stops: Recommendation[] = [];
  let hasEvent = false;
  for (const id of curation.course.stopIds) {
    const rec = byId.get(id);
    if (!rec || stops.includes(rec) || (rec.kind === "event" && hasEvent)) continue;
    hasEvent ||= rec.kind === "event";
    stops.push(rec);
    if (stops.length === MAX_STOPS) break;
  }
  if (stops.length < MIN_STOPS) return undefined;
  return {
    title: curation.course.title,
    stops: stops.map((rec, i) => {
      const minutes = i > 0 ? walkMinutes(stops[i - 1].place, rec.place) : undefined;
      return { order: i + 1, placeId: rec.place.id, ...(minutes !== undefined && { walkMinutes: minutes }) };
    }),
  };
}

export async function handleChat(req: ChatRequest): Promise<ChatResponse> {
  const today = todayKst();
  try {
    if (mentionsUnsafePlace(req.message)) return error("UNSAFE_PLACE", UNSAFE_PLACE_TEXT);

    const intent = await extractIntent(req.message, req.history, today);
    if (intent.unsafeRequest) return error("UNSAFE_PLACE", UNSAFE_PLACE_TEXT);
    if (intent.outOfScope) {
      return error("OUT_OF_SCOPE", "할로윈 나들이 장소와 코스만 도와드릴 수 있어요. 어느 동네에서 놀지 알려 주세요!");
    }

    const center = await resolveCenter(req, intent);
    if (!center) {
      return { type: "clarify", text: "어느 동네에서 놀까요?", options: CLARIFY_OPTIONS };
    }

    const kinds = wantedKinds(req);
    const [spooky, events] = await Promise.all([
      kinds.includes("spooky") ? findSpooky(center, intent.region) : [],
      kinds.includes("event") ? findEvents(center, intent, today) : [],
    ]);
    const anchor = [...spooky, ...events][0];
    const rest = await findRest(anchor ? toCenter(anchor.place) : center, kinds);
    const entries = dedupe([...spooky, ...events, ...rest]);
    if (entries.length === 0) {
      return error("NO_RESULT", "이 지역에서는 아직 못 찾았어요. 다른 지역을 알려 주시면 다시 찾아볼게요!");
    }

    const curation = await curate({
      message: req.message,
      withKids: intent.withKids,
      scare: intent.scare,
      candidates: entries.map(toCandidate),
    }).catch((e: unknown) => {
      console.error("[chat] curate failed, falling back", e); // E4 기본 노출로 대체
      return null;
    });

    const items = buildItems(entries, curation, intent);
    const crowded = items.some((r) => r.kind === "event") || (intent.region ? isCrowdedArea(intent.region) : false);
    return {
      type: "result",
      text: curation?.text?.trim() || "찾아본 곳들이에요. 방문 전 운영시간은 링크에서 꼭 확인해 주세요.",
      center,
      items,
      course: buildCourse(curation, items),
      ...(crowded && { notices: [CROWD_NOTICE] }),
    };
  } catch (e) {
    if (e instanceof KakaoQuotaError) return error("KAKAO_QUOTA", "유령들이 바빠요. 잠시 후 다시 시도해 주세요.");
    console.error("[chat]", e);
    if (e instanceof GeminiError || e instanceof SyntaxError) {
      return error("UPSTREAM", "지금은 추천을 만들기 어려워요. 잠시 후 다시 시도해 주세요.");
    }
    return error("UPSTREAM", "문제가 생겼어요. 잠시 후 다시 시도해 주세요.");
  }
}
