import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma";
import { auth } from "@/lib/next-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const badRequest = (message: string) => NextResponse.json({ message }, { status: 400 });
const notFound = () => NextResponse.json({ message: "Agent not found" }, { status: 404 });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; agentId: string }> }) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    const { id: rawCustomerId, agentId: rawAgentId } = await params;
    const customerId = Number(rawCustomerId);
    const agentId = Number(rawAgentId);
    if (!Number.isInteger(customerId) || !Number.isInteger(agentId)) {
        return badRequest("Invalid id");
    }

    try {
        const body = (await request.json()) as { name?: string; sheet?: string; tab?: string; status?: "Active" | "Inactive" | boolean };

        if (!body.name) {
            return badRequest("Agent name is required");
        }

        const statusValue = typeof body.status === "boolean" ? body.status : body.status === "Active" ? true : body.status === "Inactive" ? false : true;

        const updated = await prisma.agent.update({
            where: { id: agentId, customerId },
            data: {
                name: body.name.trim(),
                sheet: body.sheet?.trim() || null,
                tab: body.tab?.trim() || null,
                status: statusValue,
            },
            select: {
                id: true,
                name: true,
                sheet: true,
                tab: true,
                status: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            id: String(updated.id),
            name: updated.name,
            sheet: updated.sheet,
            tab: updated.tab,
            status: updated.status ? "Active" : "Inactive",
            createdAt: updated.createdAt.toISOString(),
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return notFound();
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json({ message: "Agent name must be unique" }, { status: 409 });
        }
        console.error("Failed to update agent", error);
        return NextResponse.json({ message: "Unable to update agent" }, { status: 500 });
    }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; agentId: string }> }) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    const { id: rawCustomerId, agentId: rawAgentId } = await params;
    const customerId = Number(rawCustomerId);
    const agentId = Number(rawAgentId);
    if (!Number.isInteger(customerId) || !Number.isInteger(agentId)) {
        return badRequest("Invalid id");
    }

    try {
        await prisma.agent.delete({ where: { id: agentId, customerId } });
        return NextResponse.json({ id: rawAgentId });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
            return notFound();
        }
        console.error("Failed to delete agent", error);
        return NextResponse.json({ message: "Unable to delete agent" }, { status: 500 });
    }
}
