/**
 * Gemini 호출 — 소유: 개발자 B. 서버 전용. REST 직접 호출(추가 패키지 없음).
 * ① 의도 추출(JSON 구조화 출력) ② 큐레이션(카카오 결과 ID 안에서만 선택) — PRD §8.1
 * 키: GEMINI_API_KEY (서버 환경변수), 모델: GEMINI_MODEL (기본 gemini-3.1-flash-lite)
 */
import "server-only";
import type { ChatTurn, ScareLevel } from "@/lib/contracts";

const DEFAULT_MODEL = "gemini-3.1-flash-lite";
const RETRY_STATUSES = [429, 503];
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 800;
const HISTORY_TURNS = 6;

export class GeminiError extends Error {
  constructor(readonly status: number) {
    super(`gemini error: ${status}`);
    this.name = "GeminiError";
  }
}

interface GenerateParams {
  system: string;
  prompt: string;
  /** Gemini responseSchema (OpenAPI 서브셋) */
  schema: Record<string, unknown>;
}

async function generateJson<T>({ system, prompt, schema }: GenerateParams): Promise<T> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const init: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.4 },
    }),
    cache: "no-store",
  };

  // 모델 수요 급증(503)·쿼터(429)는 짧게 재시도
  let res = await fetch(url, init);
  for (let attempt = 1; attempt < MAX_ATTEMPTS && RETRY_STATUSES.includes(res.status); attempt++) {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
    res = await fetch(url, init);
  }
  if (!res.ok) throw new GeminiError(res.status);

  const body = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new GeminiError(502);
  return JSON.parse(text) as T;
}

/* ① 의도 추출 (FR-003) */

export interface Intent {
  /** 동네·도시 이름. 말하지 않았으면 null */
  region: string | null;
  /** YYYY-MM-DD. 말하지 않았으면 null */
  date: string | null;
  partySize: number | null;
  withKids: boolean;
  scare: ScareLevel | null;
  /** 폐가·폐건물·출입금지 장소를 찾는 요청 (BR-005) */
  unsafeRequest: boolean;
  /** 할로윈·나들이와 무관한 요청 */
  outOfScope: boolean;
}

const INTENT_SCHEMA = {
  type: "OBJECT",
  properties: {
    region: { type: "STRING", nullable: true },
    date: { type: "STRING", nullable: true },
    partySize: { type: "INTEGER", nullable: true },
    withKids: { type: "BOOLEAN" },
    scare: { type: "STRING", enum: ["low", "mid", "high"], nullable: true },
    unsafeRequest: { type: "BOOLEAN" },
    outOfScope: { type: "BOOLEAN" },
  },
  required: ["region", "date", "partySize", "withKids", "scare", "unsafeRequest", "outOfScope"],
};

/** 모델이 null 대신 "null"·빈 문자열을 줄 때가 있어 정리 */
const cleanNullable = (v: string | null): string | null => {
  const t = v?.trim();
  return !t || t.toLowerCase() === "null" ? null : t;
};

export async function extractIntent(
  message: string,
  history: ChatTurn[],
  today: string,
): Promise<Intent> {
  const system = [
    "너는 할로윈 나들이 추천 서비스의 의도 추출기다. 사용자 말에서 조건만 JSON으로 뽑는다.",
    `오늘은 ${today}(KST)다. "이번 주 토요일" 같은 상대 날짜는 YYYY-MM-DD로 바꿔라.`,
    "말하지 않은 값은 지어내지 말고 null(withKids는 false)로 둔다. 이전 대화에서 이미 나온 조건은 이어 받는다.",
    "아이·유아·초등 등 아이와 함께면 withKids=true.",
    "폐가·폐건물·폐교·흉가·출입금지 구역을 찾는 요청이면 unsafeRequest=true.",
    "할로윈·놀러 갈 곳 추천과 무관한 요청이면 outOfScope=true.",
  ].join("\n");
  const recent = history
    .slice(-HISTORY_TURNS)
    .map((t) => `${t.role === "user" ? "사용자" : "서비스"}: ${t.text}`)
    .join("\n");
  const prompt = `${recent ? `[이전 대화]\n${recent}\n\n` : ""}[이번 요청]\n${message}`;
  const raw = await generateJson<Intent>({ system, prompt, schema: INTENT_SCHEMA });
  return { ...raw, region: cleanNullable(raw.region), date: cleanNullable(raw.date) };
}

/* ② 큐레이션 (FR-005·006) */

export interface Candidate {
  id: string;
  kind: "spooky" | "event" | "food" | "cafe";
  name: string;
  category: string;
  /** 기준점에서 미터 */
  distance?: string;
  /** kind === "event" 일 때 */
  eventTitle?: string;
  period?: string;
}

export interface CurationInput {
  message: string;
  withKids: boolean;
  scare: ScareLevel | null;
  candidates: Candidate[];
}

export interface Curation {
  text: string;
  picks: { id: string; oneLiner: string; scare: ScareLevel | null }[];
  course: { title: string; stopIds: string[] } | null;
}

const CURATION_SCHEMA = {
  type: "OBJECT",
  properties: {
    text: { type: "STRING" },
    picks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          oneLiner: { type: "STRING" },
          scare: { type: "STRING", enum: ["low", "mid", "high"], nullable: true },
        },
        required: ["id", "oneLiner", "scare"],
      },
    },
    course: {
      type: "OBJECT",
      nullable: true,
      properties: {
        title: { type: "STRING" },
        stopIds: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["title", "stopIds"],
    },
  },
  required: ["text", "picks", "course"],
};

export async function curate(input: CurationInput): Promise<Curation> {
  const system = [
    "너는 귀엽고 으스스한 톤의 할로윈 나들이 큐레이터다.",
    "반드시 [후보] 목록에 있는 id만 골라라. 목록에 없는 장소·이벤트를 말하거나 만들지 마라.",
    "picks는 최대 6개. 각 oneLiner는 한 문장(60자 이내)이고, 가격·영업시간·평점·예약 가능 여부는 절대 쓰지 마라.",
    "course는 picks 중 2~4곳을 걷기 좋은 순서로 잇는다. 이벤트(kind=event)는 코스에 최대 1곳만 넣는다. 코스를 만들 수 없으면 null.",
    "text는 사용자에게 건네는 1~2문장 인사 겸 요약. 운영시간은 링크에서 확인하라는 말을 덧붙여라.",
    input.withKids
      ? "아이와 함께이므로 무섭지 않은 곳 위주로 고르고 모든 scare는 low."
      : `공포 강도 선호: ${input.scare ?? "정해지지 않음(섞어서)"}.`,
  ].join("\n");
  const prompt = `[요청]\n${input.message}\n\n[후보]\n${JSON.stringify(input.candidates)}`;
  return generateJson<Curation>({ system, prompt, schema: CURATION_SCHEMA });
}
