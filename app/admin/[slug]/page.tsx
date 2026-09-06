import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "@/components/AdminDashboard";
import { getSessionRestaurantId } from "@/lib/auth";

export default async function AdminPage(props: PageProps<"/admin/[slug]">) {
  const { slug } = await props.params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: { owner: true },
  });
  if (!restaurant) notFound();

  // Proxy already redirected anonymous visitors to /giris for non-demo
  // slugs (see proxy.ts); this is the real check that the session actually
  // belongs to *this* restaurant, which needs a database lookup Proxy
  // deliberately skips.
  if (!restaurant.isDemo) {
    const sessionRestaurantId = await getSessionRestaurantId();
    if (sessionRestaurantId !== restaurant.id) {
      redirect(`/giris?next=/admin/${slug}`);
    }
  }

  return (
    <AdminDashboard
      slug={slug}
      restaurantName={restaurant.name}
      ownerEmail={restaurant.owner?.email ?? null}
    />
  );
}
