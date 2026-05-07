import { NextRequest, NextResponse } from "next/server";

import { makeInvoice } from "@/lib/google-sheet-action.ts/makeInvoice";

export const maxDuration = 60; // This function can run for a maximum of 5 seconds
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    const data = await request.json();
    if (!data) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: 100,
                    message: "missing data",
                },
            },
            { status: 400 },
        );
    }

    try {
        const result = await makeInvoice(data);

        if (result.success) {
            return NextResponse.json(result, { status: 200 });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error ?? "Unknown error",
                },
                { status: 200 },
            );
        }
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: false,
                error: error,
            },
            { status: 500 },
        );
    }
}
