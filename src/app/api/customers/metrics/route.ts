import { NextResponse } from "next/server";

import { auth } from "@/lib/next-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number) => {
    return Promise.race([promise, new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DB timeout")), timeoutMs))]);
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const runWithRetry = async <T>(fn: () => Promise<T>, retries: number, timeoutMs: number) => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
        try {
            return await withTimeout(fn(), timeoutMs);
        } catch (error) {
            lastError = error;
            if (attempt < retries) {
                await sleep(250 * (attempt + 1));
            }
        }
    }

    throw lastError;
};

export async function GET() {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    try {
        const [activeCount, bundleCount, showSavedCount, excludeReportCount] = await runWithRetry(
            () =>
                Promise.all([
                    prisma.customer.count({ where: { status: true } }),
                    prisma.customer.count({ where: { isBundle: true } }),
                    prisma.customer.count({ where: { isShowSaved: true } }),
                    prisma.customer.count({ where: { isExcludeReport: true } }),
                ]),
            2,
            5000,
        );

        return NextResponse.json({
            activeCount,
            bundleCount,
            showSavedCount,
            excludeReportCount,
        });
    } catch (error) {
        console.error("Failed to load customer metrics", error);
        return NextResponse.json({ message: "Unable to load customer metrics" }, { status: 500 });
    }
}
