"use client";

import * as React from "react";

import { useToast } from "@/components/ui/use-toast";
import { fetchInvoiceDetail, updateInvoiceDetail, type InvoiceDetail, type UpdateInvoicePayload } from "@/features/invoice/api/invoice-api";

type FormState = {
    invoiceId: string;
    customerId: string;
    customerName: string;
    customerContact: string;
    customerStatus: InvoiceDetail["customerStatus"] | "";
    amount: string;
    startDate: string;
    endDate: string;
    sentDate: string;
    prior: string;
    pageOrientation: boolean;
    excelFile: string;
    imageFile: string;
};

const emptyForm: FormState = {
    invoiceId: "",
    customerId: "",
    customerName: "",
    customerContact: "",
    customerStatus: "",
    amount: "",
    startDate: "",
    endDate: "",
    sentDate: "",
    prior: "",
    pageOrientation: true,
    excelFile: "",
    imageFile: "",
};

const toDateInput = (value?: string) => {
    if (!value) {
        return "";
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return "";
    }
    return parsed.toISOString().slice(0, 10);
};

const toIsoDate = (value: string) => {
    if (!value) {
        return "";
    }
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
        return "";
    }
    return parsed.toISOString();
};

type UseInvoiceEditParams = {
    invoiceId: string;
    initialEditable?: boolean;
};

export function useInvoiceEdit({ invoiceId, initialEditable = false }: UseInvoiceEditParams) {
    const { toast } = useToast();
    const [data, setData] = React.useState<InvoiceDetail | null>(null);
    const [form, setForm] = React.useState<FormState>(emptyForm);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isEditable, setIsEditable] = React.useState(initialEditable);

    React.useEffect(() => {
        const controller = new AbortController();

        const loadInvoice = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const payload = await fetchInvoiceDetail(invoiceId, { signal: controller.signal });
                setData(payload);
                setForm({
                    invoiceId: payload.id,
                    customerId: payload.customerId,
                    customerName: payload.customerName,
                    customerContact: payload.customerContact,
                    customerStatus: payload.customerStatus,
                    amount: String(payload.amount ?? ""),
                    startDate: toDateInput(payload.startDate),
                    endDate: toDateInput(payload.endDate),
                    sentDate: toDateInput(payload.sentDate),
                    prior: payload.prior === null || payload.prior === undefined ? "" : String(payload.prior),
                    pageOrientation: payload.pageOrientation,
                    excelFile: payload.excelFile ?? "",
                    imageFile: payload.imageFile ?? "",
                });
            } catch (err) {
                if (controller.signal.aborted) {
                    return;
                }
                console.error(err);
                setError("Unable to load invoice.");
                setData(null);
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        loadInvoice();

        return () => controller.abort();
    }, [invoiceId]);

    const onChange = (key: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const onToggle = (key: "pageOrientation") => {
        setForm((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = async () => {
        const amount = Number(form.amount);
        const prior = form.prior.trim() ? Number(form.prior) : null;
        const startDate = toIsoDate(form.startDate);
        const endDate = toIsoDate(form.endDate);
        const sentDate = toIsoDate(form.sentDate);

        if (!Number.isFinite(amount)) {
            toast({
                title: "Amount required",
                description: "Provide a valid amount before saving.",
                variant: "destructive",
            });
            return;
        }

        if (!startDate || !endDate || !sentDate) {
            toast({
                title: "Dates required",
                description: "Start, end, and sent dates are required.",
                variant: "destructive",
            });
            return;
        }

        if (prior !== null && !Number.isFinite(prior)) {
            toast({
                title: "Invalid prior",
                description: "Prior must be a number.",
                variant: "destructive",
            });
            return;
        }

        const payload: UpdateInvoicePayload = {
            amount,
            startDate,
            endDate,
            sentDate,
            prior,
            pageOrientation: form.pageOrientation,
            excelFile: form.excelFile.trim(),
            imageFile: form.imageFile.trim(),
        };

        setIsSaving(true);

        try {
            await updateInvoiceDetail(invoiceId, payload);
            toast({
                title: "Invoice updated",
                description: "Changes saved successfully.",
                variant: "success",
            });
        } catch (err) {
            console.error(err);
            toast({
                title: "Update failed",
                description: "Unable to save invoice changes.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const formDisabled = isLoading || !isEditable;

    return {
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
    };
}
