import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatThaiDate } from "@/lib/date";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { sku, name, quantity } = body;

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

    const product = await prisma.products.create({
      data: {
        sku: sku.trim(),
        name: name.trim(),
        quantity,
      },
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