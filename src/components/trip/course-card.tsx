"use client";
/** FE-4 코스 카드 (FR-006): 정류장 2~4개 + 구간 도보 시간 */
import { Footprints } from "lucide-react";
import type { Course, Recommendation } from "@/lib/contracts";
import { KIND_META } from "./kinds";

interface Props {
  course: Course;
  items: Recommendation[];
  selectedId?: string | null;
  onSelect: (placeId: string) => void;
}

export function CourseCard({ course, items, selectedId, onSelect }: Props) {
  const byId = new Map(items.map((r) => [r.place.id, r]));
  const stops = [...course.stops].sort((a, b) => a.order - b.order).filter((s) => byId.has(s.placeId));
  const totalWalk = stops.reduce((sum, s) => sum + (s.walkMinutes ?? 0), 0);

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--night)]/80 p-4">
      <p className="text-xs font-semibold tracking-widest text-[var(--candy)]">오늘의 코스</p>
      <h2 className="mt-1 text-lg font-bold text-[var(--color-text)]">{course.title}</h2>
      <p className="text-sm text-[var(--color-text-muted)]">
        {stops.length}곳{totalWalk > 0 && ` · 걸어서 약 ${totalWalk}분`}
      </p>

      <ol className="mt-3 flex flex-col">
        {stops.map((s, i) => {
          const r = byId.get(s.placeId)!;
          const meta = KIND_META[r.kind];
          return (
            <li key={s.placeId}>
              {i > 0 && (
                <p className="flex items-center gap-1.5 py-1 pl-8 text-xs text-[var(--color-text-muted)]">
                  <Footprints className="h-3.5 w-3.5" aria-hidden />
                  {s.walkMinutes ? `도보 ${s.walkMinutes}분` : "도보 이동"}
                </p>
              )}
              <button
                type="button"
                onClick={() => onSelect(s.placeId)}
                aria-current={selectedId === s.placeId}
                className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-[var(--color-surface)]"
                style={selectedId === s.placeId ? { background: "var(--color-surface)" } : undefined}
              >
                <span
                  className="grid h-7 w-7 flex-none place-items-center rounded-full text-sm font-bold text-[var(--night)]"
                  style={{ background: meta.color }}
                >
                  {s.order}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-[var(--color-text)]">
                    {r.event?.title ?? r.place.place_name}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">{meta.label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
