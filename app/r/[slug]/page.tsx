import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ChatWidget from "@/components/ChatWidget";

export default async function RestaurantPage(
  props: PageProps<"/r/[slug]">
) {
  const { slug } = await props.params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: { menuItems: true },
  });

  if (!restaurant) notFound();

  const specials = restaurant.menuItems.filter((m) => m.isSpecial);
  const menu = restaurant.menuItems.filter((m) => !m.isSpecial);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-widest text-black/50 dark:text-white/50">
          Powered by HeyTable
        </p>
        <h1 className="text-4xl font-semibold">{restaurant.name}</h1>
        <p className="max-w-xl text-black/70 dark:text-white/70">
          {restaurant.description}
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-black/60 dark:text-white/60">
          <span>{restaurant.address}</span>
          <span>{restaurant.phone}</span>
          <span>
            Open daily {restaurant.openTime}–{restaurant.closeTime}
          </span>
        </div>
      </header>

      {specials.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Today&apos;s specials</h2>
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
          <h2 className="mb-3 text-lg font-semibold">Menu</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {menu.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-2 text-sm">
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
        Tap the chat bubble in the corner to book, change, or cancel a table —
        our AI concierge answers instantly, any time of day.
      </section>

      <ChatWidget restaurantSlug={restaurant.slug} restaurantName={restaurant.name} />
    </main>
  );
}
