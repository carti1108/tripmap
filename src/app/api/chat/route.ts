/**
 * POST /api/chat — 소유: 개발자 B. 요청/응답 타입은 src/lib/contracts/chat.ts
 * 지금은 목업을 돌려준다(개발자 A가 바로 붙여볼 수 있게). BE-4에서 실제 구현으로 교체.
 */
import { NextResponse } from "next/server";
import type { ChatRequest, ChatResponse } from "@/lib/contracts";
import { mockClarify, mockResult } from "@/mocks/chat-result";

export async function POST(req: Request) {
  const body = (await req.json()) as ChatRequest;
  const res: ChatResponse = body.message?.trim() ? mockResult : mockClarify;
  return NextResponse.json(res);
}
