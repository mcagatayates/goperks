"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export default function ChatWidget({
  restaurantSlug,
  restaurantName,
}: {
  restaurantSlug: string;
  restaurantName: string;
}) {
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
      content: `Hi! I'm the ${restaurantName} reservations concierge. I can book, change, or cancel a table for you — what would you like to do?`,
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
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");

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
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[32rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-black/10 bg-[var(--background)] shadow-2xl dark:border-white/10">
          <div className="flex items-center justify-between bg-neutral-900 px-4 py-3 text-white dark:bg-neutral-800">
            <div>
              <p className="text-sm font-semibold">{restaurantName}</p>
              <p className="text-xs text-white/60">AI reservations concierge</p>
            </div>
            <button
              aria-label="Close chat"
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white"
            >
              ✕
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
                      ? "bg-neutral-900 text-white dark:bg-neutral-700"
                      : "bg-black/5 dark:bg-white/10"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl bg-black/5 px-3 py-2 text-sm text-black/50 dark:bg-white/10 dark:text-white/50">
                  Typing…
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
            className="flex gap-2 border-t border-black/10 p-3 dark:border-white/10"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a table…"
              className="flex-1 rounded-full border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-black/30 dark:border-white/15 dark:focus:border-white/40"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-lg transition hover:scale-[1.03] dark:bg-white dark:text-neutral-900"
      >
        {open ? "Close" : "💬 Reserve a table"}
      </button>
    </div>
  );
}
