"use client";

import { useEffect, useRef, useState } from "react";
import { dictionary } from "@/lib/i18n";
import { IconChat, IconClose, IconSend } from "@/components/icons";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function ChatWidget({
  restaurantSlug,
  restaurantName,
}: {
  restaurantSlug: string;
  restaurantName: string;
}) {
  const t = dictionary.chat;
  const [open, setOpen] = useState(false);
  const storageKey = `heytable:session:${restaurantSlug}`;
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  });
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: t.greeting(restaurantName),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantSlug,
          sessionId,
          message: text,
          channel: "web",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t.genericError);

      setSessionId(data.sessionId);
      try {
        localStorage.setItem(storageKey, data.sessionId);
      } catch {
        // ignore
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      <div
        aria-hidden={!open}
        className={`flex h-[32rem] w-[22rem] max-w-[calc(100vw-2.5rem)] origin-bottom-right flex-col overflow-hidden rounded-2xl bg-background shadow-[0_24px_60px_-12px_rgba(28,22,19,0.35)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-3 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between bg-foreground px-4 py-3 text-background">
          <div>
            <p className="text-sm font-semibold">{restaurantName}</p>
            <p className="text-xs text-background/60">{t.headerSubtitle}</p>
          </div>
          <button
            aria-label={t.closeAria}
            onClick={() => setOpen(false)}
            className="text-background/70 transition hover:text-background"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-surface"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl bg-surface px-3 py-2.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
              </div>
            </div>
          )}
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2 border-t border-border p-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.inputPlaceholder}
            className="flex-1 rounded-full border border-border bg-transparent px-3 py-2 text-sm outline-none transition focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label={t.send}
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-foreground text-background transition disabled:opacity-40"
          >
            <IconSend className="h-4 w-4" />
          </button>
        </form>
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background shadow-lg transition hover:scale-[1.03]"
      >
        {open ? (
          <IconClose className="h-4 w-4" />
        ) : (
          <IconChat className="h-4 w-4" />
        )}
        {open ? t.bubbleClose : t.bubbleOpen}
      </button>
    </div>
  );
}
