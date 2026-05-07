import { NextResponse } from "next/server";
import { auth } from "@/lib/next-auth";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const badRequest = (message: string) => NextResponse.json({ message }, { status: 400 });

type BodyPayload = {
    fileName: string;
    uploadPath: string; // full path in dropbox, e.g. /Customer/Invoice_Name.xlsx
    oldExcelFilePath?: string | null; // path to delete
    mimeType?: string;
    base64: string; // file content as base64
};

async function getSetting(name: string) {
    const s = await prisma.setting.findUnique({ where: { name } });
    return s?.value ?? null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) {
        return NextResponse.json({ message: "User is not authenticated" }, { status: 401 });
    }
    const { id: rawId } = await params;
    const id = Number(rawId);
    if (!Number.isInteger(id)) {
        return badRequest("Invalid invoice id");
    }

    try {
        const body = (await request.json()) as BodyPayload;

        if (!body || !body.fileName || !body.uploadPath || !body.base64) {
            return badRequest("Missing upload payload");
        }

        const accessToken = await getSetting("dropbox");
        if (!accessToken) {
            return NextResponse.json({ message: "Dropbox access token not configured" }, { status: 500 });
        }

        const buffer = Buffer.from(body.base64, "base64");

        // Upload to Dropbox content API
        const uploadRes = await fetch("https://content.dropboxapi.com/2/files/upload", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/octet-stream",
                "Dropbox-API-Arg": JSON.stringify({
                    path: body.uploadPath,
                    mode: "overwrite",
                    autorename: false,
                    mute: true,
                }),
            },
            // cast buffer to BodyInit to satisfy TS fetch overloads in this environment
            body: buffer as unknown as BodyInit,
        });

        if (!uploadRes.ok) {
            const text = await uploadRes.text();
            console.error("Dropbox upload failed", text);
            return NextResponse.json({ message: "Dropbox upload failed" }, { status: 502 });
        }

        // Try to create a shared link for download
        let sharedUrl: string | null = null;

        // First list existing shared links
        const listRes = await fetch("https://api.dropboxapi.com/2/sharing/list_shared_links", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ path: body.uploadPath, direct_only: true }),
        });

        if (listRes.ok) {
            const listJson = await listRes.json();
            if (listJson && Array.isArray(listJson.links) && listJson.links.length > 0) {
                sharedUrl = listJson.links[0].url;
            }
        }

        if (!sharedUrl) {
            const createRes = await fetch("https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ path: body.uploadPath }),
            });

            if (createRes.ok) {
                const createJson = await createRes.json();
                sharedUrl = createJson.url;
            } else {
                const txt = await createRes.text();
                console.warn("create_shared_link failed", txt);
            }
        }

        if (!sharedUrl) {
            // fallback to non-shared url (not ideal)
            sharedUrl = `https://www.dropbox.com/home${encodeURI(body.uploadPath)}`;
        }

        // convert to dl=1 link if possible
        if (sharedUrl.includes("?")) {
            sharedUrl = sharedUrl.replace(/(\?|&)dl=0/, "$1dl=1");
            if (!/dl=1/.test(sharedUrl)) {
                sharedUrl = sharedUrl + "&dl=1";
            }
        } else {
            sharedUrl = sharedUrl + "?dl=1";
        }

        // Delete old file if provided and differs from new path
        if (body.oldExcelFilePath && body.oldExcelFilePath !== body.uploadPath) {
            try {
                await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ path: body.oldExcelFilePath }),
                });
            } catch (err) {
                console.warn("failed to delete old dropbox file", err);
            }
        }

        // persist into invoice.excelFile as JSON string
        const excelValue = JSON.stringify({ name: body.fileName, url: sharedUrl });

        await prisma.invoice.update({ where: { id }, data: { excelFile: excelValue } });

        // Try to convert the uploaded Excel to an image (PNG) and upload that image to Dropbox.
        // This requires `xlsx` and `puppeteer` to be installed. If not available, we'll skip conversion.
        try {
            const XLSXmod = await import("xlsx");
            const puppeteerMod = await import("puppeteer");
            const XLSX = (XLSXmod && (XLSXmod.default ?? XLSXmod)) as unknown as typeof import("xlsx");
            const puppeteer = (puppeteerMod && (puppeteerMod.default ?? puppeteerMod)) as unknown as typeof import("puppeteer");

            // Read workbook from the uploaded buffer
            const workbook = XLSX.read(buffer, { type: "buffer" });
            const sheetName = workbook.SheetNames && workbook.SheetNames[0];
            if (sheetName) {
                const sheet = workbook.Sheets[sheetName];
                const html = XLSX.utils.sheet_to_html(sheet);

                // Render HTML to PNG using puppeteer
                const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-setuid-sandbox"] });
                const page = await browser.newPage();
                // Basic styling to make the sheet readable
                await page.setContent(
                    `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family: sans-serif;padding:8px;} table{border-collapse:collapse;} td, th{border:1px solid #e5e7eb;padding:6px;font-size:12px;}</style></head><body>${html}</body></html>`,
                    { waitUntil: "networkidle0" },
                );
                const pngBuffer = await page.screenshot({ fullPage: true, type: "png" });
                await browser.close();

                // compute image file name and upload path using invoice customer info
                const invoiceRec = await prisma.invoice.findUnique({ where: { id }, select: { customer: { select: { name: true, contactName: true } }, imageFile: true } });
                const customerName = invoiceRec?.customer?.name ?? invoiceRec?.customer?.contactName ?? "Customer";
                const date = new Date();
                const year = date.getFullYear();
                const month = (date.getMonth() + 1).toString().padStart(2, "0");
                const day = date.getDate().toString().padStart(2, "0");
                const seconds = date.getSeconds().toString().padStart(2, "0");
                const minutes = date.getMinutes().toString().padStart(2, "0");
                const hour = date.getHours().toString().padStart(2, "0");
                const formattedDate = `${month}${day}${year}_${hour}${minutes}${seconds}`;

                const imageFileName = `Invoice_${customerName}_${formattedDate}.png`;
                const imageUploadPath = `/${customerName}/images/${imageFileName}`;

                // Upload PNG to Dropbox
                const imgUploadRes = await fetch("https://content.dropboxapi.com/2/files/upload", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/octet-stream",
                        "Dropbox-API-Arg": JSON.stringify({ path: imageUploadPath, mode: "overwrite", autorename: false, mute: true }),
                    },
                    // cast pngBuffer to BodyInit for TypeScript
                    body: pngBuffer as unknown as BodyInit,
                });

                if (imgUploadRes.ok) {
                    // create/get shared link for image
                    let imgSharedUrl: string | null = null;
                    const listImgRes = await fetch("https://api.dropboxapi.com/2/sharing/list_shared_links", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ path: imageUploadPath, direct_only: true }),
                    });
                    if (listImgRes.ok) {
                        const listImgJson = await listImgRes.json();
                        if (listImgJson && Array.isArray(listImgJson.links) && listImgJson.links.length > 0) {
                            imgSharedUrl = listImgJson.links[0].url;
                        }
                    }
                    if (!imgSharedUrl) {
                        const createImgRes = await fetch("https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings", {
                            method: "POST",
                            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                            body: JSON.stringify({ path: imageUploadPath }),
                        });
                        if (createImgRes.ok) {
                            const createImgJson = await createImgRes.json();
                            imgSharedUrl = createImgJson.url;
                        }
                    }
                    if (!imgSharedUrl) imgSharedUrl = `https://www.dropbox.com/home${encodeURI(imageUploadPath)}`;
                    if (imgSharedUrl.includes("?")) {
                        imgSharedUrl = imgSharedUrl.replace(/(\?|&)dl=0/, "$1dl=1");
                        if (!/dl=1/.test(imgSharedUrl)) imgSharedUrl = imgSharedUrl + "&dl=1";
                    } else {
                        imgSharedUrl = imgSharedUrl + "?dl=1";
                    }

                    // delete old image file if exists
                    try {
                        if (invoiceRec?.imageFile) {
                            try {
                                const parsedImg = JSON.parse(invoiceRec.imageFile);
                                if (parsedImg && parsedImg.name) {
                                    const oldImgPath = `/${customerName}/images/${parsedImg.name}`;
                                    if (oldImgPath !== imageUploadPath) {
                                        await fetch("https://api.dropboxapi.com/2/files/delete_v2", {
                                            method: "POST",
                                            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
                                            body: JSON.stringify({ path: oldImgPath }),
                                        });
                                    }
                                }
                            } catch {}
                        }
                    } catch (err) {
                        console.warn("failed to delete old image", err);
                    }

                    const imageValue = JSON.stringify({ name: imageFileName, url: imgSharedUrl });
                    await prisma.invoice.update({ where: { id }, data: { imageFile: imageValue } });
                } else {
                    const txt = await imgUploadRes.text();
                    console.warn("image upload failed", txt);
                }
            }
        } catch (err) {
            console.warn("Excel to image conversion skipped or failed:", err);
        }

        return NextResponse.json({ excelFile: excelValue });
    } catch (error) {
        console.error("Failed to upload excel", error);
        return NextResponse.json({ message: "Unable to upload excel" }, { status: 500 });
    }
}
