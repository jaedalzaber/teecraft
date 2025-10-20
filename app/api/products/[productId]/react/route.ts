import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

interface RouteContext {
  params: Promise<{ productId: string }>; // params is now a Promise
}

/**
 * GET → Returns total love count and user's love status
 * /api/products/[productId]/react
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { userId } = getAuth(request);

  // Await params
  const { productId } = await context.params;

  if (!productId) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  try {
    const totalLoves = await prisma.lovedProduct.count({
      where: { productId },
    });

    let userLoved = false;

    if (userId) {
      const existing = await prisma.lovedProduct.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });
      userLoved = !!existing;
    }

    return NextResponse.json({ totalLoves, userLoved }, { status: 200 });
  } catch (error) {
    console.error("[GET_LOVE_ERROR]", error);
    return NextResponse.json({ error: "Failed to load love info" }, { status: 500 });
  }
}

/**
 * POST → Toggles product love/unlove
 * Request body: { action: "love" | "unlove" }
 */
export async function POST(request: NextRequest, context: RouteContext) {
  const { userId } = getAuth(request);
  const { productId } = await context.params;

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!productId) return NextResponse.json({ error: "Product ID required" }, { status: 400 });

  try {
    const { action } = await request.json();

    if (action === "love") {
      await prisma.lovedProduct.upsert({
        where: { userId_productId: { userId, productId } },
        update: {},
        create: { userId, productId },
      });
    } else if (action === "unlove") {
      await prisma.lovedProduct.delete({
        where: { userId_productId: { userId, productId } },
      }).catch(() => null);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Return updated love count
    const totalLoves = await prisma.lovedProduct.count({ where: { productId } });
    const userLoved = action === "love";

    return NextResponse.json({ totalLoves, userLoved }, { status: 200 });
  } catch (error) {
    console.error("[POST_LOVE_ERROR]", error);
    return NextResponse.json({ error: "Failed to update love" }, { status: 500 });
  }
}
