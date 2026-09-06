import Link from "next/link";
import ChatWidget from "@/components/ChatWidget";
import { dictionaries, localePrefix, otherLocale, type Locale } from "@/lib/i18n";

type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  isSpecial: boolean;
};

type Restaurant = {
  slug: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  openTime: string;
  closeTime: string;
  menuItems: MenuItem[];
};

export default function RestaurantPageContent({
  restaurant,
  locale,
}: {
  restaurant: Restaurant;
  locale: Locale;
}) {
  const t = dictionaries[locale].restaurant;
  const specials = restaurant.menuItems.filter((m) => m.isSpecial);
  const menu = restaurant.menuItems.filter((m) => !m.isSpecial);
  const other = otherLocale(locale);
  const otherHref = `${localePrefix(other)}/r/${restaurant.slug}`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-10 px-6 py-16">
      <div className="flex items-center justify-between text-xs font-medium text-muted">
        <Link href="/" className="font-display tracking-tight hover:text-accent">
          {t.poweredBy}
        </Link>
        <Link href={otherHref} className="hover:text-foreground">
          {other.toUpperCase()}
        </Link>
      </div>

      <header className="animate-fade-up flex flex-col gap-3">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
          {restaurant.name}
        </h1>
        <p className="max-w-xl text-muted">{restaurant.description}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
          <span>{restaurant.address}</span>
          <span>{restaurant.phone}</span>
          <span className="tabular-nums">
            {t.openDaily} {restaurant.openTime}–{restaurant.closeTime}
          </span>
        </div>
      </header>

      {specials.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t.specialsTitle}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {specials.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-border p-4 transition hover:border-accent/40"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-medium">{item.name}</p>
                  <p className="tabular-nums text-sm text-muted">
                    ₺{item.price}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted">{item.description}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {menu.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">{t.menuTitle}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {menu.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-2 text-sm"
              >
                <span>{item.name}</span>
                <span className="tabular-nums text-muted">₺{item.price}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl bg-surface p-6 text-sm text-muted">
        {t.chatHint}
      </section>

      <ChatWidget
        restaurantSlug={restaurant.slug}
        restaurantName={restaurant.name}
        locale={locale}
      />
    </main>
  );
}
