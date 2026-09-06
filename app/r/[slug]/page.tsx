import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RestaurantPageContent from "@/components/RestaurantPageContent";

export default async function RestaurantPage(props: PageProps<"/r/[slug]">) {
  const { slug } = await props.params;

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: { menuItems: true },
  });

  if (!restaurant) notFound();

  return <RestaurantPageContent restaurant={restaurant} />;
}
