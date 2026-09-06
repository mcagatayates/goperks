import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { slugify } from "@/lib/slug";
import { createSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/session";

const SignupSchema = z.object({
  restaurantName: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(60).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8),
  address: z.string().trim().min(3).max(200),
  phone: z.string().trim().min(5).max(30),
  description: z.string().trim().max(500).optional(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Formu kontrol edin: " + parsed.error.issues[0]?.message },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const slug = slugify(data.slug || data.restaurantName);
  if (!slug) {
    return NextResponse.json(
      { error: "Geçerli bir URL adı (slug) oluşturulamadı." },
      { status: 400 }
    );
  }

  const [existingSlug, existingEmail] = await Promise.all([
    prisma.restaurant.findUnique({ where: { slug } }),
    prisma.user.findUnique({ where: { email: data.email } }),
  ]);
  if (existingSlug) {
    return NextResponse.json(
      { error: "Bu URL adı (" + slug + ") zaten kullanılıyor." },
      { status: 409 }
    );
  }
  if (existingEmail) {
    return NextResponse.json(
      { error: "Bu e-posta adresiyle zaten bir hesap var." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(data.password);

  const { restaurant, user } = await prisma.$transaction(async (tx) => {
    const restaurant = await tx.restaurant.create({
      data: {
        slug,
        name: data.restaurantName,
        description: data.description || "",
        address: data.address,
        phone: data.phone,
        openTime: data.openTime || "10:00",
        closeTime: data.closeTime || "23:00",
      },
    });
    const user = await tx.user.create({
      data: { email: data.email, passwordHash, restaurantId: restaurant.id },
    });
    return { restaurant, user };
  });

  const token = createSessionToken({
    userId: user.id,
    restaurantId: restaurant.id,
  });
  const response = NextResponse.json({ slug: restaurant.slug }, { status: 201 });
  response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return response;
}
