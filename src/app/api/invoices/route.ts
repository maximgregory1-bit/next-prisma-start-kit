import { NextResponse } from "next/server";
import { auth } from "@/lib/next-auth";

import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const statusMap = {
    Paid: "PAID",
    Unpaid: "LEFT",
    Partial: "OTHER",
    Overdue: "OWED",
} as const;

type StatusLabel = keyof typeof statusMap;

type InvoiceStatusLabel = "Paid" | "Unpaid" | "Partial" | "Overdue";
type PaidStatusValue = "PAID" | "LEFT" | "OWED" | "OTHER";

const customerColors = [
    "bg-rose-100 text-rose-600",
    "bg-sky-100 text-sky-600",
    "bg-emerald-100 text-emerald-600",
    "bg-indigo-100 text-indigo-600",
    "bg-amber-100 text-amber-600",
    "bg-pink-100 text-pink-600",
    "bg-slate-100 text-slate-600",
    "bg-violet-100 text-violet-600",
    "bg-cyan-100 text-cyan-600",
];

const getInitials = (value: string) =>
    value
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0]?.toUpperCase())
        .slice(0, 2)
        .join("") || "NA";

const mapPaidStatus = (status: PaidStatusValue): InvoiceStatusLabel => {
    switch (status) {
        case "PAID":
            return "Paid";
        case "LEFT":
            return "Unpaid";
        case "OWED":
            return "Overdue";
        default:
            return "Partial";
    }
};

export async function GET(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(1000, Math.max(1, Number(searchParams.get("pageSize") ?? 1000)));
    const search = (searchParams.get("search") ?? "").trim();
    const status = (searchParams.get("status") ?? "") as StatusLabel | "";
    const sort = searchParams.get("sort") ?? "";
    const direction: Prisma.SortOrder = searchParams.get("direction") === "desc" ? "desc" : "asc";
    const skip = (page - 1) * pageSize;

    const statusFilter = status && statusMap[status] ? statusMap[status] : undefined;
    const numericSearch = Number(search);
    const hasNumericSearch = Number.isFinite(numericSearch) && search.length > 0;

    const where: Prisma.InvoiceWhereInput = {
        ...(statusFilter
            ? {
                  customer: {
                      is: {
                          paidStatus: statusFilter,
                      },
                  },
              }
            : {}),
        ...(search
            ? {
                  OR: [
                      ...(hasNumericSearch ? [{ id: numericSearch }] : []),
                      {
                          customer: {
                              is: { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                          },
                      },
                      {
                          customer: {
                              is: { contactName: { contains: search, mode: Prisma.QueryMode.insensitive } },
                          },
                      },
                  ],
              }
            : {}),
    };

    const orderBy: Prisma.InvoiceOrderByWithRelationInput = (() => {
        switch (sort) {
            case "id":
                return { id: direction };
            case "customer":
                return { customer: { name: direction } };
            case "amount":
                return { amount: direction };
            case "startDate":
                return { startDate: direction };
            case "endDate":
                return { endDate: direction };
            case "sentDate":
                return { sendDate: direction };
            case "status":
                return { customer: { paidStatus: direction } };
            default:
                return { id: "desc" };
        }
    })();

    try {
        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                orderBy,
                skip,
                take: pageSize,
                select: {
                    id: true,
                    amount: true,
                    sendDate: true,
                    startDate: true,
                    endDate: true,
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            contactName: true,
                            paidStatus: true,
                        },
                    },
                },
            }),
            prisma.invoice.count({ where }),
        ]);

        const rows = invoices.map((invoice) => {
            const statusLabel = mapPaidStatus(invoice.customer.paidStatus);
            const initials = getInitials(invoice.customer.name);
            const colorIndex = invoice.customer.id % customerColors.length;

            return {
                id: `#${invoice.id}`,
                statusLabel,
                customerName: invoice.customer.name,
                customerContact: invoice.customer.contactName ?? "Customer",
                customerInitials: initials,
                customerColor: customerColors[colorIndex],
                amount: invoice.amount,
                startDate: invoice.startDate.toISOString(),
                endDate: invoice.endDate.toISOString(),
                sentDate: invoice.sendDate.toISOString(),
            };
        });

        return NextResponse.json({
            rows,
            total,
            page,
            pageSize,
        });
    } catch (error) {
        console.error("Failed to load invoices", error);
        return NextResponse.json({ message: "Unable to load invoices" }, { status: 500 });
    }
}
