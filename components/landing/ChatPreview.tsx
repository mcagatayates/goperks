const SCRIPT: { role: "user" | "assistant"; text: string }[] = [
  { role: "user", text: "Bu akşam 2 kişilik masa var mı, saat 19:30?" },
  {
    role: "assistant",
    text: "Evet, 19:30 için T3 masası müsait. İsim ve telefon alabilir miyim?",
  },
  { role: "user", text: "Ayşe Yılmaz, 0555 123 45 67" },
  {
    role: "assistant",
    text: "Rezervasyonunuz onaylandı ✅ Bu akşamın özel tatlısı Antep fıstıklı künefe — ister misiniz?",
  },
];

export default function ChatPreview() {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-[var(--background)] shadow-xl dark:border-white/10">
      <div className="flex items-center gap-2 rounded-t-2xl bg-neutral-900 px-4 py-3 dark:bg-neutral-800">
        <span className="h-2 w-2 rounded-full bg-green-400" />
        <p className="text-xs font-medium text-white/80">
          Masa19 · AI concierge
        </p>
      </div>
      <div className="flex flex-col gap-2.5 px-4 py-4">
        {SCRIPT.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <p
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                m.role === "user"
                  ? "bg-neutral-900 text-white dark:bg-neutral-700"
                  : "bg-black/5 dark:bg-white/10"
              }`}
            >
              {m.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
