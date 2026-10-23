/**
 * 요청 제한 (BR-008: IP 해시 기준 분 10·일 100) — 소유: 개발자 B. 서버 전용.
 * 인메모리라 서버리스 인스턴스마다 따로 센다(배포 시 Redis 등으로 교체 검토: BE-7).
 * IP는 해시만 보관하고 저장소에 남기지 않는다(NFR-005).
 */
import "server-only";
import { createHash } from "node:crypto";

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const PER_MINUTE = 10;
const PER_DAY = 100;
const MAX_TRACKED = 5_000;

const hits = new Map<string, number[]>();

export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

/** true면 요청 허용(기록됨), false면 제한 초과 */
export function allowRequest(ip: string, now: number = Date.now()): boolean {
  const key = hashIp(ip);
  const recent = (hits.get(key) ?? []).filter((t) => now - t < DAY_MS);
  const lastMinute = recent.filter((t) => now - t < MINUTE_MS).length;
  if (lastMinute >= PER_MINUTE || recent.length >= PER_DAY) {
    hits.set(key, recent);
    return false;
  }
  if (hits.size >= MAX_TRACKED && !hits.has(key)) hits.clear(); // 메모리 보호
  hits.set(key, [...recent, now]);
  return true;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
