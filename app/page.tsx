import Link from "next/link";
import ChatPreview from "@/components/landing/ChatPreview";

const STEPS = [
  {
    n: "1",
    title: "Guest messages",
    body: "On your website chat or WhatsApp — any time of day, in whatever language they write in.",
  },
  {
    n: "2",
    title: "HeyTable handles it",
    body: "Checks real availability against your actual tables, confirms the booking, and can suggest tonight's specials.",
  },
  {
    n: "3",
    title: "Your team sees everything",
    body: "Every reservation and full conversation transcript lands in one dashboard — no manual entry.",
  },
];

const FEATURES = [
  {
    icon: "💬",
    title: "Web chat + WhatsApp",
    body: "The same AI concierge, wherever guests already are — no app to download.",
  },
  {
    icon: "📅",
    title: "Real-time availability",
    body: "Every confirmation is checked against your actual tables — never double-booked.",
  },
  {
    icon: "✏️",
    title: "Self-serve changes",
    body: "Guests reschedule or cancel by just asking — no phone call, no hold music.",
  },
  {
    icon: "✨",
    title: "Smart upsell",
    body: "Surfaces the chef's specials and seasonal menu at the right moment in the conversation.",
  },
  {
    icon: "🌍",
    title: "Multilingual by default",
    body: "Replies in whatever language the guest writes in — no configuration needed.",
  },
  {
    icon: "📊",
    title: "One dashboard",
    body: "Reservations, tables, specials, and full conversation logs, all in one place.",
  },
];

const AUDIENCES = [
  "Independent restaurants",
  "Multi-location groups",
  "Fine dining",
  "Casual dining & cafés",
];

const CHANNELS = [
  { label: "Web chat", status: "Live" },
  { label: "WhatsApp", status: "Live" },
  { label: "Voice / phone", status: "Coming soon" },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-sm font-semibold tracking-tight">HeyTable</span>
        <div className="flex items-center gap-3">
          <Link
            href="/r/masa19"
            className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition hover:scale-[1.02] dark:bg-white dark:text-neutral-900"
          >
            Live demo
          </Link>
          <Link
            href="/admin/masa19"
            className="rounded-full border border-black/15 px-4 py-2 text-xs font-medium transition hover:border-black/30 dark:border-white/20 dark:hover:border-white/40"
          >
            Dashboard
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-5xl items-center gap-12 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div className="flex flex-col items-start gap-6">
          <p className="text-xs font-medium uppercase tracking-widest text-black/50 dark:text-white/50">
            AI concierge for restaurants
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Your restaurant&apos;s front desk, staffed by AI — 24/7
          </h1>
          <p className="max-w-xl text-lg text-black/70 dark:text-white/70">
            HeyTable answers every reservation request on your website and
            WhatsApp, checks live table availability, confirms instantly, and
            suggests tonight&apos;s specials — so your team can focus on the
            dining room.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/r/masa19"
              className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:scale-[1.02] dark:bg-white dark:text-neutral-900"
            >
              Try the live demo
            </Link>
            <Link
              href="/admin/masa19"
              className="rounded-full border border-black/15 px-6 py-3 text-sm font-medium transition hover:border-black/30 dark:border-white/20 dark:hover:border-white/40"
            >
              See the restaurant dashboard
            </Link>
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <ChatPreview />
        </div>
      </section>

      <section className="border-y border-black/5 bg-black/[0.015] py-6 dark:border-white/5 dark:bg-white/[0.02]">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 text-xs font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
          <span className="normal-case tracking-normal text-black/30 dark:text-white/30">
            Built for
          </span>
          {AUDIENCES.map((a) => (
            <span key={a}>{a}</span>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-5xl px-6 py-20">
        <h2 className="text-center text-2xl font-semibold">How it works</h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="flex flex-col items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900">
                {s.n}
              </span>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-black/60 dark:text-white/60">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-5xl px-6 pb-20">
        <h2 className="text-center text-2xl font-semibold">
          Everything your front desk does — automated
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-black/10 p-6 dark:border-white/10"
            >
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-black/60 dark:text-white/60">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-20">
        <div className="rounded-2xl border border-black/10 p-8 dark:border-white/10">
          <h2 className="font-semibold">Channels</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {CHANNELS.map((c) => (
              <span
                key={c.label}
                className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm dark:border-white/15"
              >
                {c.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.status === "Live"
                      ? "bg-green-500/15 text-green-700 dark:text-green-400"
                      : "bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/50"
                  }`}
                >
                  {c.status}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 pb-24 text-center">
        <h2 className="text-2xl font-semibold">See it running, not just described</h2>
        <p className="max-w-xl text-black/60 dark:text-white/60">
          The live demo is a fully working prototype — book a real table on
          &quot;Masa19&quot;, then check the dashboard to see it land there
          instantly.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/r/masa19"
            className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:scale-[1.02] dark:bg-white dark:text-neutral-900"
          >
            Try the live demo
          </Link>
          <Link
            href="/admin/masa19"
            className="rounded-full border border-black/15 px-6 py-3 text-sm font-medium transition hover:border-black/30 dark:border-white/20 dark:hover:border-white/40"
          >
            See the restaurant dashboard
          </Link>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-16 text-center text-xs text-black/40 dark:text-white/40">
        HeyTable — MVP prototype. Demo restaurant &quot;Masa19&quot; seeded
        for testing.
      </footer>
    </main>
  );
}
