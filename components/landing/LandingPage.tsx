import Link from "next/link";
import ChatPreview from "@/components/landing/ChatPreview";
import { dictionaries, otherLocale, type Locale } from "@/lib/i18n";
import {
  IconArrowRight,
  IconCalendar,
  IconChart,
  IconChat,
  IconCheck,
  IconClock,
  IconEdit,
  IconGlobe,
  IconSparkle,
} from "@/components/icons";

const FEATURE_ICONS = [
  IconChat,
  IconCalendar,
  IconEdit,
  IconSparkle,
  IconGlobe,
  IconChart,
];

export default function LandingPage({ locale }: { locale: Locale }) {
  const t = dictionaries[locale].landing;
  const nav = dictionaries[locale].nav;
  const prefix = locale === "en" ? "" : `/${locale}`;
  const other = otherLocale(locale);
  const otherPrefix = other === "en" ? "" : `/${other}`;

  return (
    <main className="flex min-h-screen flex-col">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg tracking-tight">HeyTable</span>
        <div className="flex items-center gap-2">
          <Link
            href={`${prefix}/r/masa19`}
            className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition hover:scale-[1.02]"
          >
            {nav.liveDemo}
          </Link>
          <Link
            href={`${prefix}/admin/masa19`}
            className="rounded-full border border-border px-4 py-2 text-xs font-medium transition hover:border-accent/50 hover:text-accent"
          >
            {nav.dashboard}
          </Link>
          <Link
            href={`${otherPrefix}/`}
            className="rounded-full px-3 py-2 text-xs font-medium text-muted transition hover:text-foreground"
          >
            {other.toUpperCase()}
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, var(--color-accent-soft), transparent 70%)",
          }}
        />
        <div className="relative mx-auto grid w-full max-w-5xl items-center gap-12 px-6 py-16 md:grid-cols-[1.1fr_0.9fr] md:py-24">
          <div className="animate-fade-up flex flex-col items-start gap-6">
            <h1 className="font-display max-w-xl text-5xl leading-[1.05] tracking-tight sm:text-6xl">
              {t.heroTitle}
            </h1>
            <p className="max-w-xl text-lg text-muted">{t.heroSubtitle}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`${prefix}/r/masa19`}
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:scale-[1.02]"
              >
                {t.ctaPrimary}
                <IconArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={`${prefix}/admin/masa19`}
                className="rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:border-accent/50 hover:text-accent"
              >
                {t.ctaSecondary}
              </Link>
            </div>
          </div>

          <div className="animate-fade-up [animation-delay:150ms] flex justify-center md:justify-end">
            <ChatPreview />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-surface py-6">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 text-xs font-medium uppercase tracking-wide text-muted">
          <span className="text-muted/70">{t.builtForLabel}</span>
          {t.audiences.map((a) => (
            <span key={a}>{a}</span>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-5xl px-6 py-24">
        <h2 className="font-display max-w-md text-3xl tracking-tight">
          {t.howItWorksTitle}
        </h2>
        <div className="relative mt-14 grid gap-12 sm:grid-cols-3">
          <div
            aria-hidden
            className="absolute left-0 right-0 top-6 hidden h-px bg-border sm:block"
          />
          {t.steps.map((s, i) => (
            <div key={s.title} className="relative flex flex-col gap-3">
              <span className="font-display relative z-10 w-fit bg-background pr-4 text-4xl text-accent">
                {i + 1}
              </span>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-5xl px-6 pb-24">
        <h2 className="font-display max-w-md text-3xl tracking-tight">
          {t.featuresTitle}
        </h2>
        <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2">
          {t.features.map((f, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <div key={f.title} className="flex gap-4">
                <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent-soft text-accent">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted">{f.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="rounded-2xl border border-border p-8">
          <h2 className="font-semibold">{t.channelsTitle}</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {t.channels.map((c) => (
              <span
                key={c.label}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"
              >
                {c.label}
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    c.isLive
                      ? "bg-accent-soft text-accent"
                      : "bg-surface text-muted"
                  }`}
                >
                  {c.isLive ? (
                    <IconCheck className="h-3 w-3" />
                  ) : (
                    <IconClock className="h-3 w-3" />
                  )}
                  {c.status}
                </span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 pb-28 text-center">
        <h2 className="font-display max-w-lg text-3xl tracking-tight">
          {t.closingTitle}
        </h2>
        <p className="max-w-xl text-muted">{t.closingBody}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href={`${prefix}/r/masa19`}
            className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:scale-[1.02]"
          >
            {t.ctaPrimary}
          </Link>
          <Link
            href={`${prefix}/admin/masa19`}
            className="rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:border-accent/50 hover:text-accent"
          >
            {t.ctaSecondary}
          </Link>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-16 text-center text-xs text-muted">
        {t.footer}
      </footer>
    </main>
  );
}
