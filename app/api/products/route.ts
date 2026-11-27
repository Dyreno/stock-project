import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatThaiDate } from "@/lib/date";
import { auth } from "@/auth";

// POST - Add Product
export async function POST(request: Request) {
  try {
    // Check Discord login
    const session = await auth();
    const discordId = session?.user?.discordId;

    if (!discordId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();
    const { sku, name, quantity } = body;

    // Validate input
    if (
      typeof sku !== "string" ||
      !sku.trim() ||
      typeof name !== "string" ||
      !name.trim() ||
      !Number.isInteger(quantity) ||
      quantity < 0
    ) {
      return NextResponse.json(
        { error: "Invalid product data" },
        { status: 400 }
      );
    }

    // Create product and activity log atomically
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.products.create({
        data: {
          sku: sku.trim(),
          name: name.trim(),
          quantity,
        },
      });

      // Save activity log
      await tx.activity_logs.create({
        data: {
          discord_id: discordId,
          action: "CREATE_PRODUCT",
          product_id: created.id,
          product_sku: created.sku,
          product_name: created.name,
          details: {
            initial_quantity: created.quantity,
          },
        },
      });

      return created;
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

// GET - Get all products
export async function GET() {
  try {
    const products = await prisma.products.findMany({
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json(
      products.map((product) => ({
        ...product,
        created_at: formatThaiDate(product.created_at),
        updated_at: formatThaiDate(product.updated_at),
      }))
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}