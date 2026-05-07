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
        const agents = await prisma.agent.findMany({
            where: { customerId: id },
            orderBy: { createdAt: "desc" },
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
            agents: agents.map((agent) => ({
                id: String(agent.id),
                name: agent.name,
                sheet: agent.sheet,
                tab: agent.tab,
                status: agent.status ? "Active" : "Inactive",
                createdAt: agent.createdAt.toISOString(),
            })),
        });
    } catch (error) {
        console.error("Failed to load agents", error);
        return NextResponse.json({ message: "Unable to load agents" }, { status: 500 });
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
        const body = (await request.json()) as { name?: string; sheet?: string; tab?: string; status?: "Active" | "Inactive" | boolean };

        if (!body.name) {
            return badRequest("Agent name is required");
        }

        const statusValue = typeof body.status === "boolean" ? body.status : body.status === "Active" ? true : body.status === "Inactive" ? false : true;

        const created = await prisma.agent.create({
            data: {
                customerId: id,
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
            id: String(created.id),
            name: created.name,
            sheet: created.sheet,
            tab: created.tab,
            status: created.status ? "Active" : "Inactive",
            createdAt: created.createdAt.toISOString(),
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return NextResponse.json({ message: "Agent name must be unique" }, { status: 409 });
        }
        console.error("Failed to create agent", error);
        return NextResponse.json({ message: "Unable to create agent" }, { status: 500 });
    }
}
