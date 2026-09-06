import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminDashboard from "@/components/AdminDashboard";

export default async function AdminPageTr(
  props: PageProps<"/tr/admin/[slug]">
) {
  const { slug } = await props.params;

  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant) notFound();

  return (
    <AdminDashboard slug={slug} restaurantName={restaurant.name} locale="tr" />
  );
}
