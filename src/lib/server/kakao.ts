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

export interface KeywordSearchParams {
  query: string;
  category?: KakaoCategoryCode;
  x?: number;
  y?: number;
  radius?: number;
  size?: number;
  sort?: "accuracy" | "distance";
}

export async function searchKeyword(_p: KeywordSearchParams): Promise<Place[]> {
  // TODO(BE-1): 구현
  throw new Error("not implemented");
}
