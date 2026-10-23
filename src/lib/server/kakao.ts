/**
 * 카카오 로컬 REST 호출 — 소유: 개발자 B. 서버 전용 (브라우저 import 금지).
 * 문서: https://developers.kakao.com/docs/latest/ko/local/dev-guide
 * - 키워드 검색: GET https://dapi.kakao.com/v2/local/search/keyword.json
 * - 카테고리 검색: GET https://dapi.kakao.com/v2/local/search/category.json
 * - 헤더: Authorization: KakaoAK ${KAKAO_REST_API_KEY}
 * - size ≤ 15, page ≤ 45, radius ≤ 20000, sort=accuracy|distance(x,y 필요)
 * - 응답 저장 금지(실시간 호출만). 429 = 쿼터 초과.
 */
import "server-only";
import type { KakaoCategoryCode, Place } from "@/lib/contracts";

const KEYWORD_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";
const MAX_SIZE = 15;
const MAX_RADIUS = 20000;

export interface KeywordSearchParams {
  query: string;
  category?: KakaoCategoryCode;
  x?: number;
  y?: number;
  radius?: number;
  size?: number;
  sort?: "accuracy" | "distance";
}

/** 카카오 쿼터 초과(429) — 호출부에서 KAKAO_QUOTA 응답으로 변환 */
export class KakaoQuotaError extends Error {
  constructor() {
    super("kakao quota exceeded");
    this.name = "KakaoQuotaError";
  }
}

export class KakaoUpstreamError extends Error {
  constructor(readonly status: number) {
    super(`kakao upstream error: ${status}`);
    this.name = "KakaoUpstreamError";
  }
}

export async function searchKeyword(p: KeywordSearchParams): Promise<Place[]> {
  const key = process.env.KAKAO_REST_API_KEY;
  if (!key) throw new Error("KAKAO_REST_API_KEY is not set");

  const hasCenter = p.x !== undefined && p.y !== undefined;
  const params = new URLSearchParams({
    query: p.query,
    size: String(Math.min(p.size ?? MAX_SIZE, MAX_SIZE)),
    // distance 정렬은 기준 좌표가 있어야 함
    sort: hasCenter && p.sort === "distance" ? "distance" : "accuracy",
  });
  if (p.category) params.set("category_group_code", p.category);
  if (hasCenter) {
    params.set("x", String(p.x));
    params.set("y", String(p.y));
    if (p.radius !== undefined) {
      params.set("radius", String(Math.min(p.radius, MAX_RADIUS)));
    }
  }

  const res = await fetch(`${KEYWORD_URL}?${params}`, {
    headers: { Authorization: `KakaoAK ${key}` },
    cache: "no-store", // BR-009: 카카오 응답 저장·캐시 금지
  });
  if (res.status === 429) throw new KakaoQuotaError();
  if (!res.ok) throw new KakaoUpstreamError(res.status);

  const body = (await res.json()) as { documents: Place[] };
  return body.documents;
}
