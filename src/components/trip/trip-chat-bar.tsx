"use client";
/**
 * FE-2 채팅바 래퍼 (FR-002) — 원본 src/components/ui/ai-prompt-box.tsx(FROZEN)를 복제해 테마·토글만 바꾼 것.
 * 원본은 토글 상태를 밖으로 내보내지 않아 감싸기로는 toggles 를 전달할 수 없어서 복제했다.
 * - 토글: Search/Think/Canvas → 오싹/이벤트/쉬어가기 (구조·framer-motion 애니메이션 유지, 셋 다 독립 on/off)
 * - 색: design/tokens.css 변수만 (PRD §7.3)
 * - 이미지 첨부·음성 입력은 P2(FR-014·015)라 뺐다.
 */
import React from "react";
import { ArrowUp, CalendarHeart, Coffee, Ghost, Square, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { ChatToggle } from "@/lib/contracts";

const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(" ");

const TOGGLES: Array<{ id: ChatToggle; label: string; icon: LucideIcon; color: string }> = [
  { id: "spooky", label: "오싹", icon: Ghost, color: "var(--pumpkin)" },
  { id: "event", label: "이벤트", icon: CalendarHeart, color: "var(--candy)" },
  { id: "rest", label: "쉬어가기", icon: Coffee, color: "var(--slime)" },
];

const CustomDivider: React.FC = () => (
  <div className="relative mx-1 h-6 w-[1.5px]" aria-hidden>
    <div
      className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-[var(--fog)] to-transparent"
      style={{
        clipPath: "polygon(0% 0%, 100% 0%, 100% 40%, 140% 50%, 100% 60%, 100% 100%, 0% 100%, 0% 60%, -40% 50%, 0% 40%)",
      }}
    />
  </div>
);

interface TripChatBarProps {
  onSend: (message: string, toggles: ChatToggle[]) => void;
  isLoading?: boolean;
  placeholder?: string;
  /** 예시 칩 등 바깥에서 입력창을 채울 때 */
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function TripChatBar({
  onSend,
  isLoading = false,
  placeholder = "할로윈에 어디 갈까? 예) 토요일 홍대 친구 3명 무서운 거",
  value,
  onValueChange,
  className,
}: TripChatBarProps) {
  const [internal, setInternal] = React.useState("");
  const input = value ?? internal;
  const setInput = onValueChange ?? setInternal;
  const [toggles, setToggles] = React.useState<ChatToggle[]>([]);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const reduceMotion = useReducedMotion();

  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`;
  }, [input]);

  const toggle = (id: ChatToggle) =>
    setToggles((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));

  const hasContent = input.trim() !== "";
  const submit = () => {
    if (!hasContent || isLoading) return;
    onSend(input.trim(), toggles);
    setInput("");
  };

  return (
    <div
      className={cn(
        "w-full rounded-3xl border bg-[var(--color-chatbar-bg)] p-2 shadow-[0_8px_30px_rgba(0,0,0,0.24)] transition-all duration-300",
        isLoading ? "border-[var(--pumpkin)]" : "border-[var(--color-chatbar-border)]",
        className,
      )}
    >
      <label htmlFor="trip-chat-input" className="sr-only">할로윈 코스 질문</label>
      <textarea
        id="trip-chat-input"
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit();
          }
        }}
        disabled={isLoading}
        placeholder={placeholder}
        className="min-h-[44px] w-full resize-none border-none bg-transparent px-3 py-2.5 text-base text-[var(--color-chatbar-text)] placeholder:text-[var(--color-text-muted)]/60 focus-visible:outline-none disabled:opacity-60"
      />

      <div className="flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center" role="group" aria-label="찾을 종류">
          {TOGGLES.map(({ id, label, icon: Icon, color }, i) => {
            const on = toggles.includes(id);
            return (
              <React.Fragment key={id}>
                {i > 0 && <CustomDivider />}
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={label}
                  onClick={() => toggle(id)}
                  className={cn(
                    "flex h-8 items-center gap-1 rounded-full border px-2 py-1 transition-all",
                    on ? "" : "border-transparent bg-transparent text-[var(--color-text-muted)]/70 hover:text-[var(--color-chatbar-text)]",
                  )}
                  style={
                    on
                      ? { color, borderColor: color, background: `color-mix(in srgb, ${color} 15%, transparent)` }
                      : undefined
                  }
                >
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center">
                    <motion.div
                      animate={reduceMotion ? undefined : { rotate: on ? 360 : 0, scale: on ? 1.1 : 1 }}
                      whileHover={
                        reduceMotion
                          ? undefined
                          : { rotate: on ? 360 : 15, scale: 1.1, transition: { type: "spring", stiffness: 300, damping: 10 } }
                      }
                      transition={{ type: "spring", stiffness: 260, damping: 25 }}
                    >
                      <Icon className="h-4 w-4" />
                    </motion.div>
                  </div>
                  <AnimatePresence>
                    {on && (
                      <motion.span
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.2 }}
                        className="flex-shrink-0 overflow-hidden whitespace-nowrap text-xs"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!hasContent || isLoading}
          aria-label={isLoading ? "찾는 중" : "보내기"}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200",
            hasContent && !isLoading
              ? "bg-[var(--color-primary)] text-[var(--night)] hover:brightness-110"
              : "bg-transparent text-[var(--color-text-muted)]/60",
          )}
        >
          {isLoading ? <Square className="h-4 w-4 animate-pulse fill-current" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
