import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma";

import { hashPassword } from "@/lib/auth";
import { auth } from "@/lib/next-auth";
import { prisma } from "@/lib/prisma";

type ProfilePayload = {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    avatar?: string | null;
};

const splitName = (name: string | null | undefined) => {
    const full = (name ?? "").trim();
    if (!full) {
        return { firstName: null as string | null, lastName: null as string | null };
    }
    const [firstName, ...rest] = full.split(/\s+/);
    return {
        firstName: firstName ?? null,
        lastName: rest.length ? rest.join(" ") : null,
    };
};

const toResponse = (user: { id: string; name: string | null; email: string | null; image: string | null }) => {
    const parsed = splitName(user.name);
    return {
        id: user.id,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: user.email,
        image: user.image,
    };
};

export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, image: true },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(toResponse(user));
}

export async function PATCH(request: Request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: ProfilePayload;
    try {
        body = (await request.json()) as ProfilePayload;
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const firstName = body.firstName?.trim() ?? "";
    const lastName = body.lastName?.trim() ?? "";
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const avatar = body.avatar;

    if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const existingWithEmail = await prisma.user.findFirst({
        where: {
            email,
            id: { not: session.user.id },
        },
        select: { id: true },
    });

    if (existingWithEmail) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const updateData: Prisma.UserUpdateInput = {
        email,
        name: `${firstName} ${lastName}`.trim() || null,
    };

    if (avatar !== undefined) {
        updateData.image = avatar;
    }

    if (password) {
        updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
        select: { id: true, name: true, email: true, image: true },
    });

    return NextResponse.json(toResponse(user));
}
