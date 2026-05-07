"use client";

import * as React from "react";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sidebar, Topbar } from "@/features/dashboard/components";
import { useSettingEditPage } from "@/features/setting/hooks/use-setting-edit-page";

export function SettingEditPage() {
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const { form, error, isEditable, isLoading, isSaving, formDisabled, setIsEditable, onChange, onAvatarSelect, onAvatarReset, handleSave, handleCancel } = useSettingEditPage();

    return (
        <DashboardLayout sidebar={<Sidebar activeItem="Setting" />} header={<Topbar activeItem="Setting" />}>
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Settings</p>
                        <h1 className="text-2xl font-semibold text-primary">Edit Admin</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Update administrator profile information.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="rounded-sm" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button variant="outline" className="rounded-sm" onClick={() => setIsEditable((prev) => !prev)} disabled={isLoading || isSaving}>
                            {isEditable ? "Disable editing" : "Enable editing"}
                        </Button>
                        <Button className="rounded-sm" onClick={handleSave} disabled={isLoading || isSaving || !isEditable}>
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>

                {error ? <Card className="border-border/60 bg-card p-4 text-sm text-rose-600 shadow-sm">{error}</Card> : null}

                <Card className="border-border/60 bg-card p-6 shadow-sm">
                    <div className="flex items-start gap-6 border-b border-border/60 pb-6">
                        <Avatar className="size-24 rounded-md border border-border/60">
                            <AvatarImage src={form.avatar || "/images/avatar.png"} alt="Admin avatar" />
                            <AvatarFallback className="rounded-md">AD</AvatarFallback>
                        </Avatar>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onAvatarSelect} disabled={formDisabled} />
                                <Button type="button" className="rounded-sm" disabled={formDisabled} onClick={() => fileInputRef.current?.click()}>
                                    Upload new photo
                                </Button>
                                <Button type="button" variant="outline" className="rounded-sm" onClick={onAvatarReset} disabled={formDisabled}>
                                    Reset
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">Allowed JPG, GIF or PNG. Max size of 800K</p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                        <div>
                            <label className="text-[14px] font-semibold text-muted-foreground">First Name</label>
                            <Input className="mt-2" value={form.firstName} onChange={(event) => onChange("firstName", event.target.value)} disabled={formDisabled} />
                        </div>
                        <div>
                            <label className="text-[14px] font-semibold text-muted-foreground">Last Name</label>
                            <Input className="mt-2" value={form.lastName} onChange={(event) => onChange("lastName", event.target.value)} disabled={formDisabled} />
                        </div>
                        <div>
                            <label className="text-[14px] font-semibold text-muted-foreground">E-mail</label>
                            <Input className="mt-2" type="email" value={form.email} onChange={(event) => onChange("email", event.target.value)} disabled={formDisabled} />
                        </div>
                        <div>
                            <label className="text-[14px] font-semibold text-muted-foreground">New Password</label>
                            <Input
                                className="mt-2"
                                type="password"
                                placeholder="Leave blank to keep current password"
                                value={form.password}
                                onChange={(event) => onChange("password", event.target.value)}
                                disabled={formDisabled}
                            />
                        </div>
                    </div>
                </Card>
            </div>
        </DashboardLayout>
    );
}
