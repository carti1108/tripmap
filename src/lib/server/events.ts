/**
 * 할로윈 이벤트 로더 — 소유: 개발자 B (BE-2). 서버 전용.
 * 데이터: content/halloween-events.json (PO 큐레이션, 읽기만). BR-002: 기간·출처 없는 건 제외.
 */
import "server-only";
import type { HalloweenEvent } from "@/lib/contracts";
import raw from "../../../content/halloween-events.json";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export interface EventFilter {
  /** 기간 시작 (YYYY-MM-DD). 기본: 오늘(KST) */
  from?: string;
  /** 요청 날짜 (YYYY-MM-DD). 없으면 종료 안 된 이벤트 전부 */
  to?: string;
  /** 지역명 (예: "홍대", "성수"). 주소·장소명·제목에 포함되면 통과. 없으면 전국 */
  region?: string;
}

/** 오늘 날짜 (KST, YYYY-MM-DD) */
export function todayKst(now: Date = new Date()): string {
  return new Date(now.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}

/** BR-002: 기간(시작≤종료)과 출처 URL이 모두 있는 이벤트만 통과 */
function isPublishable(e: Partial<HalloweenEvent>): e is HalloweenEvent {
  return (
    typeof e.id === "string" &&
    typeof e.title === "string" &&
    isValidDate(e.startDate) &&
    isValidDate(e.endDate) &&
    e.startDate <= e.endDate &&
    typeof e.sourceUrl === "string" &&
    e.sourceUrl.trim() !== ""
  );
}

const normalize = (s: string) => s.replace(/\s+/g, "").toLowerCase();

function matchesRegion(e: HalloweenEvent, region: string): boolean {
  const needle = normalize(region);
  return [e.address, e.venueName, e.title].some((field) => normalize(field ?? "").includes(needle));
}

/** 필터링 로직 (데이터를 인자로 받아 테스트 가능) */
export function filterEvents(events: Partial<HalloweenEvent>[], f: EventFilter = {}): HalloweenEvent[] {
  const from = isValidDate(f.from) ? f.from : todayKst();
  const to = isValidDate(f.to) ? f.to : undefined;
  const region = f.region?.trim();

  return events.filter(isPublishable).filter((e) => {
    // 기간이 [from, to]와 겹치는지. to가 없으면 아직 안 끝난 이벤트
    if (e.endDate < from) return false;
    if (to && e.startDate > to) return false;
    return !region || matchesRegion(e, region);
  });
}

export function loadEvents(filter: EventFilter = {}): HalloweenEvent[] {
  return filterEvents(raw.events as Partial<HalloweenEvent>[], filter);
}
