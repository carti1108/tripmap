"use client";
import { useState } from "react";
import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import type { ChatRequest, ChatResponse } from "@/lib/contracts";

export function HomeDemo() {
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<ChatResponse | null>(null);

  async function send(message: string) {
    setLoading(true);
    const body: ChatRequest = { message, toggles: [], history: [] };
    try {
      const res = await fetch("/api/chat", { method: "POST", body: JSON.stringify(body) });
      setReply((await res.json()) as ChatResponse);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="flex min-h-dvh w-full flex-col items-center justify-end gap-6 px-4 pb-8"
      style={{ background: "var(--trip-gradient)" }}
    >
      <section className="w-full max-w-[430px] flex-1 pt-16">
        <h1 className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>트릭 오어 트립</h1>
        <p className="mt-2">할로윈, 어디서 놀까?</p>
        {reply && (
          <div className="mt-6 rounded-2xl p-4 text-sm" style={{ background: "var(--color-surface)" }}>
            <p>{reply.text}</p>
            {reply.type === "result" && (
              <ul className="mt-3 list-disc pl-5">
                {reply.items.map((r) => (
                  <li key={r.place.id}>{r.event?.title ?? r.place.place_name} — {r.oneLiner}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
      <div className="w-full max-w-[430px]">
        <PromptInputBox
          isLoading={loading}
          placeholder="예) 토요일 홍대 친구 3명 무서운 거"
          onSend={(m) => send(m)}
        />
      </div>
    </main>
  );
}
