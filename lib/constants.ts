// The seeded demo restaurant the landing page links to directly — its
// dashboard stays open without login. Kept in its own zero-dependency
// module so proxy.ts can import it without pulling in Prisma/next/headers.
export const DEMO_SLUG = "masa19";
