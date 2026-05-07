import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma";
import { auth } from "@/lib/next-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const badRequest = (message: string) => NextResponse.json({ message }, { status: 400 });
const notFound = () => NextResponse.json({ message: "Campaign not found" }, { status: 404 });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; campaignId: string }> }) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    const { id: rawCustomerId, campaignId: rawCampaignId } = await params;
    const customerId = Number(rawCustomerId);
    const campaignId = Number(rawCampaignId);
    if (!Number.isInteger(customerId) || !Number.isInteger(campaignId)) {
        return badRequest("Invalid id");
    }

    try {
        const body = (await request.json()) as { name?: string; abbreviation?: string; status?: "Active" | "Inactive" | boolean };

        if (!body.name) {
            return badRequest("Campaign name is required");
        }

        const statusValue = typeof body.status === "boolean" ? body.status : body.status === "Active" ? true : body.status === "Inactive" ? false : true;

        const updated = await prisma.campaign.update({
            where: { id: campaignId, customerId },
            data: {
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
            id: String(updated.id),
            name: updated.name,
            abbreviation: updated.abbreviation,
            status: updated.status ? "Active" : "Inactive",
            createdAt: updated.createdAt.toISOString(),
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return notFound();
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json({ message: "Campaign name must be unique" }, { status: 409 });
        }
        console.error("Failed to update campaign", error);
        return NextResponse.json({ message: "Unable to update campaign" }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; campaignId: string }> }) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    const { id: rawCustomerId, campaignId: rawCampaignId } = await params;
    const customerId = Number(rawCustomerId);
    const campaignId = Number(rawCampaignId);
    if (!Number.isInteger(customerId) || !Number.isInteger(campaignId)) {
        return badRequest("Invalid id");
    }

    try {
        await prisma.campaign.delete({ where: { id: campaignId, customerId } });
        return NextResponse.json({ id: rawCampaignId });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return notFound();
        }
        console.error("Failed to delete campaign", error);
        return NextResponse.json({ message: "Unable to delete campaign" }, { status: 500 });
    }
}
