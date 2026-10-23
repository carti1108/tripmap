/**
 * GET /api/places?query=&category=&x=&y= — 소유: 개발자 B (BE-1). 카카오 키워드 검색 프록시.
 */
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "not implemented" }, { status: 501 });
}
