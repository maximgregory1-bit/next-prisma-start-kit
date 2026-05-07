import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const customers = await prisma.customer.findMany({
            where: {
                status: true,
            },
            select: {
                id: true,
                name: true,
                isExcludeReport: true,
                status: true,
                campaigns: {
                    where: { status: true },
                    select: {
                        id: true,
                        name: true,
                        abbreviation: true,
                        status: true,
                    },
                },
            },
            orderBy: [
                {
                    id: "asc",
                },
            ],
        });

        return NextResponse.json(
            {
                success: true,
                data: customers,
            },
            { status: 200 },
        );
    } catch (error: unknown) {
        console.error(error);

        let message = "Unknown error";
        if (error instanceof Error) message = error.message;
        else if (typeof error === "string") message = error;
        else {
            try {
                message = JSON.stringify(error);
            } catch (e) {
                console.log("Failed to stringify error", e);
                /* ignore */
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: message,
            },
            { status: 400 },
        );
    }
}
