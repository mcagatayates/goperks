import Link from "next/link";
import ChatPreview from "@/components/landing/ChatPreview";
import { dictionaries, otherLocale, type Locale } from "@/lib/i18n";

export default function LandingPage({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].landing;
  const nav = dictionaries[locale].nav;
  const prefix = locale === "en" ? "" : `/${locale}`;
  const other = otherLocale(locale);
  const otherPrefix = other === "en" ? "" : `/${other}`;

  return (
    <main className="flex min-h-screen flex-col">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-sm font-semibold tracking-tight">HeyTable</span>
        <div className="flex items-center gap-3">
          <Link
            href={`${prefix}/r/masa19`}
            className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-white transition hover:scale-[1.02] dark:bg-white dark:text-neutral-900"
          >
            {nav.liveDemo}
          </Link>
          <Link
            href={`${prefix}/admin/masa19`}
            className="rounded-full border border-black/15 px-4 py-2 text-xs font-medium transition hover:border-black/30 dark:border-white/20 dark:hover:border-white/40"
          >
            {nav.dashboard}
          </Link>
          <Link
            href={`${otherPrefix}/`}
            className="rounded-full px-3 py-2 text-xs font-medium text-black/50 transition hover:text-black/80 dark:text-white/50 dark:hover:text-white/80"
          >
            {other.toUpperCase()}
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid w-full max-w-5xl items-center gap-12 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
        <div className="flex flex-col items-start gap-6">
          <p className="text-xs font-medium uppercase tracking-widest text-black/50 dark:text-white/50">
            {t.heroEyebrow}
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="max-w-xl text-lg text-black/70 dark:text-white/70">
            {t.heroSubtitle}
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`${prefix}/r/masa19`}
              className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:scale-[1.02] dark:bg-white dark:text-neutral-900"
            >
              {t.ctaPrimary}
            </Link>
            <Link
              href={`${prefix}/admin/masa19`}
              className="rounded-full border border-black/15 px-6 py-3 text-sm font-medium transition hover:border-black/30 dark:border-white/20 dark:hover:border-white/40"
            >
              {t.ctaSecondary}
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
            {t.builtForLabel}
          </span>
          {t.audiences.map((a) => (
            <span key={a}>{a}</span>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-5xl px-6 py-20">
        <h2 className="text-center text-2xl font-semibold">
          {t.howItWorksTitle}
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {t.steps.map((s, i) => (
            <div key={s.title} className="flex flex-col items-start gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900">
                {i + 1}
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
          {t.featuresTitle}
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {t.features.map((f) => (
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
          <h2 className="font-semibold">{t.channelsTitle}</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {t.channels.map((c) => (
              <span
                key={c.label}
                className="flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm dark:border-white/15"
              >
                {c.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.isLive
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
        <h2 className="text-2xl font-semibold">{t.closingTitle}</h2>
        <p className="max-w-xl text-black/60 dark:text-white/60">
          {t.closingBody}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`${prefix}/r/masa19`}
            className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-white transition hover:scale-[1.02] dark:bg-white dark:text-neutral-900"
          >
            {t.ctaPrimary}
          </Link>
          <Link
            href={`${prefix}/admin/masa19`}
            className="rounded-full border border-black/15 px-6 py-3 text-sm font-medium transition hover:border-black/30 dark:border-white/20 dark:hover:border-white/40"
          >
            {t.ctaSecondary}
          </Link>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-16 text-center text-xs text-black/40 dark:text-white/40">
        {t.footer}
      </footer>
    </main>
  );
}
