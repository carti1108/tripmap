/**
 * POST /api/chat — 소유: 개발자 B. 요청/응답 타입은 src/lib/contracts/chat.ts
 * 검증 → 요청 제한(BR-008) → handleChat(src/lib/server/chat.ts).
 * 개발 중 Gemini·카카오 없이 화면을 보려면 `CHAT_MOCK=1` (개발자 A용 목업 응답).
 */
import { NextResponse } from "next/server";
import type { ChatRequest, ChatResponse, ChatToggle, ChatTurn } from "@/lib/contracts";
import { handleChat } from "@/lib/server/chat";
import { allowRequest, clientIp } from "@/lib/server/rate-limit";
import { mockClarify, mockResult } from "@/mocks/chat-result";

const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY = 10;
const TOGGLES: readonly string[] = ["spooky", "event", "rest"];

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

function parseLocation(v: unknown): ChatRequest["location"] {
  if (!isRecord(v)) return undefined;
  const { lat, lng } = v;
  const valid = typeof lat === "number" && typeof lng === "number" && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  return valid ? { lat, lng } : undefined;
}

function parseHistory(v: unknown): ChatTurn[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((t): t is ChatTurn => isRecord(t) && (t.role === "user" || t.role === "assistant") && typeof t.text === "string")
    .slice(-MAX_HISTORY)
    .map((t) => ({ role: t.role, text: t.text.slice(0, MAX_MESSAGE_LENGTH) }));
}

/** 외부 입력 → ChatRequest. 형식이 틀리면 null */
function parseRequest(body: unknown): ChatRequest | null {
  if (!isRecord(body) || typeof body.message !== "string") return null;
  const message = body.message.trim();
  if (!message || message.length > MAX_MESSAGE_LENGTH) return null;
  const toggles = Array.isArray(body.toggles)
    ? (body.toggles.filter((t) => TOGGLES.includes(t)) as ChatToggle[])
    : [];
  return { message, toggles, history: parseHistory(body.history), location: parseLocation(body.location) };
}

const STATUS_BY_ERROR = { RATE_LIMITED: 429, KAKAO_QUOTA: 503, UPSTREAM: 502 } as const;

export async function POST(req: Request) {
  const body: unknown = await req.json().catch(() => null);
  const parsed = parseRequest(body);
  if (!parsed) {
    return NextResponse.json({ error: `message is required (1~${MAX_MESSAGE_LENGTH} chars)` }, { status: 400 });
  }

  if (process.env.CHAT_MOCK === "1") {
    const mock: ChatResponse = parsed.message ? mockResult : mockClarify;
    return NextResponse.json(mock);
  }

  if (!allowRequest(clientIp(req))) {
    const limited: ChatResponse = {
      type: "error",
      code: "RATE_LIMITED",
      text: "오늘은 유령들이 너무 많이 일했어요. 잠시 뒤에 다시 물어봐 주세요.",
    };
    return NextResponse.json(limited, { status: 429 });
  }

  const res = await handleChat(parsed);
  const status = res.type === "error" ? (STATUS_BY_ERROR[res.code as keyof typeof STATUS_BY_ERROR] ?? 200) : 200;
  return NextResponse.json(res, { status });
}
