"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/data-table/data-table";
import { useInvoiceEdit } from "@/features/invoice/hooks/use-invoice-edit";
import { deleteInvoice } from "@/features/invoice/api/invoice-api";
import { useToast } from "@/components/ui/use-toast";
import * as React from "react";
import { Sidebar, Topbar } from "@/features/dashboard/components";

// UI-only component — logic is in `useInvoiceEditPage` hook

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : "-");

const resolveFileUrl = (value?: string) => {
    if (!value) return "";
    if (value.startsWith("/") || value.startsWith("http://") || value.startsWith("https://")) return value;
    return `/uploads/${value}`;
};

const getFileName = (value: string) => {
    try {
        const parsed = new URL(value, "http://localhost");
        const base = parsed.pathname.split("/").pop();
        return base || value;
    } catch {
        const base = value.split("/").pop();
        return base || value;
    }
};

type InvoiceEditPageProps = {
    invoiceId: string;
    initialEditable?: boolean;
};

type NotificationRow = {
    id: string;
    email: string[];
    phone: string[];
    createdAt: string;
    displayNo: number;
};

export function InvoiceEditPage({ invoiceId, initialEditable = false }: InvoiceEditPageProps) {
    const router = useRouter();
    const { data, form, isLoading, isSaving, formDisabled, error, onChange, handleSave } = useInvoiceEdit({
        invoiceId,
        initialEditable,
    });
    const { toast } = useToast();
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [pendingFile, setPendingFile] = React.useState<File | null>(null);
    const [pendingFileName, setPendingFileName] = React.useState<string | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setPendingFile(file);
        setPendingFileName(file?.name ?? null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const uploadPendingFile = async () => {
        const file = pendingFile;
        if (!file) return null;
        setIsUploading(true);
        try {
            const date = new Date();
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const day = date.getDate().toString().padStart(2, "0");
            const seconds = date.getSeconds().toString().padStart(2, "0");
            const minutes = date.getMinutes().toString().padStart(2, "0");
            const hour = date.getHours().toString().padStart(2, "0");
            const formattedDate = `${month}${day}${year}_${hour}${minutes}${seconds}`;

            const customerName = form.customerName || form.customerContact || "Customer";
            const destExcelFileName = `Invoice_${customerName}_${formattedDate}.xlsx`;
            const uploadPath = `/${customerName}/${destExcelFileName}`;

            let oldExcelFilePath: string | null = null;
            if (form.excelFile) {
                try {
                    const parsed = JSON.parse(form.excelFile);
                    if (parsed && typeof parsed === "object" && parsed.name) {
                        oldExcelFilePath = `/${form.customerContact || form.customerName}/${parsed.name}`;
                    }
                } catch {
                    const base = getFileName(form.excelFile || "");
                    if (base) oldExcelFilePath = `/${form.customerContact || form.customerName}/${base}`;
                }
            }

            const reader = new FileReader();
            const dataUrl = await new Promise<string | null>((resolve, reject) => {
                reader.onerror = () => reject(new Error("Failed to read file"));
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });
            if (!dataUrl) throw new Error("Empty file data");
            const base64 = dataUrl.split(",")[1];

            const res = await fetch(`/api/invoices/${invoiceId}/excel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileName: destExcelFileName, uploadPath, oldExcelFilePath, mimeType: file.type, base64 }),
            });

            const json = await res.json();
            if (res.ok && json?.excelFile) {
                onChange("excelFile", json.excelFile);
                setPendingFile(null);
                setPendingFileName(null);
                return json.excelFile;
            }
            throw new Error(json?.message || "Upload failed");
        } finally {
            setIsUploading(false);
        }
    };

    const onSaveClick = async () => {
        try {
            let uploadedExcel = null;
            if (pendingFile) {
                uploadedExcel = await uploadPendingFile();
                if (!uploadedExcel) return;
            }
            await handleSave();
            if (uploadedExcel) {
                toast({ title: "Upload complete", description: "Excel file uploaded and saved.", variant: "success" });
            } else {
                toast({ title: "Saved", description: "Changes saved.", variant: "success" });
            }
        } catch (err) {
            console.error(err);
            toast({ title: "Save failed", description: "Unable to save changes.", variant: "destructive" });
        }
    };

    const [isSendingNotification, setIsSendingNotification] = React.useState(false);

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteInvoice(invoiceId);
            toast({ title: "Invoice deleted", description: "Invoice was deleted successfully.", variant: "success" });
            router.push("/invoice");
        } catch (err) {
            console.error(err);
            toast({ title: "Delete failed", description: "Unable to delete invoice.", variant: "destructive" });
        } finally {
            setIsDeleting(false);
            setDeleteDialogOpen(false);
        }
    };

    const handleSendNotification = async () => {
        if (!data) return;
        setIsSendingNotification(true);
        toast({ title: "Sending notifications", description: "Sending..." });
        try {
            const res = await fetch(`/api/invoices/${invoiceId}/send-notification`, { method: "POST" });
            const json = await res.json();
            if (res.ok && json?.success) {
                toast({ title: "Notifications sent", description: "Email and WhatsApp notifications were sent.", variant: "success" });
            } else {
                console.error(json);
                toast({ title: "Send failed", description: json?.error || "Unable to send notifications.", variant: "destructive" });
            }
        } catch (err) {
            console.error(err);
            toast({ title: "Send failed", description: "Unable to send notifications.", variant: "destructive" });
        } finally {
            setIsSendingNotification(false);
        }
    };

    const normalizeToStringArray = (value: unknown, forPhone = false): string[] => {
        if (value == null) return [];
        if (Array.isArray(value)) {
            return value
                .map((v) => {
                    if (v == null) return "";
                    if (typeof v === "string") return v;
                    if (typeof v === "object") {
                        const obj = v as { group?: string; number?: string; email?: string };
                        if (forPhone) return obj.group ?? obj.number ?? JSON.stringify(obj);
                        return obj.email ?? JSON.stringify(obj);
                    }
                    return String(v);
                })
                .filter(Boolean);
        }

        if (typeof value === "string") {
            try {
                const parsed = JSON.parse(value);
                return normalizeToStringArray(parsed, forPhone);
            } catch {
                return value ? [value] : [];
            }
        }

        if (typeof value === "object") {
            const obj = value as { group?: string; number?: string; email?: string };
            if (forPhone) return [obj.group ?? obj.number ?? JSON.stringify(obj)];
            return [obj.email ?? JSON.stringify(obj)];
        }

        return [String(value)];
    };

    const notificationRows: NotificationRow[] = (data?.notifications ?? []).map((notification, index) => ({
        id: notification.id,
        email: normalizeToStringArray(notification.email, false),
        phone: normalizeToStringArray(notification.phone, true),
        createdAt: notification.createdAt,
        displayNo: index + 1,
    }));

    const notificationColumns = [
        {
            id: "no",
            header: "No",
            sortable: true,
            sortValue: (row: NotificationRow) => row.displayNo,
            cell: (row: NotificationRow) => <span className="text-sm font-semibold text-foreground">{row.displayNo}</span>,
        },
        {
            id: "email",
            header: "Email",
            sortable: true,
            sortValue: (row: NotificationRow) => row.email.join(" "),
            cell: (row: NotificationRow) => (
                <div className="text-sm text-muted-foreground">{row.email.length ? row.email.map((e, i) => <div key={i}>{e}</div>) : <span>-</span>}</div>
            ),
        },
        {
            id: "phone",
            header: "Phone",
            sortable: true,
            sortValue: (row: NotificationRow) => row.phone.join(" "),
            cell: (row: NotificationRow) => (
                <div className="text-sm text-muted-foreground">{row.phone.length ? row.phone.map((p, i) => <div key={i}>{p}</div>) : <span>-</span>}</div>
            ),
        },
        {
            id: "createdAt",
            header: "Created",
            sortable: true,
            sortValue: (row: NotificationRow) => new Date(row.createdAt).getTime(),
            cell: (row: NotificationRow) => <span className="text-sm text-muted-foreground">{formatDate(row.createdAt)}</span>,
        },
    ];

    // Helper to get image URL from form.imageFile (which may be a JSON string)
    let imageUrl: string | undefined = undefined;
    if (form.imageFile) {
        try {
            const parsed = JSON.parse(form.imageFile);
            if (parsed && typeof parsed === "object" && parsed.url) {
                imageUrl = parsed.url;
            } else {
                imageUrl = resolveFileUrl(form.imageFile);
            }
        } catch {
            imageUrl = resolveFileUrl(form.imageFile);
        }
    }

    // Helper to get excel file name and url from form.excelFile
    let excelFileName: string | undefined = undefined;
    let excelFileUrl: string | undefined = undefined;
    if (form.excelFile) {
        try {
            const parsed = JSON.parse(form.excelFile);
            if (parsed && typeof parsed === "object") {
                excelFileName = parsed.name ?? getFileName(parsed.url ?? "");
                excelFileUrl = parsed.url ?? resolveFileUrl(parsed.name ?? "");
            } else {
                excelFileName = getFileName(form.excelFile);
                excelFileUrl = resolveFileUrl(form.excelFile);
            }
        } catch {
            excelFileName = getFileName(form.excelFile);
            excelFileUrl = resolveFileUrl(form.excelFile);
        }
    }

    return (
        <DashboardLayout sidebar={<Sidebar activeItem="Invoice" />} header={<Topbar activeItem="Invoice" />}>
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center justify-end w-full">
                        <Button className="rounded-sm" onClick={handleSendNotification} disabled={isLoading || !data || isSendingNotification}>
                            {isSendingNotification ? "Sending..." : "Send Notification"}
                        </Button>
                    </div>
                </div>

                {error ? <Card className="border-border/60 bg-card p-4 text-sm text-rose-600 shadow-sm">{error}</Card> : null}

                <div className="grid gap-6">
                    <Card className="border-border/60 bg-card p-6 shadow-sm">
                        <div>
                            {imageUrl ? (
                                <div className="mt-3 overflow-hidden rounded-sm border border-border/60 bg-card">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={imageUrl}
                                        alt="Invoice image"
                                        className="h-auto w-full object-cover"
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none";
                                        }}
                                    />
                                </div>
                            ) : null}
                            <div className="mt-2 flex flex-wrap items-center justify-end">
                                <Button className="rounded-sm" asChild disabled={!imageUrl}>
                                    <a href={imageUrl || "#"} download={imageUrl ? imageUrl.split("/").pop() : undefined}>
                                        Download
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
                <div className="grid gap-6">
                    <Card className="border-border/60 bg-card p-6 shadow-sm">
                        <div>
                            <p className="text-md font-semibold text-primary">Invoice Details</p>
                            <p className="text-xs text-muted-foreground">Update invoice schedule and pricing.</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Customer</label>
                                <Input className="mt-2" value={form.customerName} disabled />
                            </div>
                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Contact</label>
                                <Input className="mt-2" value={form.customerContact} disabled />
                            </div>
                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Start Date</label>
                                <Input
                                    className="mt-2"
                                    type="date"
                                    value={form.startDate}
                                    onChange={(event) => onChange("startDate", event.target.value)}
                                    disabled={formDisabled}
                                />
                            </div>
                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">End Date</label>
                                <Input className="mt-2" type="date" value={form.endDate} onChange={(event) => onChange("endDate", event.target.value)} disabled={formDisabled} />
                            </div>
                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Sent Date</label>
                                <Input className="mt-2" type="date" value={form.sentDate} onChange={(event) => onChange("sentDate", event.target.value)} disabled={formDisabled} />
                            </div>
                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Amount</label>
                                <Input className="mt-2" type="number" value={form.amount} onChange={(event) => onChange("amount", event.target.value)} disabled={formDisabled} />
                            </div>
                        </div>
                        <div className="grid gap-4">
                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Excel File</label>
                                <div className="mt-2">
                                    {excelFileUrl ? (
                                        <a href={excelFileUrl} download={excelFileName} className="text-sm font-medium text-primary">
                                            {excelFileName}
                                        </a>
                                    ) : (
                                        <span className="text-sm text-muted-foreground">No excel file</span>
                                    )}
                                    <div className="flex gap-2 mt-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".xlsx,.xls"
                                            className="hidden"
                                            disabled={formDisabled || isUploading}
                                            onChange={handleFileSelect}
                                        />
                                        <Button className="rounded-sm" disabled={formDisabled || isUploading} onClick={() => fileInputRef.current?.click()}>
                                            {isUploading ? "Replacing..." : "Replace"}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                <Card className="border-border/60 bg-card p-6 shadow-sm gap-0">
                    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-4">
                        <div>
                            <p className="text-md font-semibold text-primary">Notifications</p>
                            <p className="text-xs text-muted-foreground">Notifications sent for this invoice.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <DataTable
                            data={notificationRows}
                            columns={notificationColumns}
                            rowId={(row) => row.id}
                            enableSelection={false}
                            loading={isLoading}
                            loadingLabel="Loading notifications..."
                            search={{
                                placeholder: "Search notifications",
                                accessor: (row) => [row.email.join(" "), row.phone.join(" "), row.createdAt].join(" ").toLowerCase(),
                            }}
                            emptyLabel="No notifications found."
                        />
                    </div>
                </Card>

                <div className="flex items-center justify-between gap-2">
                    <Button variant="destructive" className="rounded-sm" onClick={() => setDeleteDialogOpen(true)} disabled={isLoading || isSaving || isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" asChild className="rounded-sm">
                            <Link href="/invoice">Cancel</Link>
                        </Button>
                        <Button className="rounded-sm" onClick={onSaveClick} disabled={isLoading || isSaving || isDeleting}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete invoice</DialogTitle>
                            <DialogDescription>This action cannot be undone. This will permanently delete the invoice.</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
                                {isDeleting ? "Deleting..." : "Delete"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
