import { NextResponse } from "next/server";

import { auth } from "@/lib/next-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const toMonthBounds = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return { start, end };
};

export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }

    try {
        const now = new Date();
        const currentMonth = toMonthBounds(now);
        const previousMonth = toMonthBounds(new Date(now.getFullYear(), now.getMonth() - 1, 1));

        const [
            totalCustomers,
            activeCustomers,
            totalInvoices,
            paidAmount,
            unpaidAmount,
            currentMonthCustomers,
            previousMonthCustomers,
            currentMonthInvoices,
            previousMonthInvoices,
        ] = await Promise.all([
            prisma.customer.count(),
            prisma.customer.count({ where: { status: true } }),
            prisma.invoice.count(),
            prisma.invoice.aggregate({
                _sum: { amount: true },
                where: { customer: { is: { paidStatus: "PAID" } } },
            }),
            prisma.invoice.aggregate({
                _sum: { amount: true },
                where: {
                    customer: {
                        is: { paidStatus: { in: ["LEFT", "OWED", "OTHER"] } },
                    },
                },
            }),
            prisma.customer.count({
                where: {
                    createdAt: {
                        gte: currentMonth.start,
                        lt: currentMonth.end,
                    },
                },
            }),
            prisma.customer.count({
                where: {
                    createdAt: {
                        gte: previousMonth.start,
                        lt: previousMonth.end,
                    },
                },
            }),
            prisma.invoice.count({
                where: {
                    createdAt: {
                        gte: currentMonth.start,
                        lt: currentMonth.end,
                    },
                },
            }),
            prisma.invoice.count({
                where: {
                    createdAt: {
                        gte: previousMonth.start,
                        lt: previousMonth.end,
                    },
                },
            }),
        ]);

        const customerGrowthPct =
            previousMonthCustomers === 0 ? (currentMonthCustomers > 0 ? 100 : 0) : ((currentMonthCustomers - previousMonthCustomers) / previousMonthCustomers) * 100;

        const invoiceGrowthPct =
            previousMonthInvoices === 0 ? (currentMonthInvoices > 0 ? 100 : 0) : ((currentMonthInvoices - previousMonthInvoices) / previousMonthInvoices) * 100;

        return NextResponse.json({
            totalCustomers,
            activeCustomers,
            totalInvoices,
            paidTotal: paidAmount._sum.amount ?? 0,
            unpaidTotal: unpaidAmount._sum.amount ?? 0,
            customerGrowthPct,
            invoiceGrowthPct,
        });
    } catch (error) {
        console.error("Failed to load LeaderGroupInvoice analytics", error);
        return NextResponse.json({ message: "Unable to load LeaderGroupInvoice analytics" }, { status: 500 });
    }
}
