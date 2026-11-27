
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatThaiDate } from "@/lib/date";
import { auth } from "@/auth";

// POST - Stock In / Stock Out
export async function POST(request: Request) {
  try {
    const session = await auth();
    const discordId = session?.user?.discordId;

    if (!discordId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { product_id, type, quantity, note } = body;

    if (
      !Number.isInteger(product_id) ||
      !["IN", "OUT"].includes(type) ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      (note !== undefined &&
        note !== null &&
        typeof note !== "string")
    ) {
      return NextResponse.json(
        { error: "Invalid transaction data" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.products.updateMany({
        where: {
          id: product_id,
          ...(type === "OUT"
            ? { quantity: { gte: quantity } }
            : {}),
        },
        data: {
          quantity:
            type === "IN"
              ? { increment: quantity }
              : { decrement: quantity },
        },
      });

      if (updated.count === 0) {
        throw new Error(
          "PRODUCT_NOT_FOUND_OR_INSUFFICIENT_STOCK"
        );
      }

      const transaction = await tx.stock_transactions.create({
        data: {
          product_id,
          type,
          quantity,
          note: note ?? null,
          discord_id: discordId,
        },
      });

      const product = await tx.products.findUniqueOrThrow({
        where: { id: product_id },
      });

      return { transaction, product };
    });

    return NextResponse.json(
      {
        transaction: {
          ...result.transaction,
          created_at: formatThaiDate(
            result.transaction.created_at
          ),
        },
        product: {
          ...result.product,
          created_at: formatThaiDate(
            result.product.created_at
          ),
          updated_at: formatThaiDate(
            result.product.updated_at
          ),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "PRODUCT_NOT_FOUND_OR_INSUFFICIENT_STOCK"
    ) {
      return NextResponse.json(
        {
          error: "Product not found or insufficient stock",
        },
        { status: 409 }
      );
    }

    console.error(error);

    return NextResponse.json(
      { error: "Failed to process stock transaction" },
      { status: 500 }
    );
  }
}

// GET - Stock transaction history
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.discordId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const transactions =
      await prisma.stock_transactions.findMany({
        orderBy: {
          created_at: "desc",
        },
        include: {
          products: true,
        },
      });

    const formattedTransactions = transactions.map(
      (transaction) => ({
        ...transaction,
        created_at: formatThaiDate(
          transaction.created_at
        ),
        products: {
          ...transaction.products,
          created_at: formatThaiDate(
            transaction.products.created_at
          ),
          updated_at: formatThaiDate(
            transaction.products.updated_at
          ),
        },
      })
    );

    return NextResponse.json(formattedTransactions);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
