"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/ui/use-toast";
import { createCustomer, type CustomerCreatePayload } from "@/features/customer/api/customer-api";
import { type CustomerPhoneEntry } from "@/features/customer/data/customer-data";

type FormState = {
    name: string;
    status: "Active" | "Inactive";
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
    contactName: "",
    emails: [""],
    phones: [{ type: false, number: "", group: "" }],
    price: "7.5",
    bundlePrice: "",
    owed: "",
    bundle: false,
    showSaved: false,
    excludeReport: false,
    holidayCalculation: true,
    weeklyCustomPayment: false,
    weeklyLeadQty: "",
    invoiceNumber: "",
    extraTextContent: "",
    customCreditValue: "",
    showPercentage: false,
    showTotalLeadQty: false,
    excludeWeekdays: [],
};

const joinListValue = (values: string[]) => JSON.stringify(values.map((item) => item.trim()).filter(Boolean));

const hasPhoneEntryValue = (entry: { type: boolean; number: string; group?: string | null }) => (entry.type ? Boolean(entry.group?.trim()) : Boolean(entry.number.trim()));

const parseOptionalNumber = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
};

const serializePhoneList = (values: CustomerPhoneEntry[]) => {
    const list = values
        .map((entry) => ({
            type: Boolean(entry.type),
            number: entry.number.trim(),
            group: entry.group?.trim() || "",
        }))
        .filter((entry) => hasPhoneEntryValue(entry));

    return list.length ? JSON.stringify(list) : "";
};

type UseCustomerCreateParams = {
    initialEditable?: boolean;
};

type FormErrors = {
    name?: string;
    phone?: string;
    price?: string;
    bundlePrice?: string;
    owed?: string;
    emails?: string;
    weeklyLeadQty?: string;
    customCreditValue?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useCustomerCreate({ initialEditable = true }: UseCustomerCreateParams = {}) {
    const router = useRouter();
    const { toast } = useToast();
    const [form, setForm] = React.useState<FormState>(emptyForm);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isEditable, setIsEditable] = React.useState(initialEditable);
    const [errors, setErrors] = React.useState<FormErrors>({});

    const onChange = (key: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (errors[key as keyof FormErrors]) {
            setErrors((prev) => ({ ...prev, [key]: undefined }));
        }
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
        if (errors.emails) {
            setErrors((prev) => ({ ...prev, emails: undefined }));
        }
    };

    const updatePhoneItem = (index: number, key: keyof CustomerPhoneEntry, value: string | boolean) => {
        setForm((prev) => {
            const next = [...prev.phones];
            const current = next[index];
            const updated = { ...current, [key]: value } as CustomerPhoneEntry;

            if (key === "type") {
                if (value === true) {
                    updated.number = "";
                } else {
                    updated.group = "";
                }
            }

            next[index] = updated;
            return { ...prev, phones: next };
        });
        if (errors.phone) {
            setErrors((prev) => ({ ...prev, phone: undefined }));
        }
    };

    const addListItem = (key: "emails") => {
        setForm((prev) => ({ ...prev, [key]: [...prev[key], ""] }));
        if (errors.emails) {
            setErrors((prev) => ({ ...prev, emails: undefined }));
        }
    };

    const addPhoneItem = () => {
        setForm((prev) => ({ ...prev, phones: [...prev.phones, { type: false, number: "", group: "" }] }));
        if (errors.phone) {
            setErrors((prev) => ({ ...prev, phone: undefined }));
        }
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

    const validateForm = () => {
        const nextErrors: FormErrors = {};
        const nameValue = form.name.trim();
        const phoneValue = serializePhoneList(form.phones);
        const emailValues = form.emails.map((value) => value.trim()).filter(Boolean);

        if (!nameValue) {
            nextErrors.name = "Customer name is required.";
        }

        if (!phoneValue) {
            nextErrors.phone = "Add at least one phone number.";
        }

        if (emailValues.length && emailValues.some((value) => !emailPattern.test(value))) {
            nextErrors.emails = "Enter a valid email address.";
        }

        if (form.price.trim() && Number.isNaN(Number(form.price))) {
            nextErrors.price = "Price must be a number.";
        }

        if (form.bundlePrice.trim() && Number.isNaN(Number(form.bundlePrice))) {
            nextErrors.bundlePrice = "Bundle price must be a number.";
        }

        if (form.owed.trim() && Number.isNaN(Number(form.owed))) {
            nextErrors.owed = "Owed must be a number.";
        }

        if (form.weeklyLeadQty.trim() && Number.isNaN(Number(form.weeklyLeadQty))) {
            nextErrors.weeklyLeadQty = "Weekly lead qty must be a number.";
        }

        if (form.customCreditValue.trim() && Number.isNaN(Number(form.customCreditValue))) {
            nextErrors.customCreditValue = "Custom credit must be a number.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSaving(true);

        try {
            const payload: CustomerCreatePayload = {
                name: form.name.trim(),
                status: form.status,
                contactName: form.contactName.trim(),
                email: joinListValue(form.emails),
                phone: serializePhoneList(form.phones),
                price: form.price.trim(),
                bundlePrice: form.bundlePrice.trim(),
                owed: form.owed.trim(),
                bundle: form.bundle,
                showSaved: form.showSaved,
                excludeReport: form.excludeReport,
                holidayCalculation: form.holidayCalculation,
                weeklyCustomPayment: form.weeklyCustomPayment,
                weeklyLeadQty: parseOptionalNumber(form.weeklyLeadQty),
                invoiceNumber: form.invoiceNumber.trim(),
                extraTextContent: form.extraTextContent.trim(),
                customCreditValue: parseOptionalNumber(form.customCreditValue),
                showPercentage: form.showPercentage,
                showTotalLeadQty: form.showTotalLeadQty,
                excludeWeekdays: form.excludeWeekdays,
            };

            const created = await createCustomer(payload);
            toast({
                title: "Customer created",
                description: "Customer record created successfully.",
                variant: "success",
            });
            router.push(`/customer/${created.id}`);
        } catch (err) {
            console.error(err);
            toast({
                title: "Creation failed",
                description: err instanceof Error ? err.message : "Unable to create customer.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const formDisabled = !isEditable || isSaving;

    return {
        form,
        errors,
        isEditable,
        isSaving,
        formDisabled,
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
