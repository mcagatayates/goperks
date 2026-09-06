import Link from "next/link";
import ChatWidget from "@/components/ChatWidget";
import { dictionaries, otherLocale, type Locale } from "@/lib/i18n";

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
  const otherHref =
    other === "en" ? `/r/${restaurant.slug}` : `/tr/r/${restaurant.slug}`;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-widest text-black/50 dark:text-white/50">
            {t.poweredBy}
          </p>
          <Link
            href={otherHref}
            className="rounded-full px-3 py-1 text-xs font-medium text-black/50 transition hover:text-black/80 dark:text-white/50 dark:hover:text-white/80"
          >
            {other.toUpperCase()}
          </Link>
        </div>
        <h1 className="text-4xl font-semibold">{restaurant.name}</h1>
        <p className="max-w-xl text-black/70 dark:text-white/70">
          {restaurant.description}
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-black/60 dark:text-white/60">
          <span>{restaurant.address}</span>
          <span>{restaurant.phone}</span>
          <span>
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
                className="rounded-xl border border-black/10 p-4 dark:border-white/10"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-black/60 dark:text-white/60">
                    ₺{item.price}
                  </p>
                </div>
                <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                  {item.description}
                </p>
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
                <span className="text-black/50 dark:text-white/50">
                  ₺{item.price}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-black/10 bg-black/[0.02] p-6 text-sm text-black/70 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/70">
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
