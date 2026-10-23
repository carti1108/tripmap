"use client";
/** S1 홈 → S2 대화·결과. /api/chat 호출 (개발 중엔 .env.local 의 CHAT_MOCK=1 로 src/mocks 응답) */
import { Ghost, Heart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ChatRequest, ChatResponse, ChatToggle, ChatTurn } from "@/lib/contracts";
import { useFavorites } from "@/lib/client/favorites";
import { HomeHero } from "./home-hero";
import { ResultView } from "./result-view";
import { TripChatBar } from "./trip-chat-bar";

const FALLBACK_ERROR: ChatResponse = {
  type: "error",
  code: "UPSTREAM",
  text: "유령들이 길을 잃었어요. 잠시 뒤에 다시 물어봐 주세요.",
};

export function TripApp() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ChatTurn[]>([]);
  const [reply, setReply] = useState<ChatResponse | null>(null);
  const [lastToggles, setLastToggles] = useState<ChatToggle[]>([]);
  const fav = useFavorites();

  async function send(message: string, toggles: ChatToggle[]) {
    setLoading(true);
    setLastToggles(toggles);
    const body: ChatRequest = { message, toggles, history };
    setHistory((h) => [...h, { role: "user", text: message }]);
    let res: ChatResponse;
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = (await r.json()) as Partial<ChatResponse>;
      res = json && "type" in json ? (json as ChatResponse) : FALLBACK_ERROR;
    } catch {
      res = FALLBACK_ERROR;
    }
    setReply(res);
    setHistory((h) => [...h, { role: "assistant", text: res.text }]);
    setLoading(false);
  }

  const started = history.length > 0;

  return (
    <div
      className="min-h-dvh w-full"
      style={{ backgroundImage: started ? "none" : "var(--trip-gradient)", backgroundColor: "var(--color-bg)", backgroundAttachment: "fixed" }}
    >
      <header className="sticky top-0 z-20 mx-auto flex h-14 w-full max-w-[430px] items-center justify-between bg-[var(--color-bg)]/85 px-4 backdrop-blur">
        <button type="button" onClick={() => { setHistory([]); setReply(null); }} className="font-black text-[var(--color-primary)]">
          트릭 오어 트립
        </button>
        <Link href="/my-course" className="relative grid h-10 w-10 place-items-center rounded-full text-[var(--color-text)] hover:bg-[var(--color-surface)]" aria-label={`내 할로윈 코스 (${fav.list.length}곳)`}>
          <Heart className="h-5 w-5" />
          {fav.list.length > 0 && (
            <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-[var(--night)]">
              {fav.list.length}
            </span>
          )}
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-[430px] flex-col gap-4 px-4 pb-44">
        {!started && <HomeHero onPickChip={setInput} />}

        {started && (
          <div className="flex flex-col gap-3 pt-2" aria-live="polite">
            {history.map((t, i) => (
              <p
                key={i}
                className={
                  t.role === "user"
                    ? "max-w-[85%] self-end rounded-2xl rounded-br-md bg-[var(--color-primary)] px-3.5 py-2 text-sm text-[var(--night)]"
                    : "max-w-[90%] self-start rounded-2xl rounded-bl-md bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-text)]"
                }
              >
                {t.text}
              </p>
            ))}
            {loading && (
              <p className="flex items-center gap-2 self-start text-sm text-[var(--color-text-muted)]">
                <Ghost className="trip-float h-5 w-5 text-[var(--parchment)]" aria-hidden />
                유령이 찾는 중…
              </p>
            )}
          </div>
        )}

        {!loading && reply?.type === "clarify" && (
          <div className="flex flex-wrap gap-2">
            {reply.options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => send(o, lastToggles)}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-2 text-sm text-[var(--color-text)] hover:border-[var(--color-primary)]"
              >
                {o}
              </button>
            ))}
          </div>
        )}

        {!loading && reply?.type === "result" && <ResultView key={history.length} reply={reply} />}
      </main>

      <div
        className={`fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-6 ${
          started ? "[background:linear-gradient(to_top,var(--color-bg)_60%,transparent)]" : ""
        }`}
      >
        <TripChatBar isLoading={loading} onSend={send} value={input} onValueChange={setInput} />
      </div>
    </div>
  );
}
