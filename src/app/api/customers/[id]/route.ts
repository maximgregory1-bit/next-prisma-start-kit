import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma";
import { auth } from "@/lib/next-auth";
import { prisma } from "@/lib/prisma";
import { getWhatsappGroupId } from "@/lib/whatsapp";

export const runtime = "nodejs";

const badRequest = (message: string) => NextResponse.json({ message }, { status: 400 });

const notFound = () => NextResponse.json({ message: "Customer not found" }, { status: 404 });
const hasPhoneEntryValue = (entry: { type: boolean; number: string; group?: string | null }) => (entry.type ? Boolean(entry.group?.trim()) : Boolean(entry.number.trim()));

const normalizeList = (value: string | string[] | null) => {
    if (Array.isArray(value)) {
        return value.map((item) => item.trim()).filter(Boolean);
    }
    if (!value) {
        return [];
    }
    const trimmed = value.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
            const parsed = JSON.parse(trimmed) as unknown;
            if (Array.isArray(parsed)) {
                return parsed.map((item) => String(item).trim()).filter(Boolean);
            }
        } catch {
            // Fall back to comma split.
        }
    }
    return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
};

const serializeList = (value: string[] | string | null | undefined) => {
    if (Array.isArray(value)) {
        const items = value.map((item) => item.trim()).filter(Boolean);
        return items.length ? JSON.stringify(items) : null;
    }
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed || null;
    }
    return null;
};

const normalizePhoneList = (value: string | string[] | null) => {
    if (!value) {
        return [] as Array<{ type: boolean; number: string; group?: string | null }>;
    }
    if (Array.isArray(value)) {
        return value.map((item) => ({ type: false, number: item.trim(), group: null })).filter((item) => hasPhoneEntryValue(item));
    }
    const trimmed = value.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
            const parsed = JSON.parse(trimmed) as unknown;
            if (Array.isArray(parsed)) {
                return parsed
                    .map((entry) => {
                        if (typeof entry === "string") {
                            return { type: false, number: entry.trim(), group: null };
                        }
                        if (entry && typeof entry === "object") {
                            const record = entry as { type?: unknown; number?: unknown; group?: unknown };
                            return {
                                type: Boolean(record.type),
                                number: typeof record.number === "string" ? record.number.trim() : "",
                                group: typeof record.group === "string" ? record.group.trim() : null,
                            };
                        }
                        return { type: false, number: "", group: null };
                    })
                    .filter((item) => hasPhoneEntryValue(item));
            }
        } catch {
            // Fall back to comma split.
        }
    }
    return trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => ({ type: false, number: item, group: null }));
};

const resolveGroupChatPhoneList = async (rawPhone: string): Promise<{ phone: string; error?: string }> => {
    const trimmed = rawPhone.trim();
    if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
        return { phone: rawPhone };
    }

    try {
        const parsed = JSON.parse(trimmed) as unknown;
        if (!Array.isArray(parsed)) {
            return { phone: rawPhone };
        }

        const resolved = await Promise.all(
            parsed.map(async (entry) => {
                if (!entry || typeof entry !== "object") {
                    return { entry };
                }

                const record = entry as { type?: unknown; group?: unknown; number?: unknown };
                const isGroup = Boolean(record.type);
                const groupName = typeof record.group === "string" ? record.group.trim() : "";

                if (!isGroup || !groupName) {
                    return { entry };
                }

                const groupLookup = await getWhatsappGroupId(groupName);
                if (!groupLookup.groupId) {
                    return {
                        entry,
                        error: groupLookup.error ?? `Unable to resolve WhatsApp group id for group \"${groupName}\".`,
                    };
                }

                return {
                    entry: {
                        ...record,
                        type: true,
                        group: groupName,
                        number: groupLookup.groupId,
                    },
                };
            }),
        );

        const failed = resolved.find((item) => item.error);
        if (failed?.error) {
            return { phone: rawPhone, error: failed.error };
        }

        return { phone: JSON.stringify(resolved.map((item) => item.entry)) };
    } catch {
        return { phone: rawPhone };
    }
};

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isInteger(id)) {
        return badRequest("Invalid customer id");
    }

    try {
        const customer = await prisma.customer.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                status: true,
                contactName: true,
                email: true,
                phone: true,
                price: true,
                bundlePrice: true,
                owed: true,
                isBundle: true,
                isShowSaved: true,
                isExcludeReport: true,
                isHoliday: true,
                isWeekly: true,
                weeklyLead: true,
                invoiceIndex: true,
                extraText: true,
                customCredit: true,
                isShowPercent: true,
                isTotalLeadQty: true,
                noHolidayList: true,
                _count: {
                    select: {
                        campaigns: true,
                        agents: true,
                    },
                },
            },
        });

        if (!customer) {
            return notFound();
        }

        return NextResponse.json({
            id: String(customer.id),
            name: customer.name,
            status: customer.status ? "Active" : "Inactive",
            contactName: customer.contactName ?? "",
            email: normalizeList(customer.email),
            phone: normalizePhoneList(customer.phone),
            price: customer.price,
            bundlePrice: customer.bundlePrice,
            owed: customer.owed,
            bundle: customer.isBundle,
            showSaved: customer.isShowSaved,
            excludeReport: customer.isExcludeReport,
            holidayCalculation: customer.isHoliday,
            weeklyCustomPayment: customer.isWeekly,
            weeklyLeadQty: customer.weeklyLead ?? null,
            invoiceNumber: customer.invoiceIndex ?? "",
            extraTextContent: customer.extraText ?? "",
            customCreditValue: customer.customCredit ?? null,
            showPercentage: customer.isShowPercent,
            showTotalLeadQty: customer.isTotalLeadQty,
            excludeWeekdays: normalizeList(customer.noHolidayList),
            campaigns: customer._count.campaigns,
            agents: customer._count.agents,
        });
    } catch (error) {
        console.error("Failed to load customer", error);
        return NextResponse.json({ message: "Unable to load customer" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isInteger(id)) {
        return badRequest("Invalid customer id");
    }

    try {
        const body = (await request.json()) as {
            name?: string;
            status?: "Active" | "Inactive" | boolean;
            contactName?: string;
            email?: string;
            phone?: string;
            price?: number;
            bundlePrice?: number;
            owed?: number;
            bundle?: boolean;
            showSaved?: boolean;
            excludeReport?: boolean;
            holidayCalculation?: boolean;
            weeklyCustomPayment?: boolean;
            weeklyLeadQty?: number | null;
            invoiceNumber?: string;
            extraTextContent?: string;
            customCreditValue?: number | null;
            showPercentage?: boolean;
            showTotalLeadQty?: boolean;
            excludeWeekdays?: string[];
        };

        if (!body.name || !body.phone) {
            return badRequest("Name and phone are required");
        }

        const statusValue = typeof body.status === "boolean" ? body.status : body.status === "Active" ? true : body.status === "Inactive" ? false : undefined;

        if (statusValue === undefined) {
            return badRequest("Invalid status value");
        }

        const price = Number(body.price);
        const bundlePrice = Number(body.bundlePrice);
        const owed = Number(body.owed);

        if ([price, bundlePrice, owed].some((value) => Number.isNaN(value))) {
            return badRequest("Price values must be numbers");
        }

        const resolvedPhone = await resolveGroupChatPhoneList(body.phone);
        if (resolvedPhone.error) {
            return badRequest(resolvedPhone.error);
        }

        const updated = await prisma.customer.update({
            where: { id },
            data: {
                name: body.name,
                status: statusValue,
                contactName: body.contactName?.trim() || null,
                email: body.email?.trim() || null,
                phone: resolvedPhone.phone,
                price,
                bundlePrice,
                owed,
                isBundle: body.bundle ?? undefined,
                isShowSaved: body.showSaved ?? undefined,
                isExcludeReport: body.excludeReport ?? undefined,
                isHoliday: body.holidayCalculation ?? undefined,
                isWeekly: body.weeklyCustomPayment ?? undefined,
                weeklyLead: body.weeklyLeadQty === null ? null : (body.weeklyLeadQty ?? undefined),
                invoiceIndex: typeof body.invoiceNumber === "string" ? body.invoiceNumber.trim() || null : undefined,
                extraText: typeof body.extraTextContent === "string" ? body.extraTextContent.trim() || null : undefined,
                customCredit: body.customCreditValue === null ? null : (body.customCreditValue ?? undefined),
                isShowPercent: body.showPercentage ?? undefined,
                isTotalLeadQty: body.showTotalLeadQty ?? undefined,
                noHolidayList: body.excludeWeekdays ? serializeList(body.excludeWeekdays) : undefined,
            },
            select: {
                id: true,
                name: true,
                status: true,
                contactName: true,
                email: true,
                phone: true,
                price: true,
                bundlePrice: true,
                owed: true,
                isBundle: true,
                isShowSaved: true,
                isExcludeReport: true,
                isHoliday: true,
                isWeekly: true,
                weeklyLead: true,
                invoiceIndex: true,
                extraText: true,
                customCredit: true,
                isShowPercent: true,
                isTotalLeadQty: true,
                noHolidayList: true,
                _count: {
                    select: {
                        campaigns: true,
                        agents: true,
                    },
                },
            },
        });

        return NextResponse.json({
            id: String(updated.id),
            name: updated.name,
            status: updated.status ? "Active" : "Inactive",
            contactName: updated.contactName ?? "",
            email: normalizeList(updated.email),
            phone: normalizePhoneList(updated.phone),
            price: updated.price,
            bundlePrice: updated.bundlePrice,
            owed: updated.owed,
            bundle: updated.isBundle,
            showSaved: updated.isShowSaved,
            excludeReport: updated.isExcludeReport,
            holidayCalculation: updated.isHoliday,
            weeklyCustomPayment: updated.isWeekly,
            weeklyLeadQty: updated.weeklyLead ?? null,
            invoiceNumber: updated.invoiceIndex ?? "",
            extraTextContent: updated.extraText ?? "",
            customCreditValue: updated.customCredit ?? null,
            showPercentage: updated.isShowPercent,
            showTotalLeadQty: updated.isTotalLeadQty,
            excludeWeekdays: normalizeList(updated.noHolidayList),
            campaigns: updated._count.campaigns,
            agents: updated._count.agents,
        });
    } catch (error) {
        console.error("Failed to update customer", error);
        return NextResponse.json({ message: "Unable to update customer" }, { status: 500 });
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
        return badRequest("Invalid customer id");
    }

    try {
        await prisma.customer.delete({ where: { id } });
        return NextResponse.json({ id: rawId });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return notFound();
        }
        console.error("Failed to delete customer", error);
        return NextResponse.json({ message: "Unable to delete customer" }, { status: 500 });
    }
}
