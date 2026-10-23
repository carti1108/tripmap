import { CalendarHeart, Coffee, Ghost, Utensils, type LucideIcon } from "lucide-react";
import type { PlaceKind, ScareLevel } from "@/lib/contracts";

/** 종류별 이름·색·아이콘 — 카드 배지와 지도 마커가 같이 쓴다 (FR-009) */
export const KIND_META: Record<PlaceKind, { label: string; color: string; icon: LucideIcon }> = {
  spooky: { label: "오싹", color: "var(--color-kind-spooky)", icon: Ghost },
  event: { label: "이벤트", color: "var(--color-kind-event)", icon: CalendarHeart },
  food: { label: "맛집", color: "var(--color-kind-food)", icon: Utensils },
  cafe: { label: "카페", color: "var(--color-kind-cafe)", icon: Coffee },
};

export const SCARE_LABEL: Record<ScareLevel, string> = { low: "약", mid: "중", high: "강" };
