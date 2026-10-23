"use client";
/**
 * FE-7 S4 내 할로윈 코스 (FR-012): 찜 목록 · 순서 바꾸기 · 공유 링크.
 * 공유 링크는 ?c=<id·이름·종류 목록> — 받은 사람은 "내 코스로 담기"로 자기 기기에 저장.
 */
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Share2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { decodeCourse, encodeCourse, useFavorites, writeFavorites, type SavedPlace } from "@/lib/client/favorites";
import { KIND_META } from "./kinds";

/** 카카오 장소 상세 — 저장한 id 로 실시간 조회 (응답 저장 안 함) */
const placeUrl = (id: string) => `https://place.map.kakao.com/${encodeURIComponent(id)}`;

export function MyCourse() {
  const fav = useFavorites();
  const shared = decodeCourse(useSearchParams().get("c") ?? "");
  const viewingShared = shared.length > 0;
  const list = viewingShared ? shared : fav.list;
  const [copied, setCopied] = useState<"ok" | "fail" | null>(null);

  async function share() {
    const url = `${location.origin}/my-course?c=${encodeCourse(fav.list)}`;
    try {
      if (navigator.share) await navigator.share({ title: "내 할로윈 코스", url });
      else await navigator.clipboard.writeText(url);
      setCopied("ok");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setCopied("fail");
    }
  }

  return (
    <div className="min-h-dvh bg-[var(--color-bg)]">
      <main className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 pb-16">
        <header className="flex h-14 items-center gap-2">
          <Link href="/" className="grid h-10 w-10 place-items-center rounded-full text-[var(--color-text)] hover:bg-[var(--color-surface)]" aria-label="홈으로">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-bold text-[var(--color-text)]">{viewingShared ? "공유받은 할로윈 코스" : "내 할로윈 코스"}</h1>
        </header>

        {list.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-muted)]">
            <p>아직 찜한 곳이 없어요.</p>
            <p className="mt-1">추천 카드의 하트를 누르면 여기에 순서대로 모여요.</p>
            <Link href="/" className="mt-4 inline-block font-semibold text-[var(--color-primary)]">코스 찾으러 가기</Link>
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {list.map((p, i) => (
              <Row key={p.id} p={p} i={i} last={i === list.length - 1} readOnly={viewingShared} onMove={fav.move} onRemove={fav.remove} />
            ))}
          </ol>
        )}

        {viewingShared ? (
          <button
            type="button"
            onClick={() => {
              writeFavorites(shared);
              location.replace("/my-course");
            }}
            className="h-12 rounded-xl bg-[var(--color-primary)] font-semibold text-[var(--night)]"
          >
            내 코스로 담기
          </button>
        ) : (
          fav.list.length > 0 && (
            <button
              type="button"
              onClick={share}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] font-semibold text-[var(--night)]"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              공유 링크 만들기
            </button>
          )
        )}
        <p className="min-h-5 text-center text-sm text-[var(--color-text-muted)]" aria-live="polite">
          {copied === "ok" && "링크를 복사했어요."}
          {copied === "fail" && "복사하지 못했어요. 주소창의 링크를 직접 복사해 주세요."}
        </p>
        <p className="text-xs text-[var(--color-text-muted)]">찜 목록은 이 기기에만 저장돼요. 영업시간·가격은 방문 전에 카카오맵에서 확인해 주세요.</p>
      </main>
    </div>
  );
}

function Row({ p, i, last, readOnly, onMove, onRemove }: {
  p: SavedPlace; i: number; last: boolean; readOnly: boolean;
  onMove: (i: number, d: -1 | 1) => void; onRemove: (id: string) => void;
}) {
  const meta = KIND_META[p.kind];
  const iconBtn = "grid h-9 w-9 place-items-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--fog)]/30 disabled:opacity-30";
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <span className="grid h-7 w-7 flex-none place-items-center rounded-full text-sm font-bold text-[var(--night)]" style={{ background: meta.color }}>
        {i + 1}
      </span>
      <a href={placeUrl(p.id)} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1">
        <span className="flex items-center gap-1 truncate text-sm font-semibold text-[var(--color-text)]">
          {p.name}
          <ExternalLink className="h-3.5 w-3.5 flex-none opacity-60" aria-hidden />
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{meta.label}</span>
      </a>
      {!readOnly && (
        <div className="flex">
          <button type="button" className={iconBtn} disabled={i === 0} onClick={() => onMove(i, -1)} aria-label={`${p.name} 위로`}>
            <ChevronUp className="h-4 w-4" />
          </button>
          <button type="button" className={iconBtn} disabled={last} onClick={() => onMove(i, 1)} aria-label={`${p.name} 아래로`}>
            <ChevronDown className="h-4 w-4" />
          </button>
          <button type="button" className={iconBtn} onClick={() => onRemove(p.id)} aria-label={`${p.name} 빼기`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </li>
  );
}
