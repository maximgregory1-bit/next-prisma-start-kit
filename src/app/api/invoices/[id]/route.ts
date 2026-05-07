import { NextResponse } from "next/server";
import { auth } from "@/lib/next-auth";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type InvoiceStatusLabel = "Paid" | "Unpaid" | "Partial" | "Overdue";

type PaidStatusValue = "PAID" | "LEFT" | "OWED" | "OTHER";

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

const badRequest = (message: string) => NextResponse.json({ message }, { status: 400 });

const notFound = () => NextResponse.json({ message: "Invoice not found" }, { status: 404 });

const parseDate = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isInteger(id)) {
        return badRequest("Invalid invoice id");
    }

    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            select: {
                id: true,
                customerId: true,
                amount: true,
                startDate: true,
                endDate: true,
                sendDate: true,
                excelFile: true,
                imageFile: true,
                prior: true,
                pageOrientation: true,
                customer: {
                    select: {
                        id: true,
                        name: true,
                        contactName: true,
                        paidStatus: true,
                    },
                },
                notifications: {
                    select: {
                        id: true,
                        email: true,
                        phone: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
        });

        if (!invoice) {
            return notFound();
        }

        return NextResponse.json({
            id: String(invoice.id),
            customerId: String(invoice.customerId),
            customerName: invoice.customer.name,
            customerContact: invoice.customer.contactName ?? "Customer",
            customerStatus: mapPaidStatus(invoice.customer.paidStatus),
            amount: invoice.amount,
            startDate: invoice.startDate.toISOString(),
            endDate: invoice.endDate.toISOString(),
            sentDate: invoice.sendDate.toISOString(),
            excelFile: invoice.excelFile ?? "",
            imageFile: invoice.imageFile ?? "",
            prior: invoice.prior ?? null,
            pageOrientation: invoice.pageOrientation,
            notifications: invoice.notifications.map((notification) => ({
                id: String(notification.id),
                email: notification.email ?? "",
                phone: notification.phone,
                createdAt: notification.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error("Failed to load invoice", error);
        return NextResponse.json({ message: "Unable to load invoice" }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isInteger(id)) {
        return badRequest("Invalid invoice id");
    }

    try {
        const body = (await request.json()) as {
            amount?: number;
            startDate?: string;
            endDate?: string;
            sentDate?: string;
            excelFile?: string;
            imageFile?: string;
            prior?: number | null;
            pageOrientation?: boolean;
        };

        const amount = Number(body.amount);
        const startDate = body.startDate ? parseDate(body.startDate) : null;
        const endDate = body.endDate ? parseDate(body.endDate) : null;
        const sentDate = body.sentDate ? parseDate(body.sentDate) : null;
        const prior = body.prior === null || body.prior === undefined ? null : Number(body.prior);

        if (!Number.isFinite(amount)) {
            return badRequest("Amount must be a number");
        }
        if (!startDate || !endDate || !sentDate) {
            return badRequest("Start, end, and sent dates are required");
        }
        if (prior !== null && !Number.isFinite(prior)) {
            return badRequest("Prior must be a number");
        }

        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                amount,
                startDate,
                endDate,
                sendDate: sentDate,
                excelFile: body.excelFile?.trim() ?? "",
                imageFile: body.imageFile?.trim() ?? "",
                prior,
                pageOrientation: body.pageOrientation ?? true,
            },
            select: {
                id: true,
            },
        });

        return NextResponse.json({ id: String(updated.id) });
    } catch (error) {
        console.error("Failed to update invoice", error);
        return NextResponse.json({ message: "Unable to update invoice" }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isInteger(id)) {
        return badRequest("Invalid invoice id");
    }

    try {
        await prisma.notification.deleteMany({ where: { invoiceId: id } });
        await prisma.invoice.delete({ where: { id } });
        return NextResponse.json({ id: String(id) });
    } catch (error) {
        console.error("Failed to delete invoice", error);
        return NextResponse.json({ message: "Unable to delete invoice" }, { status: 500 });
    }
}
