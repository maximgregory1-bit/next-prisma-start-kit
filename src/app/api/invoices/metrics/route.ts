import { NextResponse } from "next/server";

import { auth } from "@/lib/next-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    try {
        const [invoiceCount, clientCount, paidSum, unpaidSum] = await Promise.all([
            prisma.invoice.count(),
            prisma.customer.count(),
            prisma.invoice.aggregate({
                _sum: { amount: true },
                where: { customer: { is: { paidStatus: "PAID" } } },
            }),
            prisma.invoice.aggregate({
                _sum: { amount: true },
                where: {
                    customer: {
                        is: {
                            paidStatus: { in: ["LEFT", "OWED", "OTHER"] },
                        },
                    },
                },
            }),
        ]);

        return NextResponse.json({
            clientCount,
            invoiceCount,
            paidTotal: paidSum._sum.amount ?? 0,
            unpaidTotal: unpaidSum._sum.amount ?? 0,
        });
    } catch (error) {
        console.error("Failed to load invoice metrics", error);
        return NextResponse.json({ message: "Unable to load invoice metrics" }, { status: 500 });
    }
}
