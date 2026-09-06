import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/restaurants/[slug]/sessions/[id]">
) {
  const { id } = await ctx.params;
  const session = await prisma.conversationSession.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({ session });
}
