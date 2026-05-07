import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/next-auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { sendMessage } from "@/lib/notify";

type RouteContext = {
    params?: Record<string, string> | Promise<Record<string, string> | undefined> | undefined;
};

const parseJsonSafe = (value: string | null | undefined): unknown => {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
};

const extractImageUrl = (value: string | null | undefined): string | undefined => {
    if (!value) return undefined;
    const parsed = parseJsonSafe(value);
    if (parsed && typeof parsed === "object" && "url" in parsed && typeof (parsed as { url?: unknown }).url === "string") {
        return (parsed as { url: string }).url;
    }
    return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/") ? value : undefined;
};

const parseEmails = (value: string | null | undefined): string[] => {
    if (!value) return [];
    const parsed = parseJsonSafe(value);
    if (Array.isArray(parsed)) {
        return parsed
            .map((entry) => {
                if (typeof entry === "string") return entry.trim();
                if (entry && typeof entry === "object" && "email" in entry && typeof (entry as { email?: unknown }).email === "string") {
                    return (entry as { email: string }).email.trim();
                }
                return "";
            })
            .filter(Boolean);
    }
    return value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
};

const parsePhones = (value: string | null | undefined): string[] => {
    if (!value) return [];
    const parsed = parseJsonSafe(value);
    if (Array.isArray(parsed)) {
        return parsed
            .map((entry) => {
                if (typeof entry === "string") return entry.trim();
                if (entry && typeof entry === "object" && "number" in entry && typeof (entry as { number?: unknown }).number === "string") {
                    return (entry as { number: string }).number.trim();
                }
                return "";
            })
            .filter(Boolean);
    }
    return value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
};

export async function POST(_request: NextRequest, context: RouteContext) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ success: false, message: "User is not authenticated" }, { status: 401 });
    }

    // `context.params` may be a Promise in some Next.js runtimes — resolve safely.
    let idParam: string | undefined;
    try {
        const maybeParams = context?.params;
        const resolvedParams = maybeParams && typeof (maybeParams as Promise<unknown>).then === "function" ? await maybeParams : maybeParams;
        idParam = (resolvedParams as Record<string, string> | undefined)?.id;
    } catch {
        idParam = undefined;
    }

    if (!idParam) {
        return NextResponse.json({ success: false, error: "ID is required" }, { status: 400 });
    }

    try {
        const invoiceId = parseInt(idParam.toString(), 10);
        if (!Number.isInteger(invoiceId)) {
            return NextResponse.json({ success: false, error: "Invalid invoice id" }, { status: 400 });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { customer: true },
        });

        if (!invoice) {
            return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
        }

        const customer = invoice.customer;

        const startDateVal = getDateString(invoice.startDate);
        const endDateVal = getDateString(invoice.endDate);
        const imageUrl = extractImageUrl(invoice.imageFile);
        const emailRecipients = parseEmails(customer.email);
        const phoneRecipients = parsePhones(customer.phone);

        const htmlParts: string[] = [];
        htmlParts.push(`<p style="font-weight: bold">Hi, ${customer?.contactName || customer.name}</p>`);
        htmlParts.push(`<p style="font-weight: bold">This is the invoice for lead data from ${startDateVal} to ${endDateVal}.</p>`);
        if (imageUrl) {
            const downloadFileName = `Invoice_${customer.name}_${Date.now()}.png`;
            htmlParts.push(
                `<div style="margin-top: 40px; width: 100%;"><a download="${downloadFileName}" href="${imageUrl}"><img title="invoice" height="600" width="800" src="${imageUrl}" style="clear:both;display:block;width:auto;max-width:100%;border:none;outline:none;text-decoration:none" align="center"></a></div>`,
            );
            htmlParts.push(
                `<div style="margin-top: 20px"><a target="_blank" download="${downloadFileName}" href="${imageUrl}" style="color:#4c83c3; text-decoration:none;">Download</a></div>`,
            );
        }

        const html = htmlParts.join("\n");

        let emailSent = 0;
        let whatsappSent = 0;

        for (const to of emailRecipients) {
            try {
                await sendMail({
                    from: "Wise Media <no-reply@wisemedia.io>",
                    to,
                    subject: "New Invoice from Wise Media",
                    text: `Hi, ${customer?.contactName || customer.name}! This is the invoice for lead data from ${startDateVal} to ${endDateVal}.`,
                    html,
                });
                emailSent += 1;
            } catch (err) {
                console.error("Email send error", err);
            }
        }

        for (const number of phoneRecipients) {
            try {
                const result = await sendMessage({ sendTo: number, image: imageUrl });
                if (result?.success) {
                    whatsappSent += 1;
                }
            } catch (err) {
                console.error("WhatsApp send error", err);
            }
        }

        const newNotification = await prisma.notification.create({
            data: {
                invoiceId: invoiceId,
                email: customer.email,
                phone: customer.phone,
            },
        });

        const allEmailSent = emailRecipients.length === emailSent;
        const allWhatsappSent = phoneRecipients.length === whatsappSent;
        const success = allEmailSent && allWhatsappSent;

        return NextResponse.json(
            {
                success,
                data: newNotification,
                summary: {
                    email: { attempted: emailRecipients.length, sent: emailSent },
                    whatsapp: { attempted: phoneRecipients.length, sent: whatsappSent },
                },
                error: success ? undefined : "Some notifications failed to send",
            },
            { status: 200 },
        );
    } catch (error: unknown) {
        console.error(error);
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ success: false, error: message ?? "Unexpected error" }, { status: 500 });
    }
}

function getDateString(input?: Date | string | null) {
    if (!input) return "";
    const date = new Date(String(input));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}/${day}/${year}`;
}
