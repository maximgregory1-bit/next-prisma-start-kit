"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import { useToast } from "@/components/ui/use-toast";

type ProfileResponse = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    image: string | null;
};

type ProfileForm = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    avatar: string | null;
};

type FormField = keyof ProfileForm;

const initialForm: ProfileForm = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    avatar: null,
};

const isProfileResponse = (value: unknown): value is ProfileResponse => {
    if (!value || typeof value !== "object") return false;
    const record = value as Record<string, unknown>;
    return typeof record.id === "string";
};

const getErrorMessage = (value: unknown, fallback: string) => {
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        if (typeof record.error === "string" && record.error.trim()) {
            return record.error;
        }
    }
    return fallback;
};

export function useSettingEditPage() {
    const { toast } = useToast();
    const { update } = useSession();

    const [form, setForm] = React.useState<ProfileForm>(initialForm);
    const [original, setOriginal] = React.useState<ProfileForm>(initialForm);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSaving, setIsSaving] = React.useState(false);
    const [isEditable, setIsEditable] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const formDisabled = isLoading || isSaving || !isEditable;

    const loadProfile = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch("/api/user/me", { cache: "no-store" });
            const payload = (await response.json().catch(() => null)) as unknown;

            if (!response.ok || !isProfileResponse(payload)) {
                throw new Error(getErrorMessage(payload, "Unable to load profile"));
            }

            const loadedForm: ProfileForm = {
                firstName: payload.firstName ?? "",
                lastName: payload.lastName ?? "",
                email: payload.email ?? "",
                password: "",
                avatar: payload.image ?? null,
            };

            setForm(loadedForm);
            setOriginal(loadedForm);
        } catch {
            setError("Unable to load admin profile.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    const onChange = React.useCallback((field: FormField, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    }, []);

    const onAvatarSelect = React.useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (!file) return;

            if (file.size > 800 * 1024) {
                toast({
                    title: "File too large",
                    description: "Maximum size is 800KB.",
                    variant: "destructive",
                });
                event.currentTarget.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const value = typeof reader.result === "string" ? reader.result : null;
                setForm((prev) => ({ ...prev, avatar: value }));
            };
            reader.readAsDataURL(file);
            event.currentTarget.value = "";
        },
        [toast],
    );

    const onAvatarReset = React.useCallback(() => {
        setForm((prev) => ({ ...prev, avatar: null }));
    }, []);

    const handleCancel = React.useCallback(() => {
        setForm({ ...original, password: "" });
        setIsEditable(false);
        setError(null);
    }, [original]);

    const handleSave = React.useCallback(async () => {
        setIsSaving(true);
        setError(null);
        try {
            const response = await fetch("/api/user/me", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    email: form.email.trim(),
                    password: form.password || undefined,
                    avatar: form.avatar,
                }),
            });

            const payload = (await response.json().catch(() => null)) as unknown;
            if (!response.ok || !isProfileResponse(payload)) {
                throw new Error(getErrorMessage(payload, "Unable to save profile"));
            }

            const savedForm: ProfileForm = {
                firstName: payload.firstName ?? "",
                lastName: payload.lastName ?? "",
                email: payload.email ?? "",
                password: "",
                avatar: payload.image ?? null,
            };

            setForm(savedForm);
            setOriginal(savedForm);
            setIsEditable(false);

            const sessionName = `${savedForm.firstName} ${savedForm.lastName}`.trim();
            await update({
                name: sessionName || undefined,
                email: savedForm.email || undefined,
            });

            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("admin-profile-updated", {
                        detail: {
                            image: savedForm.avatar,
                        },
                    }),
                );
            }

            toast({
                title: "Settings updated",
                description: "Admin information saved successfully.",
                variant: "success",
            });
        } catch (saveError) {
            const message = saveError instanceof Error ? saveError.message : "Unable to save profile";
            setError(message);
            toast({
                title: "Save failed",
                description: message,
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    }, [form, toast, update]);

    return {
        form,
        error,
        isEditable,
        isLoading,
        isSaving,
        formDisabled,
        setIsEditable,
        onChange,
        onAvatarSelect,
        onAvatarReset,
        handleSave,
        handleCancel,
    };
}
