/**
 * 서비스 정책 — 소유: 개발자 B. PRD §9 BR-003·005·006·007.
 */
import type { HalloweenEvent, ScareLevel } from "@/lib/contracts";
import spooky from "../../../content/spooky-keywords.json";

/** BR-005: 실제 폐건물·출입금지 장소 (Gemini 판단과 별개로 서버에서 한 번 더 거른다) */
const UNSAFE_WORDS: readonly string[] = [...spooky.exclude, "폐건물", "폐공장", "폐허", "출입금지", "무단침입"];

export const UNSAFE_PLACE_TEXT =
  "실제 폐가나 출입금지 장소는 위험해서 추천하지 않아요. 대신 방탈출·호러 체험관·귀신의 집처럼 안전하게 즐길 수 있는 공간을 찾아 드릴게요!";

export const CROWD_NOTICE = "할로윈 주말 거리는 혼잡할 수 있어요. 붐비는 시간을 피해 분산해서 다녀오세요.";

/** 혼잡이 몰리는 대표 거리 (BR-006) */
const CROWDED_AREAS: readonly string[] = ["이태원", "홍대", "홍익로", "건대", "성수", "강남역"];

export function mentionsUnsafePlace(text: string): boolean {
  const compact = text.replace(/\s+/g, "");
  return UNSAFE_WORDS.some((w) => compact.includes(w.replace(/\s+/g, "")));
}

export function isCrowdedArea(region: string): boolean {
  return CROWDED_AREAS.some((a) => region.includes(a));
}

/** BR-003: 가격·영업시간·평점·예약 같은 지어낸 정보가 섞인 한 줄 설명은 걸러낸다 */
const FABRICATED_RE = /(\d[\d,]*\s*원|평점|별점|영업\s*시간|\d{1,2}\s*시\s*(오픈|마감|까지)|예약\s*(가능|필수|불가))/;
export const SAFE_ONE_LINER = "방문 전 링크에서 운영 정보를 꼭 확인해 주세요.";

export function sanitizeOneLiner(text: string): string {
  const trimmed = text.trim();
  return trimmed && !FABRICATED_RE.test(trimmed) ? trimmed : SAFE_ONE_LINER;
}

/** BR-007: 아이 동반이면 공포 강도 "low" 고정, 성인용·고강도 이벤트는 제외 */
export function resolveScare(withKids: boolean, scare: ScareLevel | null | undefined): ScareLevel | undefined {
  return withKids ? "low" : (scare ?? undefined);
}

export function isKidSafeEvent(e: HalloweenEvent): boolean {
  return e.audience !== "adult" && e.scare === "low";
}
