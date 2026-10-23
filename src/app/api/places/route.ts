/**
 * GET /api/places?query=&category=&x=&y=&radius=&size=&sort= — 소유: 개발자 B (BE-1). 카카오 키워드 검색 프록시.
 */
import { NextResponse } from "next/server";
import type { KakaoCategoryCode } from "@/lib/contracts";
import { KakaoQuotaError, searchKeyword } from "@/lib/server/kakao";

const CATEGORIES: readonly string[] = ["FD6", "CE7", "AT4", "CT1"];
const MAX_QUERY_LENGTH = 100;

function toNumber(value: string | null): number | undefined {
  if (value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;

  const query = sp.get("query")?.trim();
  if (!query || query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: "query is required (1~100 chars)" }, { status: 400 });
  }
  const category = sp.get("category");
  if (category && !CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "invalid category" }, { status: 400 });
  }
  const sort = sp.get("sort") === "distance" ? "distance" : "accuracy";

  try {
    const places = await searchKeyword({
      query,
      category: (category as KakaoCategoryCode | null) ?? undefined,
      x: toNumber(sp.get("x")),
      y: toNumber(sp.get("y")),
      radius: toNumber(sp.get("radius")),
      size: toNumber(sp.get("size")),
      sort,
    });
    return NextResponse.json({ places });
  } catch (e) {
    if (e instanceof KakaoQuotaError) {
      return NextResponse.json({ error: "KAKAO_QUOTA" }, { status: 429 });
    }
    console.error("[api/places]", e);
    return NextResponse.json({ error: "UPSTREAM" }, { status: 502 });
  }
}
