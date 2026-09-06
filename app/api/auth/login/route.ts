import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { createSessionToken, SESSION_COOKIE, SESSION_COOKIE_OPTIONS } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.json();
  const { email, password } = body as { email?: string; password?: string };

  if (!email || !password) {
    return NextResponse.json(
      { error: "E-posta ve şifre gereklidir." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim() },
    include: { restaurant: true },
  });

  const valid = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !valid) {
    return NextResponse.json(
      { error: "E-posta veya şifre hatalı." },
      { status: 401 }
    );
  }

  const token = createSessionToken({
    userId: user.id,
    restaurantId: user.restaurantId,
  });
  const response = NextResponse.json({ slug: user.restaurant.slug });
  response.cookies.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS);
  return response;
}
