/**
 * 도보 이동시간 추정 (FR-013, BE-6) — 소유: 개발자 B. 서버 전용.
 * 카카오는 도보 경로 API가 없어(자동차만) 직선거리 × 우회 계수 ÷ 보행 속도로 추정한다.
 * 정확한 경로가 필요하면 이 함수 안만 TMAP 등 보행자 경로 API로 바꾸면 된다(호출부 변경 없음).
 */
import "server-only";
import type { Place } from "@/lib/contracts";

const EARTH_RADIUS_M = 6_371_000;
const DETOUR_FACTOR = 1.3; // 직선 → 실제 보행 경로
const WALK_SPEED_M_PER_MIN = 75; // 4.5km/h

const rad = (deg: number) => (deg * Math.PI) / 180;

function straightMeters(a: Place, b: Place): number {
  const [lat1, lng1, lat2, lng2] = [a.y, a.x, b.y, b.x].map((v) => rad(Number(v)));
  const h =
    Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** 두 장소 사이 도보 분(최소 1분). 좌표가 이상하면 undefined */
export function walkMinutes(from: Place, to: Place): number | undefined {
  const meters = straightMeters(from, to);
  if (!Number.isFinite(meters)) return undefined;
  return Math.max(1, Math.round((meters * DETOUR_FACTOR) / WALK_SPEED_M_PER_MIN));
}
