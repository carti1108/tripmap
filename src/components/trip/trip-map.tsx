"use client";
/**
 * FE-5 카카오맵 (FR-009): 종류별 색 마커 + 코스 순서 번호 + 코스 폴리라인 + 카드↔마커 연동.
 * FE-6 (NFR-006): 키가 없거나 로드 실패 시 안내만 보여 주고, 화면은 아래 카드 목록으로 쓴다.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { MapPinOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Course, Recommendation } from "@/lib/contracts";
import { loadKakaoMaps } from "@/lib/client/kakao-map";
import { KIND_META } from "./kinds";

interface Props {
  center: { lat: number; lng: number };
  items: Recommendation[];
  course?: Course;
  selectedId?: string | null;
  onSelect: (placeId: string) => void;
}

/** 폴리라인은 SVG 속성이라 CSS 변수를 직접 못 쓴다 → 토큰 값을 읽어서 넘긴다 */
function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function TripMap({ center, items, course, selectedId, onSelect }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, { overlay: any; el: HTMLButtonElement; pos: any }>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    let cancelled = false;
    const markers = markersRef.current;
    let line: any = null;

    loadKakaoMaps()
      .then((kakao) => {
        if (cancelled || !boxRef.current) return;
        const { maps } = kakao;
        const map = new maps.Map(boxRef.current, { center: new maps.LatLng(center.lat, center.lng), level: 4 });
        mapRef.current = map;

        const orderOf = new Map(course?.stops.map((s) => [s.placeId, s.order]) ?? []);
        const bounds = new maps.LatLngBounds();

        for (const r of items) {
          const pos = new maps.LatLng(Number(r.place.y), Number(r.place.x));
          bounds.extend(pos);
          const meta = KIND_META[r.kind];
          const order = orderOf.get(r.place.id);
          const el = document.createElement("button");
          el.type = "button";
          el.className = "trip-marker";
          el.style.setProperty("--marker", meta.color);
          el.textContent = order ? String(order) : "";
          el.setAttribute("aria-label", `${meta.label} ${r.event?.title ?? r.place.place_name}`);
          el.addEventListener("click", () => onSelectRef.current(r.place.id));
          const overlay = new maps.CustomOverlay({ position: pos, content: el, yAnchor: 1 });
          overlay.setMap(map);
          markers.set(r.place.id, { overlay, el, pos });
        }

        if (course) {
          const path = [...course.stops]
            .sort((a, b) => a.order - b.order)
            .map((s) => markers.get(s.placeId)?.pos)
            .filter(Boolean);
          if (path.length > 1) {
            line = new maps.Polyline({
              path,
              strokeWeight: 4,
              strokeColor: token("--color-primary"),
              strokeOpacity: 0.9,
              strokeStyle: "shortdash",
            });
            line.setMap(map);
          }
        }
        if (items.length > 1) map.setBounds(bounds, 48, 32, 48, 32);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("failed"));

    return () => {
      cancelled = true;
      line?.setMap(null);
      markers.forEach((m) => m.overlay.setMap(null));
      markers.clear();
      mapRef.current = null;
    };
  }, [center.lat, center.lng, items, course]);

  // 카드 → 마커: 선택된 마커 강조 + 지도 이동
  useEffect(() => {
    markersRef.current.forEach((m, id) => {
      const on = id === selectedId;
      m.el.dataset.selected = String(on);
      m.overlay.setZIndex(on ? 10 : 1);
      if (on) mapRef.current?.panTo(m.pos);
    });
  }, [selectedId, status]);

  if (status === "failed") {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--deep-teal)] p-4 text-sm text-[var(--color-text)]">
        <MapPinOff className="h-5 w-5 flex-none text-[var(--candy)]" aria-hidden />
        <p>지도를 불러오지 못했어요. 아래 목록에서 카카오맵·길찾기 버튼으로 위치를 볼 수 있어요.</p>
      </div>
    );
  }

  return (
    <div className="relative h-64 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--deep-teal)]">
      <div ref={boxRef} className="h-full w-full" role="region" aria-label="추천 장소 지도" />
      {status === "loading" && (
        <p className="absolute inset-0 grid place-items-center text-sm text-[var(--color-text-muted)]">지도를 펴는 중…</p>
      )}
    </div>
  );
}
