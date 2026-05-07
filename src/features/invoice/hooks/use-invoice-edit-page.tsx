import * as React from "react";
import { useToast } from "@/components/ui/use-toast";
import { useInvoiceEdit } from "@/features/invoice/hooks/use-invoice-edit";

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

type UseInvoiceEditPageParams = {
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

export function useInvoiceEditPage({ invoiceId, initialEditable = false }: UseInvoiceEditPageParams) {
    const invoice = useInvoiceEdit({ invoiceId, initialEditable });
    const { toast } = useToast();

    const { data, form, isEditable, isLoading, isSaving, formDisabled, error, setIsEditable, onChange, onToggle, handleSave } = invoice;

    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [pendingFile, setPendingFile] = React.useState<File | null>(null);
    const [pendingFileName, setPendingFileName] = React.useState<string | null>(null);

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
                <div className="text-sm text-muted-foreground">{row.email.length ? row.email.map((e: string, i: number) => <div key={i}>{e}</div>) : <span>-</span>}</div>
            ),
        },
        {
            id: "phone",
            header: "Phone",
            sortable: true,
            sortValue: (row: NotificationRow) => row.phone.join(" "),
            cell: (row: NotificationRow) => (
                <div className="text-sm text-muted-foreground">{row.phone.length ? row.phone.map((p: string, i: number) => <div key={i}>{p}</div>) : <span>-</span>}</div>
            ),
        },
        {
            id: "createdAt",
            header: "Created",
            sortable: true,
            sortValue: (row: NotificationRow) => new Date(row.createdAt).getTime(),
            cell: (row: NotificationRow) => <span className="text-sm text-muted-foreground">{new Date(row.createdAt).toLocaleDateString()}</span>,
        },
    ];

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

    return {
        // base props
        data,
        form,
        isEditable,
        isLoading,
        isSaving,
        formDisabled,
        error,
        setIsEditable,
        onChange,
        onToggle,
        handleSave,
        // upload + ui
        isUploading,
        fileInputRef,
        pendingFileName,
        handleFileSelect,
        onSaveClick,
        notificationRows,
        notificationColumns,
        imageUrl,
        excelFileName,
        excelFileUrl,
    } as const;
}
