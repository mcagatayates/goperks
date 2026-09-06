import Link from "next/link";
import PhoneMockup from "@/components/landing/PhoneMockup";
import { dictionaries, localePrefix, otherLocale, type Locale } from "@/lib/i18n";
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
  const prefix = localePrefix(locale);
  const other = otherLocale(locale);
  const otherPrefix = localePrefix(other);

  return (
    <main className="flex min-h-screen flex-col">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg tracking-tight">HeyTable</span>
        <div className="flex items-center gap-2">
          <Link
            href="#pricing"
            className="hidden rounded-full px-3 py-2 text-xs font-medium text-muted transition hover:text-foreground sm:inline-block"
          >
            {nav.pricing}
          </Link>
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
            <PhoneMockup />
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

      <section id="pricing" className="mx-auto w-full max-w-5xl px-6 pb-24">
        <div className="mx-auto max-w-lg text-center">
          <h2 className="font-display text-3xl tracking-tight">
            {t.pricingTitle}
          </h2>
          <p className="mt-3 text-muted">{t.pricingSubtitle}</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {t.pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-2xl p-6 ${
                tier.highlighted
                  ? "border-2 border-accent shadow-[0_20px_50px_-20px_rgba(181,80,46,0.35)] sm:-translate-y-2"
                  : "border border-border"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{tier.name}</h3>
                {"badge" in tier && tier.badge && (
                  <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
                    {tier.badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted">{tier.description}</p>
              <p className="font-display mt-5 text-3xl tracking-tight">
                {tier.price}
                <span className="text-base font-sans text-muted">
                  {tier.period}
                </span>
              </p>
              <ul className="mt-6 flex flex-1 flex-col gap-2.5 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <IconCheck className="mt-0.5 h-4 w-4 flex-none text-accent" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={`${prefix}/admin/masa19`}
                className={`mt-6 rounded-full px-5 py-2.5 text-center text-sm font-medium transition hover:scale-[1.02] ${
                  tier.highlighted
                    ? "bg-foreground text-background"
                    : "border border-border hover:border-accent/50 hover:text-accent"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          {t.pricingOverage} {t.pricingBillingNote}
        </p>
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
