/**
 * 목업 응답 — 소유: 개발자 B. 개발자 A는 /api/chat 완성 전까지 이걸로 화면을 만든다.
 * ⚠️ 전부 가짜 데이터(예시 이름·좌표·URL). 실제 장소·이벤트가 아니다.
 */
import type { ChatResponse } from "@/lib/contracts";

const base = { phone: "", category_group_code: "", place_url: "https://map.kakao.com/" };

export const mockResult: ChatResponse = {
  type: "result",
  text: "토요일 홍대 근처, 친구 셋이 즐길 오싹 코스예요. 방문 전 운영시간은 링크에서 꼭 확인해 주세요.",
  center: { lat: 37.5563, lng: 126.9236 },
  notices: ["할로윈 주말 거리는 혼잡할 수 있어요. 붐비는 시간을 피해 분산해서 다녀오세요."],
  items: [
    {
      kind: "event", scare: "low",
      oneLiner: "포토존과 분장 체험이 있는 기간 한정 할로윈 이벤트.",
      place: { ...base, id: "mock-event-venue", place_name: "예시 쇼핑몰", category_name: "가정,생활 > 쇼핑몰", address_name: "서울 마포구 예시동 1", road_address_name: "서울 마포구 예시로 1", x: "126.9240", y: "37.5570", distance: "120" },
      event: { id: "evt-mock-1", title: "예시 할로윈 페스타", venueName: "예시 쇼핑몰", address: "서울 마포구 예시로 1", startDate: "2026-10-17", endDate: "2026-10-31", sourceUrl: "https://example.com/halloween", audience: "all", scare: "low" },
    },
    {
      kind: "spooky", scare: "high",
      oneLiner: "공포 테마 방탈출. 겁 많은 친구가 있다면 강도 낮은 테마로.",
      place: { ...base, id: "mock-spooky-1", place_name: "예시 공포 방탈출", category_name: "가정,생활 > 여가시설 > 방탈출카페", category_group_code: "", address_name: "서울 마포구 예시동 2", road_address_name: "서울 마포구 예시로 2", x: "126.9221", y: "37.5552", distance: "350" },
    },
    {
      kind: "food",
      oneLiner: "체험 끝나고 따뜻하게 먹기 좋은 곳.",
      place: { ...base, id: "mock-food-1", place_name: "예시 식당", category_name: "음식점 > 한식", category_group_code: "FD6", address_name: "서울 마포구 예시동 3", road_address_name: "서울 마포구 예시로 3", x: "126.9210", y: "37.5560", distance: "420" },
    },
    {
      kind: "cafe",
      oneLiner: "호박 디저트로 마무리.",
      place: { ...base, id: "mock-cafe-1", place_name: "예시 카페", category_name: "음식점 > 카페", category_group_code: "CE7", address_name: "서울 마포구 예시동 4", road_address_name: "서울 마포구 예시로 4", x: "126.9250", y: "37.5548", distance: "500" },
    },
  ],
  course: {
    title: "해 질 녘 오싹 코스",
    stops: [
      { order: 1, placeId: "mock-event-venue" },
      { order: 2, placeId: "mock-spooky-1", walkMinutes: 6 },
      { order: 3, placeId: "mock-food-1", walkMinutes: 4 },
      { order: 4, placeId: "mock-cafe-1", walkMinutes: 5 },
    ],
  },
};

export const mockClarify: ChatResponse = {
  type: "clarify",
  text: "어느 동네에서 놀까요?",
  options: ["서울 홍대", "서울 잠실", "경기 용인", "부산 서면"],
};
