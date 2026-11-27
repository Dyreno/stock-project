
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatThaiDate } from "@/lib/date";
import { auth } from "@/auth";

// GET - Product Activity History
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.discordId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const logs = await prisma.activity_logs.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(
      logs.map((log) => ({
        ...log,
        created_at: formatThaiDate(log.created_at),
      }))
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}
