import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";
import { DEMO_SLUG } from "@/lib/constants";

export { DEMO_SLUG };

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return (
    derivedKey.length === expected.length &&
    timingSafeEqual(derivedKey, expected)
  );
}

export async function getSessionRestaurantId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  return payload?.restaurantId ?? null;
}

// Looks up the restaurant by slug and checks the caller's session against
// it. Returns the restaurant on success, or a ready-to-return NextResponse
// (404/401/403) on failure — callers do `const r = await assertRestaurantAccess(slug); if (r instanceof NextResponse) return r;`.
export async function assertRestaurantAccess(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({ where: { slug } });
  if (!restaurant) {
    return NextResponse.json({ error: "Restoran bulunamadı." }, { status: 404 });
  }
  if (restaurant.isDemo) return restaurant;

  const sessionRestaurantId = await getSessionRestaurantId();
  if (!sessionRestaurantId) {
    return NextResponse.json(
      { error: "Bu işlem için giriş yapmanız gerekiyor." },
      { status: 401 }
    );
  }
  if (sessionRestaurantId !== restaurant.id) {
    return NextResponse.json(
      { error: "Bu restorana erişim yetkiniz yok." },
      { status: 403 }
    );
  }
  return restaurant;
}
