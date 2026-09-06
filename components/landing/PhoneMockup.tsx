// A coded (not photographed) iPhone frame showing the AI concierge running
// inside WhatsApp — the landing page's proof that the product lives where
// guests already are. Deliberately not theme-reactive: a device mockup is a
// fixed "photo" of a screen state, so its WhatsApp colors stay put
// regardless of the site's light/dark mode, the same way a real product
// screenshot would.

const SCRIPT: {
  role: "user" | "assistant";
  text: string;
  time: string;
}[] = [
  {
    role: "user",
    text: "Bu akşam 2 kişilik masa var mı, saat 19:30?",
    time: "20:11",
  },
  {
    role: "assistant",
    text: "Evet, 19:30 için T3 masası müsait. İsim ve telefon alabilir miyim?",
    time: "20:11",
  },
  { role: "user", text: "Ayşe Yılmaz, 0555 123 45 67", time: "20:12" },
  {
    role: "assistant",
    text: "Rezervasyonunuz onaylandı. Bu akşamın özel tatlısı Antep fıstıklı künefe — ister misiniz?",
    time: "20:12",
  },
];

function DoubleCheck() {
  return (
    <svg viewBox="0 0 16 11" className="h-3 w-4" fill="none">
      <path
        d="M1 5.5 4 8.5 9.5 1.5"
        stroke="#53BDEB"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 5.5 9 8.5 14.5 1.5"
        stroke="#53BDEB"
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function PhoneMockup() {
  return (
    <div className="relative mx-auto h-[560px] w-[280px]">
      {/* device body */}
      <div className="absolute inset-0 rounded-[3rem] bg-[#0b0b0d] shadow-[0_30px_70px_-20px_rgba(28,22,19,0.45)]">
        {/* side buttons */}
        <span className="absolute -left-[2px] top-24 h-6 w-[3px] rounded-l bg-[#0b0b0d]" />
        <span className="absolute -left-[2px] top-36 h-10 w-[3px] rounded-l bg-[#0b0b0d]" />
        <span className="absolute -left-[2px] top-[11.5rem] h-10 w-[3px] rounded-l bg-[#0b0b0d]" />
        <span className="absolute -right-[2px] top-32 h-14 w-[3px] rounded-r bg-[#0b0b0d]" />

        {/* screen */}
        <div className="absolute inset-[10px] flex flex-col overflow-hidden rounded-[2.4rem] bg-white">
          {/* status bar */}
          <div className="relative flex flex-none items-center justify-between px-6 pb-1 pt-3 text-[11px] font-medium text-black">
            <span>9:41</span>
            <span
              aria-hidden
              className="absolute left-1/2 top-1.5 h-6 w-24 -translate-x-1/2 rounded-full bg-black"
            />
            <div className="flex items-center gap-1">
              <svg viewBox="0 0 18 12" className="h-2.5 w-4" fill="currentColor">
                <rect x="0" y="7" width="3" height="5" rx="0.5" />
                <rect x="4.5" y="5" width="3" height="7" rx="0.5" />
                <rect x="9" y="2.5" width="3" height="9.5" rx="0.5" />
                <rect x="13.5" y="0" width="3" height="12" rx="0.5" />
              </svg>
              <svg viewBox="0 0 24 12" className="h-2.5 w-6" fill="none">
                <rect
                  x="0.5"
                  y="0.5"
                  width="19"
                  height="11"
                  rx="2.5"
                  stroke="currentColor"
                />
                <rect x="2" y="2" width="15" height="8" rx="1.2" fill="currentColor" />
                <rect x="20.5" y="4" width="1.5" height="4" rx="0.7" fill="currentColor" />
              </svg>
            </div>
          </div>

          {/* whatsapp header */}
          <div className="flex flex-none items-center gap-2.5 bg-[#075E54] px-3 py-2.5 text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5 flex-none" fill="none">
              <path
                d="M15 5 8 12l7 7"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#25D366] text-sm font-semibold">
              M
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">Masa19</p>
              <p className="truncate text-[11px] text-white/70">
                AI resepsiyonist · aktif
              </p>
            </div>
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] flex-none" fill="currentColor">
              <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 3.5v-9l-4 3.5Z" />
            </svg>
          </div>

          {/* chat body */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-[#EFE7DE] px-2.5 py-3">
            {SCRIPT.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[78%] rounded-lg px-2.5 py-1.5 text-[13px] leading-snug shadow-sm ${
                    m.role === "user"
                      ? "bg-[#DCF8C6] text-[#111]"
                      : "bg-white text-[#111]"
                  }`}
                >
                  {m.text}
                  <span className="ml-2 mt-0.5 inline-flex translate-y-[3px] items-center gap-1 align-bottom text-[10px] text-black/40">
                    {m.time}
                    {m.role === "user" && <DoubleCheck />}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* input bar */}
          <div className="flex flex-none items-center gap-2 bg-[#EFE7DE] px-2.5 pb-3 pt-1">
            <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-3 py-2 text-[12px] text-black/40">
              <svg viewBox="0 0 24 24" className="h-4 w-4 flex-none" fill="currentColor">
                <path d="M12 2a5 5 0 0 0-5 5v6a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5Zm7 9a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V20H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2.07A7 7 0 0 0 19 11Z" />
              </svg>
              Bir mesaj yazın
            </div>
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[#25D366]">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="currentColor">
                <path d="M3 20V4l18 8-18 8Zm2-3 11.5-5L5 7v3.5L11 12l-6 1.5V17Z" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
