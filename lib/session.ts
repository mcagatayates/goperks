import { createHmac, timingSafeEqual } from "node:crypto";

// Minimal signed-cookie session — no external auth library, just an
// HMAC-SHA256 signature over a JSON payload with an expiry. Verifying the
// signature only proves the cookie wasn't tampered with client-side; it's
// still cheap enough to do in Proxy for an optimistic check (see proxy.ts),
// while the real per-resource check (does this session's restaurant match
// the slug being requested) happens in the page/route itself.
export const SESSION_COOKIE = "heytable_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-only-insecure-secret";

if (!process.env.SESSION_SECRET && process.env.NODE_ENV === "production") {
  console.error(
    "SESSION_SECRET is not set — refusing to sign sessions with the dev fallback in production. Set SESSION_SECRET in .env."
  );
}

export type SessionPayload = {
  userId: string;
  restaurantId: string;
  exp: number; // epoch ms
};

function sign(data: string): string {
  return createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
}

export function createSessionToken(payload: {
  userId: string;
  restaurantId: string;
}): string {
  const data: SessionPayload = {
    ...payload,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

export function verifySessionToken(
  token: string | undefined | null
): SessionPayload | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
