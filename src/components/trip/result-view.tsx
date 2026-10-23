"use client";
/** FE-4 S2 결과: 지도 + 탭(코스/오싹/이벤트/쉬어가기) + 카드. 카드↔마커는 selectedId 로 연동 */
import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import type { PlaceKind, ResultReply } from "@/lib/contracts";
import { CourseCard } from "./course-card";
import { PlaceCard } from "./place-card";
import { TripMap } from "./trip-map";

type Tab = "course" | "spooky" | "event" | "rest";
const TABS: Array<{ id: Tab; label: string; kinds: PlaceKind[] }> = [
  { id: "course", label: "코스", kinds: [] },
  { id: "spooky", label: "오싹", kinds: ["spooky"] },
  { id: "event", label: "이벤트", kinds: ["event"] },
  { id: "rest", label: "쉬어가기", kinds: ["food", "cafe"] },
];

export function ResultView({ reply }: { reply: ResultReply }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>(reply.course ? "course" : "spooky");
  const orderOf = new Map(reply.course?.stops.map((s) => [s.placeId, s.order]) ?? []);

  const visibleTabs = TABS.filter((t) =>
    t.id === "course" ? !!reply.course : reply.items.some((r) => t.kinds.includes(r.kind)),
  );
  const current = visibleTabs.find((t) => t.id === tab) ?? visibleTabs[0];
  const cards =
    current?.id === "course"
      ? [...reply.items].sort((a, b) => (orderOf.get(a.place.id) ?? 99) - (orderOf.get(b.place.id) ?? 99))
      : reply.items.filter((r) => current?.kinds.includes(r.kind));

  // 마커 → 카드: 그 카드가 보이는 탭으로 옮기고 스크롤
  function selectFromMap(id: string) {
    setSelectedId(id);
    const item = reply.items.find((r) => r.place.id === id);
    if (item && current && current.id !== "course" && !current.kinds.includes(item.kind)) setTab("course");
    requestAnimationFrame(() =>
      document.getElementById(`card-${id}`)?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "nearest",
      }),
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <TripMap center={reply.center} items={reply.items} course={reply.course} selectedId={selectedId} onSelect={selectFromMap} />

      {reply.notices?.map((n) => (
        <p key={n} className="flex gap-2 rounded-xl border border-[var(--leaf-red)] bg-[var(--maroon)]/60 p-3 text-sm text-[var(--color-text)]" role="note">
          <TriangleAlert className="h-4 w-4 flex-none translate-y-0.5 text-[var(--candy)]" aria-hidden />
          {n}
        </p>
      ))}

      {reply.course && <CourseCard course={reply.course} items={reply.items} selectedId={selectedId} onSelect={selectFromMap} />}

      <div role="tablist" aria-label="결과 종류" className="flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--night)]/80 p-1">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={current?.id === t.id}
            onClick={() => setTab(t.id)}
            className="h-9 flex-1 rounded-lg text-sm font-semibold text-[var(--color-text-muted)] transition-colors aria-selected:bg-[var(--color-surface)] aria-selected:text-[var(--color-text)]"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="flex flex-col gap-3">
        {cards.map((r) => (
          <PlaceCard key={r.place.id} item={r} order={orderOf.get(r.place.id)} selected={selectedId === r.place.id} onSelect={setSelectedId} />
        ))}
      </div>
    </div>
  );
}
