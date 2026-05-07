"use client";

import * as React from "react";

import { useToast } from "@/components/ui/use-toast";
import { updateCustomerDetail, type CustomerUpdatePayload } from "@/features/customer/api/customer-api";
import { type CustomerPhoneEntry } from "@/features/customer/data/customer-data";
import { useCustomer } from "@/features/customer/hooks/use-customer";

type FormState = {
    name: string;
    status: "Active" | "Inactive";
    customerId: string;
    campaigns: string;
    agents: string;
    contactName: string;
    emails: string[];
    phones: CustomerPhoneEntry[];
    price: string;
    bundlePrice: string;
    owed: string;
    bundle: boolean;
    showSaved: boolean;
    excludeReport: boolean;
    holidayCalculation: boolean;
    weeklyCustomPayment: boolean;
    weeklyLeadQty: string;
    invoiceNumber: string;
    extraTextContent: string;
    customCreditValue: string;
    showPercentage: boolean;
    showTotalLeadQty: boolean;
    excludeWeekdays: string[];
};

const emptyForm: FormState = {
    name: "",
    status: "Active",
    customerId: "",
    campaigns: "0",
    agents: "0",
    contactName: "",
    emails: [""],
    phones: [{ type: false, number: "", group: "" }],
    price: "",
    bundlePrice: "",
    owed: "",
    bundle: false,
    showSaved: false,
    excludeReport: false,
    holidayCalculation: false,
    weeklyCustomPayment: false,
    weeklyLeadQty: "",
    invoiceNumber: "",
    extraTextContent: "",
    customCreditValue: "",
    showPercentage: false,
    showTotalLeadQty: false,
    excludeWeekdays: [],
};

const splitListValue = (value?: string | string[] | null) => {
    if (Array.isArray(value)) {
        const items = value.map((item) => item.trim()).filter(Boolean);
        return items.length ? items : [""];
    }
    if (!value) {
        return [""];
    }
    const trimmed = value.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
            const parsed = JSON.parse(trimmed) as unknown;
            if (Array.isArray(parsed)) {
                const items = parsed.map((item) => String(item).trim()).filter(Boolean);
                return items.length ? items : [""];
            }
        } catch {
            // Fall back to comma split.
        }
    }
    const items = trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

    return items.length ? items : [""];
};

const joinListValue = (values: string[]) => JSON.stringify(values.map((item) => item.trim()).filter(Boolean));
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hasPhoneEntryValue = (entry: { type: boolean; number: string; group?: string | null }) => (entry.type ? Boolean(entry.group?.trim()) : Boolean(entry.number.trim()));
const parseOptionalNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
};

const parsePhoneList = (value?: string | CustomerPhoneEntry[] | null) => {
    if (Array.isArray(value)) {
        const items = value
            .map((entry) => ({
                type: Boolean(entry.type),
                number: entry.number?.trim() ?? "",
                group: entry.group ?? "",
            }))
            .filter((entry) => hasPhoneEntryValue(entry));
        return items.length ? items : [{ type: false, number: "", group: "" }];
    }
    if (!value) {
        return [{ type: false, number: "", group: "" }];
    }
    const trimmed = value.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
            const parsed = JSON.parse(trimmed) as unknown;
            if (Array.isArray(parsed)) {
                const items = parsed
                    .map((entry) => {
                        if (typeof entry === "string") {
                            return { type: false, number: entry.trim(), group: "" };
                        }
                        if (entry && typeof entry === "object") {
                            const record = entry as { type?: unknown; number?: unknown; group?: unknown };
                            return {
                                type: Boolean(record.type),
                                number: typeof record.number === "string" ? record.number.trim() : "",
                                group: typeof record.group === "string" ? record.group.trim() : "",
                            };
                        }
                        return { type: false, number: "", group: "" };
                    })
                    .filter((entry) => hasPhoneEntryValue(entry));
                return items.length ? items : [{ type: false, number: "", group: "" }];
            }
        } catch {
            // Fall back to comma split.
        }
    }
    const items = trimmed
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => ({ type: false, number: item, group: "" }));
    return items.length ? items : [{ type: false, number: "", group: "" }];
};

const serializePhoneList = (values: CustomerPhoneEntry[]) =>
    JSON.stringify(
        values
            .map((entry) => ({
                type: Boolean(entry.type),
                number: entry.number.trim(),
                group: entry.group?.trim() || "",
            }))
            .filter((entry) => hasPhoneEntryValue(entry)),
    );

type UseCustomerEditParams = {
    customerId: string;
    initialEditable?: boolean;
};

export function useCustomerEdit({ customerId, initialEditable = false }: UseCustomerEditParams) {
    const { data, isLoading, error } = useCustomer(customerId);
    const { toast } = useToast();
    const [form, setForm] = React.useState<FormState>(emptyForm);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isEditable, setIsEditable] = React.useState(initialEditable);

    const emailErrors = React.useMemo(
        () =>
            form.emails.map((email) => {
                const trimmed = email.trim();
                if (!trimmed) return false;
                return !EMAIL_PATTERN.test(trimmed);
            }),
        [form.emails],
    );

    const hasEmailErrors = React.useMemo(() => emailErrors.some(Boolean), [emailErrors]);

    React.useEffect(() => {
        if (!data) {
            return;
        }

        setForm({
            name: data.name,
            status: data.status,
            customerId: data.id,
            campaigns: String(data.campaigns ?? 0),
            agents: String(data.agents ?? 0),
            contactName: data.contactName ?? "",
            emails: splitListValue(data.email),
            phones: parsePhoneList(data.phone),
            price: String(data.price ?? ""),
            bundlePrice: String(data.bundlePrice ?? ""),
            owed: String(data.owed ?? ""),
            bundle: data.bundle ?? false,
            showSaved: data.showSaved ?? false,
            excludeReport: data.excludeReport ?? false,
            holidayCalculation: data.holidayCalculation ?? false,
            weeklyCustomPayment: data.weeklyCustomPayment ?? false,
            weeklyLeadQty: data.weeklyLeadQty !== null && data.weeklyLeadQty !== undefined ? String(data.weeklyLeadQty) : "",
            invoiceNumber: data.invoiceNumber ?? "",
            extraTextContent: data.extraTextContent ?? "",
            customCreditValue: data.customCreditValue !== null && data.customCreditValue !== undefined ? String(data.customCreditValue) : "",
            showPercentage: data.showPercentage ?? false,
            showTotalLeadQty: data.showTotalLeadQty ?? false,
            excludeWeekdays: data.excludeWeekdays ?? [],
        });
    }, [data]);

    const onChange = (key: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const onToggle = (key: "bundle" | "showSaved" | "excludeReport" | "holidayCalculation" | "weeklyCustomPayment" | "showPercentage" | "showTotalLeadQty") => {
        setForm((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const onSet = (key: keyof FormState, value: FormState[keyof FormState]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const updateListItem = (key: "emails", index: number, value: string) => {
        setForm((prev) => {
            const next = [...prev[key]];
            next[index] = value;
            return { ...prev, [key]: next };
        });
    };

    const updatePhoneItem = (index: number, key: keyof CustomerPhoneEntry, value: string | boolean) => {
        setForm((prev) => {
            const next = [...prev.phones];
            next[index] = { ...next[index], [key]: value };
            return { ...prev, phones: next };
        });
    };

    const addListItem = (key: "emails") => {
        setForm((prev) => ({ ...prev, [key]: [...prev[key], ""] }));
    };

    const addPhoneItem = () => {
        setForm((prev) => ({ ...prev, phones: [...prev.phones, { type: false, number: "", group: "" }] }));
    };

    const removeListItem = (key: "emails", index: number) => {
        setForm((prev) => {
            const next = prev[key].filter((_, itemIndex) => itemIndex !== index);
            return { ...prev, [key]: next.length ? next : [""] };
        });
    };

    const removePhoneItem = (index: number) => {
        setForm((prev) => {
            const next = prev.phones.filter((_, itemIndex) => itemIndex !== index);
            return { ...prev, phones: next.length ? next : [{ type: false, number: "", group: "" }] };
        });
    };

    const handleSave = async () => {
        if (hasEmailErrors) {
            toast({
                title: "Invalid email address",
                description: "Please fix invalid email addresses before saving.",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);

        try {
            const payload: CustomerUpdatePayload = {
                name: form.name.trim(),
                status: form.status,
                contactName: form.contactName.trim(),
                email: joinListValue(form.emails),
                phone: serializePhoneList(form.phones),
                price: Number(form.price),
                bundlePrice: Number(form.bundlePrice),
                owed: Number(form.owed),
                bundle: form.bundle,
                showSaved: form.bundle ? form.showSaved : false,
                excludeReport: form.excludeReport,
                holidayCalculation: form.bundle ? form.holidayCalculation : false,
                weeklyCustomPayment: form.weeklyCustomPayment,
                weeklyLeadQty: parseOptionalNumber(form.weeklyLeadQty),
                invoiceNumber: form.invoiceNumber.trim(),
                extraTextContent: form.extraTextContent.trim(),
                customCreditValue: parseOptionalNumber(form.customCreditValue),
                showPercentage: form.showPercentage,
                showTotalLeadQty: form.showTotalLeadQty,
                excludeWeekdays: form.excludeWeekdays,
            };

            await updateCustomerDetail(customerId, payload);
            toast({
                title: "Customer updated",
                description: "Changes saved successfully.",
                variant: "success",
            });
        } catch (err) {
            console.error(err);
            toast({
                title: "Update failed",
                description: err instanceof Error ? err.message : "Unable to save customer changes.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const formDisabled = isLoading || !isEditable;

    return {
        data,
        error,
        form,
        isEditable,
        isLoading,
        isSaving,
        formDisabled,
        emailErrors,
        hasEmailErrors,
        setIsEditable,
        onChange,
        onToggle,
        onSet,
        updateListItem,
        updatePhoneItem,
        addListItem,
        addPhoneItem,
        removeListItem,
        removePhoneItem,
        handleSave,
    };
}
