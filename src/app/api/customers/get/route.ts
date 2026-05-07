import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    const data = await request.json();
    if (!data) {
        return NextResponse.json(
            {
                success: false,
                error: "input_error",
                message: "missing data",
            },
            { status: 400 },
        );
    }

    try {
        const campaignName = data.campaign.toString().trim();

        const campaignSelected = await prisma.campaign.findUnique({
            where: { name: campaignName },
        });

        if (!campaignSelected) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Cannot find campaign named " + campaignName,
                },
                { status: 500 },
            );
        }

        const customer = await prisma.customer.findUnique({
            where: {
                id: campaignSelected.customerId,
            },
            include: {
                campaigns: true,
                agents: true,
            },
        });

        if (!customer) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Cannot find customer of this campaign " + campaignName,
                },
                { status: 500 },
            );
        }

        return NextResponse.json(
            {
                success: true,
                customer: customer,
            },
            { status: 200 },
        );
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            {
                success: true,
                error: error,
            },
            { status: 500 },
        );
    }
}
