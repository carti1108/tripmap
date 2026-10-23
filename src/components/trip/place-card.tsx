"use client";
/** FE-4 장소 카드(FR-008) + 이벤트 카드(FR-007). 가격·영업시간·평점은 없으니 "방문 전 확인" 링크로 (BR-003) */
import { ExternalLink, Heart, MapPin, Navigation } from "lucide-react";
import { useEffect, useState } from "react";
import type { Recommendation } from "@/lib/contracts";
import { eventRemainingBadge, shortDate } from "@/lib/client/dates";
import { directionsUrl } from "@/lib/client/kakao-map";
import { useFavorites } from "@/lib/client/favorites";
import { KIND_META, SCARE_LABEL } from "./kinds";

function distanceLabel(m?: string) {
  if (!m) return null;
  const n = Number(m);
  if (!Number.isFinite(n)) return null;
  return n < 1000 ? `${n}m` : `${(n / 1000).toFixed(1)}km`;
}

interface Props {
  item: Recommendation;
  order?: number;
  selected?: boolean;
  onSelect?: (placeId: string) => void;
}

export function PlaceCard({ item, order, selected, onSelect }: Props) {
  const { place, event, kind } = item;
  const meta = KIND_META[kind];
  const fav = useFavorites();
  const saved = fav.has(place.id);
  const title = event?.title ?? place.place_name;
  const [remaining, setRemaining] = useState<string | null>(null);
  useEffect(() => setRemaining(event ? eventRemainingBadge(event.endDate) : null), [event]);
  const distance = distanceLabel(place.distance);

  return (
    <article
      id={`card-${place.id}`}
      onClick={() => onSelect?.(place.id)}
      className="scroll-mt-24 rounded-2xl border bg-[var(--color-surface)] p-4 transition-colors"
      style={{ borderColor: selected ? meta.color : "var(--color-border)" }}
    >
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        {order !== undefined && (
          <span
            className="grid h-5 w-5 place-items-center rounded-full text-[var(--night)]"
            style={{ background: meta.color }}
            aria-label={`코스 ${order}번째`}
          >
            {order}
          </span>
        )}
        <span
          className="rounded-md px-2 py-0.5"
          style={{ color: meta.color, background: `color-mix(in srgb, ${meta.color} 16%, transparent)` }}
        >
          {meta.label}
        </span>
        {remaining && <span className="rounded-md bg-[var(--slime)] px-2 py-0.5 text-[var(--night)]">{remaining}</span>}
        {item.scare && kind !== "food" && kind !== "cafe" && (
          <span
            className="rounded-md border px-2 py-0.5"
            style={
              item.scare === "high"
                ? { borderColor: "var(--color-scare-high)", color: "var(--parchment)", background: "var(--color-scare-high)" }
                : { borderColor: "var(--color-border)", color: "var(--color-text-muted)" }
            }
          >
            공포 {SCARE_LABEL[item.scare]}
          </span>
        )}
        {distance && <span className="ml-auto font-normal text-[var(--color-text-muted)]">{distance}</span>}
      </div>

      <h3 className="mt-2 text-base font-semibold text-[var(--color-text)]">{title}</h3>
      {event ? (
        <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
          {shortDate(event.startDate)} ~ {shortDate(event.endDate)} · {event.venueName}
        </p>
      ) : (
        <p className="mt-0.5 flex items-center gap-1 text-sm text-[var(--color-text-muted)]">
          <MapPin className="h-3.5 w-3.5 flex-none" aria-hidden />
          {place.road_address_name || place.address_name}
        </p>
      )}
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]/90">{item.oneLiner}</p>

      <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
        {event ? (
          <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
            <ExternalLink className="h-4 w-4" aria-hidden />
            출처·기간 확인
          </a>
        ) : (
          <a href={place.place_url} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
            <ExternalLink className="h-4 w-4" aria-hidden />
            카카오맵
          </a>
        )}
        <a href={directionsUrl(place.place_name, place.y, place.x)} target="_blank" rel="noopener noreferrer" className={btnSecondary}>
          <Navigation className="h-4 w-4" aria-hidden />
          길찾기
        </a>
        <button
          type="button"
          aria-pressed={saved}
          aria-label={saved ? "찜 해제" : "찜하기"}
          onClick={() => fav.toggle({ id: place.id, name: title, kind })}
          className="grid h-10 w-10 flex-none place-items-center rounded-xl text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
          style={saved ? { color: "var(--color-primary)" } : undefined}
        >
          <Heart className="h-5 w-5" fill={saved ? "currentColor" : "none"} />
        </button>
      </div>
    </article>
  );
}

const btnBase = "inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-[filter,background-color]";
const btnPrimary = `${btnBase} flex-1 bg-[var(--color-primary)] text-[var(--night)] hover:brightness-110`;
const btnSecondary = `${btnBase} border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--fog)]/30`;
