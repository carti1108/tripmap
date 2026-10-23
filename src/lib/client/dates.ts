/** 날짜 계산 — 브라우저 현지 날짜 기준 (FR-007·FR-010) */

const DAY = 24 * 60 * 60 * 1000;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** "YYYY-MM-DD" → 그날 0시 (현지) */
export function parseYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 올해 할로윈(10/31)까지 남은 날. 지났으면 음수 */
export function daysUntilHalloween(now = new Date()) {
  const halloween = new Date(now.getFullYear(), 9, 31);
  return Math.round((halloween.getTime() - startOfDay(now).getTime()) / DAY);
}

/** 홈 D-day 배지 문구. 시즌이 끝났으면 null (시즌 종료 화면은 OQ-011 미정) */
export function halloweenBadge(now = new Date()) {
  const left = daysUntilHalloween(now);
  if (left < 0) return null;
  if (left === 0) return "오늘이 할로윈!";
  return `할로윈까지 ${left}일`;
}

/** 이벤트 남은 기간 배지 (FR-007). 끝났으면 null */
export function eventRemainingBadge(endDate: string, now = new Date()) {
  const left = Math.round((parseYmd(endDate).getTime() - startOfDay(now).getTime()) / DAY);
  if (left < 0) return null;
  if (left === 0) return "오늘까지";
  if (left === 1) return "내일까지";
  if (left <= 7) return "이번 주까지";
  return `${left}일 남음`;
}

/** "2026-10-17" → "10.17" */
export function shortDate(ymd: string) {
  const d = parseYmd(ymd);
  return `${d.getMonth() + 1}.${d.getDate()}`;
}
