import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma";
import { auth } from "@/lib/next-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const badRequest = (message: string) => NextResponse.json({ message }, { status: 400 });

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
        const campaigns = await prisma.campaign.findMany({
            where: { customerId: id },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                name: true,
                abbreviation: true,
                status: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            campaigns: campaigns.map((campaign) => ({
                id: String(campaign.id),
                name: campaign.name,
                abbreviation: campaign.abbreviation,
                status: campaign.status ? "Active" : "Inactive",
                createdAt: campaign.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error("Failed to load campaigns", error);
        return NextResponse.json({ message: "Unable to load campaigns" }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
        const body = (await request.json()) as { name?: string; abbreviation?: string; status?: "Active" | "Inactive" | boolean };

        if (!body.name) {
            return badRequest("Campaign name is required");
        }

        const statusValue = typeof body.status === "boolean" ? body.status : body.status === "Active" ? true : body.status === "Inactive" ? false : true;

        const created = await prisma.campaign.create({
            data: {
                customerId: id,
                name: body.name.trim(),
                abbreviation: body.abbreviation?.trim() || null,
                status: statusValue,
            },
            select: {
                id: true,
                name: true,
                abbreviation: true,
                status: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            id: String(created.id),
            name: created.name,
            abbreviation: created.abbreviation,
            status: created.status ? "Active" : "Inactive",
            createdAt: created.createdAt.toISOString(),
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json({ message: "Campaign name must be unique" }, { status: 409 });
        }
        console.error("Failed to create campaign", error);
        return NextResponse.json({ message: "Unable to create campaign" }, { status: 500 });
    }
}
