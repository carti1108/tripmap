"use client";
/** FE-3 S1 홈 (FR-010): D-day 배지, 제목, 캐릭터 자리, 예시 칩. 달 그라데이션은 바깥(trip-app)에서 깐다. */
import { useEffect, useState } from "react";
import chips from "../../../content/example-chips.json";
import { halloweenBadge } from "@/lib/client/dates";

const CHARACTER = "/characters/cat-hello.png";

export function HomeHero({ onPickChip }: { onPickChip: (text: string) => void }) {
  // 날짜는 브라우저 기준이라 첫 렌더(서버)에서는 비워 둔다
  const [badge, setBadge] = useState<string | null>(null);
  useEffect(() => setBadge(halloweenBadge()), []);
  // 캐릭터 이미지는 디자이너가 public/characters/ 에 올리면 보인다 (OQ-004 자체 제작)
  const [hasCharacter, setHasCharacter] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setHasCharacter(true);
    img.src = CHARACTER;
  }, []);

  return (
    <section className="flex flex-col items-start gap-5 pt-14">
      <span
        className="inline-flex h-7 items-center rounded-full px-3 text-sm font-semibold text-[var(--night)] transition-opacity"
        style={{ background: "var(--slime)", opacity: badge ? 1 : 0 }}
        aria-hidden={!badge}
      >
        {badge ?? "할로윈까지"}
      </span>

      <div>
        <h1
          aria-label="TRICK or TRIP"
          className="flex items-baseline gap-[0.3em] leading-none"
          style={{ fontFamily: "'Tanker', system-ui, sans-serif", fontWeight: 400 }}
        >
          <span aria-hidden className="text-[64px] text-[var(--pumpkin)]">TRICK</span>
          <span aria-hidden className="text-[28px] text-[var(--slime)]">or</span>
          <span aria-hidden className="text-[64px] text-[var(--leaf-gold)]">TRIP</span>
        </h1>
        <p className="mt-2 text-lg text-[var(--color-text)]">할로윈, 어디서 놀까?</p>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          이벤트·공포체험·저녁·카페를 걸어서 잇는 코스로 짜 드려요.
        </p>
      </div>

      {hasCharacter && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={CHARACTER} alt="안내하는 검은 고양이" width={120} height={120} className="self-end" />
      )}

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-widest text-[var(--candy)]">이렇게 물어보세요</p>
        <div className="flex flex-wrap gap-2">
          {chips.chips.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onPickChip(c)}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/70 px-3.5 py-2 text-left text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)]"
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
