import { NextResponse } from "next/server";
import { auth } from "@/lib/next-auth";
import { getWhatsappGroupId } from "@/lib/whatsapp";

import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const normalizeList = (value: string | string[] | null) => {
    if (Array.isArray(value)) {
        return value.filter((item) => item.trim());
    }
    if (!value) {
        return [];
    }
    return value
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
        return value.map((item) => ({ type: false, number: item.trim(), group: null })).filter((item) => item.number);
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
                    .filter((item) => item.number);
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

export async function GET(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const pageSize = Math.min(1000, Math.max(1, Number(searchParams.get("pageSize") ?? 1000)));
    const search = (searchParams.get("search") ?? "").trim();
    const status = searchParams.get("status") ?? "";
    const sort = searchParams.get("sort") ?? "";
    const direction: Prisma.SortOrder = searchParams.get("direction") === "desc" ? "desc" : "asc";
    const skip = (page - 1) * pageSize;

    const statusFilter = status === "Active" ? true : status === "Inactive" ? false : undefined;

    const where: Prisma.CustomerWhereInput = {
        ...(statusFilter === undefined ? {} : { status: statusFilter }),
        ...(search
            ? {
                  OR: [
                      { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
                      {
                          contactName: {
                              contains: search,
                              mode: Prisma.QueryMode.insensitive,
                          },
                      },
                      { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
                      { phone: { contains: search, mode: Prisma.QueryMode.insensitive } },
                  ],
              }
            : {}),
    };

    const orderBy: Prisma.CustomerOrderByWithRelationInput = (() => {
        switch (sort) {
            case "no":
                return { id: direction };
            case "name":
                return { name: direction };
            case "contactName":
                return { contactName: direction };
            case "email":
                return { email: direction };
            case "phone":
                return { phone: direction };
            case "price":
                return { price: direction };
            case "bundlePrice":
                return { bundlePrice: direction };
            case "owed":
                return { owed: direction };
            case "status":
                return { status: direction };
            default:
                return { id: "asc" };
        }
    })();

    try {
        const [customers, total] = await Promise.all([
            prisma.customer.findMany({
                select: {
                    id: true,
                    name: true,
                    contactName: true,
                    email: true,
                    phone: true,
                    isBundle: true,
                    isShowSaved: true,
                    isExcludeReport: true,
                    price: true,
                    bundlePrice: true,
                    owed: true,
                    status: true,
                    _count: {
                        select: {
                            campaigns: true,
                            agents: true,
                        },
                    },
                },
                where,
                orderBy,
                skip,
                take: pageSize,
            }),
            prisma.customer.count({ where }),
        ]);

        const rows = customers.map((customer) => ({
            id: String(customer.id),
            name: customer.name,
            contactName: customer.contactName ?? "-",
            campaigns: customer._count.campaigns,
            agents: customer._count.agents,
            email: normalizeList(customer.email),
            phone: normalizePhoneList(customer.phone),
            bundle: customer.isBundle,
            showSaved: customer.isShowSaved,
            excludeReport: customer.isExcludeReport,
            price: customer.price,
            bundlePrice: customer.bundlePrice,
            owed: customer.owed,
            status: customer.status ? "Active" : "Inactive",
        }));

        return NextResponse.json({
            rows,
            total,
            page,
            pageSize,
        });
    } catch (error) {
        console.error("Failed to load customers", error);
        return NextResponse.json({ message: "Unable to load customers" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    try {
        const body = (await request.json()) as {
            name?: string;
            status?: "Active" | "Inactive" | boolean;
            contactName?: string;
            email?: string;
            phone?: string;
            price?: string;
            bundlePrice?: string;
            owed?: string;
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
            return NextResponse.json({ message: "Name and phone are required" }, { status: 400 });
        }

        const statusValue = typeof body.status === "boolean" ? body.status : body.status === "Active" ? true : body.status === "Inactive" ? false : true;

        const price = body.price ? Number(body.price) : undefined;
        const bundlePrice = body.bundlePrice ? Number(body.bundlePrice) : undefined;
        const owed = body.owed ? Number(body.owed) : undefined;

        if ([price, bundlePrice, owed].some((value) => value !== undefined && Number.isNaN(value))) {
            return NextResponse.json({ message: "Price values must be numbers" }, { status: 400 });
        }

        const resolvedPhone = await resolveGroupChatPhoneList(body.phone);
        if (resolvedPhone.error) {
            return NextResponse.json({ message: resolvedPhone.error }, { status: 400 });
        }

        const customer = await prisma.customer.create({
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
        console.error("Failed to create customer", error);
        return NextResponse.json({ message: "Unable to create customer" }, { status: 500 });
    }
}
