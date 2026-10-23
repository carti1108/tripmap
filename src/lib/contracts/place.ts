/**
 * 공유 계약(CONTRACT) — 개발자 A·B가 함께 쓰는 타입. (PRD v0.3 할로윈 에디션)
 * 소유: 개발자 B (@carti1108) / 변경 시 개발자 A 리뷰 필수.
 * 규칙: 필드 "추가"만 허용. 이름 변경·삭제는 PO 승인 + 양쪽 동시 PR.
 */

/** 카카오 category_group_code 중 이 서비스가 쓰는 것 */
export type KakaoCategoryCode = "FD6" | "CE7" | "AT4" | "CT1";

/** 결과 종류. 채팅바 토글: 오싹=spooky, 이벤트=event, 쉬어가기=food+cafe */
export type PlaceKind = "spooky" | "event" | "food" | "cafe";

export type ChatToggle = "spooky" | "event" | "rest";

export const TOGGLE_TO_KINDS: Record<ChatToggle, PlaceKind[]> = {
  spooky: ["spooky"],
  event: ["event"],
  rest: ["food", "cafe"],
};

/** 공포 강도 (BR-007: 아이 동반이면 "low" 고정) */
export type ScareLevel = "low" | "mid" | "high";

/** 카카오 로컬 검색 응답 document (원본 필드명 유지). 저장 금지 — 화면 표시용 */
export interface Place {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  /** 경도 */
  x: string;
  /** 위도 */
  y: string;
  place_url: string;
  /** 기준 좌표를 줬을 때만 (미터) */
  distance?: string;
}

/** 할로윈 이벤트 — 우리 데이터(content/halloween-events.json, PO 큐레이션). BR-002: 기간·출처 필수 */
export interface HalloweenEvent {
  id: string;
  title: string;
  /** 카카오에서 좌표를 찾을 장소명 */
  venueName: string;
  address: string;
  /** YYYY-MM-DD */
  startDate: string;
  endDate: string;
  sourceUrl: string;
  audience: "kids" | "adult" | "all";
  scare: ScareLevel;
  note?: string;
}

/** AI가 고른 카드 1장 */
export interface Recommendation {
  kind: PlaceKind;
  place: Place;
  /** kind === "event" 일 때 */
  event?: HalloweenEvent;
  /** 한 줄 설명 (BR-003: 가격·영업시간·평점 지어내기 금지) */
  oneLiner: string;
  scare?: ScareLevel;
}

/** 코스 (FR-006): 정류장 2~4개, 순서대로 */
export interface Course {
  title: string;
  stops: Array<{
    order: number;
    /** items 배열 안의 place.id */
    placeId: string;
    /** 이전 정류장에서 걸어서 (분). 첫 정류장은 없음. P1 */
    walkMinutes?: number;
  }>;
}
