import Link from "next/link";

const FEATURES = [
  {
    title: "Instant reservations, 24/7",
    body: "Guests book, change, or cancel a table over web chat or WhatsApp — no hold music, no missed calls.",
  },
  {
    title: "Real-time table availability",
    body: "Checks live table capacity before confirming, so you never get double-booked.",
  },
  {
    title: "Smart upsell",
    body: "Surfaces the chef's specials and seasonal menu at the right moment in the conversation.",
  },
  {
    title: "One dashboard for your team",
    body: "See every reservation and conversation in one place — no more juggling a phone and a paper book.",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col">
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-6 py-24 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-black/50 dark:text-white/50">
          HeyTable
        </p>
        <h1 className="text-4xl font-semibold sm:text-5xl">
          The AI concierge that runs your restaurant&apos;s front desk
        </h1>
        <p className="max-w-2xl text-lg text-black/70 dark:text-white/70">
          HeyTable answers every reservation request — on your website and on
          WhatsApp — books the table, suggests the specials, and never sleeps.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
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

      <section className="mx-auto grid w-full max-w-4xl gap-6 px-6 pb-24 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-black/10 p-6 dark:border-white/10"
          >
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-2 text-sm text-black/60 dark:text-white/60">
              {f.body}
            </p>
          </div>
        ))}
      </section>

      <footer className="mx-auto w-full max-w-4xl px-6 pb-16 text-center text-xs text-black/40 dark:text-white/40">
        MVP prototype — demo restaurant &quot;Masa19&quot; seeded for testing.
      </footer>
    </main>
  );
}
