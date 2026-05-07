import { NextResponse } from "next/server";

import { auth } from "@/lib/next-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    const startedAt = Date.now();

    try {
        await prisma.$queryRaw`SELECT 1`;
        const durationMs = Date.now() - startedAt;
        return NextResponse.json({ status: "ok", durationMs });
    } catch (error) {
        console.error("DB health check failed", error);
        return NextResponse.json({ status: "error", message: "Database connection failed" }, { status: 500 });
    }
}
