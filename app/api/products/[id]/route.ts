
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// DELETE - Delete Product
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
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

    // Get Product ID
    const { id } = await context.params;
    const productId = Number(id);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    // Delete product and save activity log together
    const result = await prisma.$transaction(async (tx) => {
      // Find product
      const product = await tx.products.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return "NOT_FOUND";
      }

      // Check existing stock transactions
      const transactionCount =
        await tx.stock_transactions.count({
          where: { product_id: productId },
        });

      if (transactionCount > 0) {
        return "HAS_HISTORY";
      }

      // Delete product
      await tx.products.delete({
        where: { id: productId },
      });

      // Save activity log
      await tx.activity_logs.create({
        data: {
          discord_id: discordId,
          action: "DELETE_PRODUCT",
          product_id: product.id,
          product_sku: product.sku,
          product_name: product.name,
          details: {
            quantity_before_delete: product.quantity,
          },
        },
      });

      return "DELETED";
    });

    // Product not found
    if (result === "NOT_FOUND") {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Product has stock transaction history
    if (result === "HAS_HISTORY") {
      return NextResponse.json(
        {
          error:
            "Cannot delete a product with stock transaction history",
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE /api/products/[id]:", error);

    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
