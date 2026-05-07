"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Plus, Search, X } from "lucide-react";

import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import PhoneInput from "@/components/ui/phone-input";
import { Switch } from "@/components/ui/switch";
import { useCustomerCreate } from "@/features/customer/hooks/use-customer-create";
import { Sidebar, Topbar } from "@/features/dashboard/components";

export function CustomerCreatePage() {
    const {
        errors,
        form,
        isEditable,
        isSaving,
        formDisabled,
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
    } = useCustomerCreate();

    const customerCreditSwitch = Boolean(form.customCreditValue.trim());
    const invoiceSwitch = Boolean(form.invoiceNumber.trim());
    const extraTextSwitch = Boolean(form.extraTextContent.trim());

    const [excludeReportContentUi, setExcludeReportContentUi] = React.useState("");
    const [excludeWeekdaysOpen, setExcludeWeekdaysOpen] = React.useState(false);
    const [excludeWeekdaysSearch, setExcludeWeekdaysSearch] = React.useState("");

    const weekdayOptions = React.useMemo(() => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], []);

    const filteredWeekdays = React.useMemo(() => {
        const term = excludeWeekdaysSearch.trim().toLowerCase();
        if (!term) return weekdayOptions;
        return weekdayOptions.filter((day) => day.toLowerCase().includes(term));
    }, [excludeWeekdaysSearch, weekdayOptions]);

    const weekdayDropdownRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        const onPointerDown = (event: MouseEvent) => {
            if (!weekdayDropdownRef.current) return;
            if (!weekdayDropdownRef.current.contains(event.target as Node)) {
                setExcludeWeekdaysOpen(false);
            }
        };
        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, []);

    const toggleWeekday = (day: string) => {
        const selected = form.excludeWeekdays;
        onSet("excludeWeekdays", selected.includes(day) ? selected.filter((item) => item !== day) : [...selected, day]);
    };

    const renderPreferenceSwitch = (checked: boolean, onCheckedChange: (value: boolean) => void, disabled?: boolean) => (
        <div className="mt-2 flex h-9 items-center justify-center gap-6 rounded-sm bg-background px-3 text-sm">
            <span>No</span>
            <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
            <span>Yes</span>
        </div>
    );

    const sanitizePhoneInputValue = (value: string) => (/@g\.us$/i.test(value.trim()) ? "" : value);

    return (
        <DashboardLayout sidebar={<Sidebar activeItem="Customer" />} header={<Topbar activeItem="Customer" />}>
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Customer</p>
                        <h1 className="text-2xl font-semibold text-primary">New Customer</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Create a new customer profile.</p>
                    </div>
                </div>

                <Card className="border-border/60 bg-card p-6 shadow-sm w-full xl:w-1/2">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className="text-md font-semibold text-primary">Primary Information</p>
                            <p className="text-xs text-muted-foreground">Keep customer details accurate for reporting.</p>
                        </div>
                    </div>
                    <div className="relative grid gap-6">
                        <div className="space-y-8 lg:pr-6">
                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Name</label>
                                <Input
                                    className="mt-2"
                                    placeholder="Leader Group"
                                    value={form.name}
                                    onChange={(event) => onChange("name", event.target.value)}
                                    disabled={formDisabled}
                                />
                                {errors.name ? <p className="mt-1 text-xs text-rose-500">{errors.name}</p> : null}
                            </div>
                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Contact Name</label>
                                <Input
                                    className="mt-2"
                                    placeholder="Sarah Lewis"
                                    value={form.contactName}
                                    onChange={(event) => onChange("contactName", event.target.value)}
                                    disabled={formDisabled}
                                />
                            </div>
                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Email Addresses</label>
                                <div className="mt-2 grid gap-2">
                                    {form.emails.map((value, index) => (
                                        <div key={`email-${index}`} className="flex items-center gap-2">
                                            <Input
                                                placeholder="sarah@example.com"
                                                value={value}
                                                onChange={(event) => updateListItem("emails", index, event.target.value)}
                                                disabled={formDisabled}
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-9"
                                                onClick={() => removeListItem("emails", index)}
                                                disabled={formDisabled || form.emails.length === 1}
                                            >
                                                <X className="size-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" size="sm" className="mt-3 gap-2 rounded-sm" onClick={() => addListItem("emails")} disabled={formDisabled}>
                                    <Plus className="size-4" />
                                    Add email
                                </Button>
                                {errors.emails ? <p className="mt-2 text-xs text-rose-500">{errors.emails}</p> : null}
                            </div>
                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Phone Numbers</label>
                                <div className="mt-2 grid gap-2">
                                    {form.phones.map((entry, index) => (
                                        <div key={`phone-${index}`} className="grid gap-2 rounded-md border border-border/60 bg-primary-foreground p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <label className="text-[14px] font-semibold text-muted-foreground">WhatsApp</label>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8"
                                                    onClick={() => removePhoneItem(index)}
                                                    disabled={formDisabled || form.phones.length === 1}
                                                >
                                                    <X className="size-4" />
                                                </Button>
                                            </div>
                                            <div className="block justify-between xl:flex">
                                                <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground xl:mb-0">
                                                    Phone number
                                                    <Switch
                                                        checked={entry.type}
                                                        onCheckedChange={(checked) => updatePhoneItem(index, "type", Boolean(checked))}
                                                        disabled={formDisabled}
                                                    />
                                                    Group chat
                                                </label>
                                                {entry.type ? (
                                                    <Input
                                                        placeholder="Group name"
                                                        value={entry.group ?? ""}
                                                        onChange={(event) => updatePhoneItem(index, "group", event.target.value)}
                                                        disabled={formDisabled}
                                                        className="xl:w-1/2"
                                                    />
                                                ) : (
                                                    <PhoneInput
                                                        value={sanitizePhoneInputValue(entry.number)}
                                                        onChange={(value) => updatePhoneItem(index, "number", value)}
                                                        disabled={formDisabled}
                                                        className="relative xl:w-1/2"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" size="sm" className="mt-3 gap-2 rounded-sm" onClick={addPhoneItem} disabled={formDisabled}>
                                    <Plus className="size-4" />
                                    Add phone
                                </Button>
                                {errors.phone ? <p className="mt-2 text-xs text-rose-500">{errors.phone}</p> : null}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="w-full border-border/60 bg-card p-6 shadow-sm xl:w-1/2">
                    <div className="space-y-4">
                        <div>
                            <p className="text-md font-semibold text-primary">Preferences</p>
                            <p className="text-xs text-muted-foreground">Control visibility and bundle behavior for this customer.</p>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                                <label className="text-[14px] font-semibold text-muted-foreground">Price</label>
                                <Input className="mt-2" placeholder="$120" value={form.price} onChange={(event) => onChange("price", event.target.value)} disabled={formDisabled} />
                                {errors.price ? <p className="mt-1 text-xs text-rose-500">{errors.price}</p> : null}
                            </div>
                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Pay Bundle</label>
                                {renderPreferenceSwitch(form.bundle, () => onToggle("bundle"), formDisabled)}
                            </div>
                            {form.bundle ? (
                                <>
                                    <div>
                                        <label className="text-[14px] font-semibold text-muted-foreground">Bundle Price</label>
                                        <Input
                                            className="mt-2"
                                            value={form.bundlePrice}
                                            onChange={(event) => onChange("bundlePrice", event.target.value)}
                                            disabled={formDisabled}
                                        />
                                        {errors.bundlePrice ? <p className="mt-1 text-xs text-rose-500">{errors.bundlePrice}</p> : null}
                                    </div>

                                    <div>
                                        <label className="text-[14px] font-semibold text-muted-foreground">Show Savings for Bundle</label>
                                        {renderPreferenceSwitch(form.showSaved, () => onToggle("showSaved"), formDisabled)}
                                    </div>
                                    <div />

                                    <div>
                                        <label className="text-[14px] font-semibold text-muted-foreground">Holiday Calculation</label>
                                        {renderPreferenceSwitch(form.holidayCalculation, () => onToggle("holidayCalculation"), formDisabled)}
                                    </div>
                                    {form.holidayCalculation ? (
                                        <div>
                                            <label className="text-[14px] font-semibold text-muted-foreground">Weekdays for Excluding Holiday</label>
                                            <div className="mt-2 relative" ref={weekdayDropdownRef}>
                                                <button
                                                    type="button"
                                                    className="min-h-9 w-full rounded-sm bg-background px-3 py-2 text-left text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                    onClick={() => setExcludeWeekdaysOpen((prev) => !prev)}
                                                    disabled={formDisabled}
                                                >
                                                    <div className="flex items-center gap-2 pr-12 flex-wrap">
                                                        {form.excludeWeekdays.length > 0 ? (
                                                            form.excludeWeekdays.map((day) => (
                                                                <span
                                                                    key={day}
                                                                    className="inline-flex items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-xs text-background"
                                                                >
                                                                    {day}
                                                                    <span
                                                                        role="button"
                                                                        tabIndex={0}
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            toggleWeekday(day);
                                                                        }}
                                                                        onKeyDown={(event) => {
                                                                            if (event.key === "Enter" || event.key === " ") {
                                                                                event.preventDefault();
                                                                                event.stopPropagation();
                                                                                toggleWeekday(day);
                                                                            }
                                                                        }}
                                                                    >
                                                                        <X className="size-3" />
                                                                    </span>
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-muted-foreground">Select Weekdays</span>
                                                        )}
                                                    </div>
                                                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                        {form.excludeWeekdays.length > 0 ? (
                                                            <X
                                                                className="size-4"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    onSet("excludeWeekdays", []);
                                                                }}
                                                            />
                                                        ) : null}
                                                    </span>
                                                    <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                                </button>

                                                {excludeWeekdaysOpen ? (
                                                    <div className="absolute z-50 mt-1 w-full rounded-sm border border-input bg-background shadow-md">
                                                        <div className="border-b border-border p-2">
                                                            <div className="flex items-center gap-2 rounded-sm border border-input px-2">
                                                                <Search className="size-4 text-muted-foreground" />
                                                                <input
                                                                    value={excludeWeekdaysSearch}
                                                                    onChange={(event) => setExcludeWeekdaysSearch(event.target.value)}
                                                                    placeholder="Search..."
                                                                    className="h-9 w-full bg-transparent text-sm outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="max-h-48 overflow-auto p-2 space-y-1">
                                                            {filteredWeekdays.map((day) => (
                                                                <label key={day} className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="size-4 rounded border-input"
                                                                        checked={form.excludeWeekdays.includes(day)}
                                                                        onChange={() => toggleWeekday(day)}
                                                                    />
                                                                    <span>{day}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                        <div className="grid grid-cols-2 border-t border-border">
                                                            <button type="button" className="h-10 text-sm hover:bg-accent" onClick={() => onSet("excludeWeekdays", [])}>
                                                                Clear
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="h-10 text-sm border-l border-border hover:bg-accent"
                                                                onClick={() => setExcludeWeekdaysOpen(false)}
                                                            >
                                                                Close
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                    ) : (
                                        <div />
                                    )}

                                    <div>
                                        <label className="text-[14px] font-semibold text-muted-foreground">Weekly Custom Payment</label>
                                        {renderPreferenceSwitch(form.weeklyCustomPayment, () => onToggle("weeklyCustomPayment"), formDisabled)}
                                    </div>
                                    {form.weeklyCustomPayment ? (
                                        <div>
                                            <label className="text-[14px] font-semibold text-muted-foreground">Weekly Lead Qty</label>
                                            <Input
                                                className="mt-2"
                                                value={form.weeklyLeadQty}
                                                onChange={(event) => onChange("weeklyLeadQty", event.target.value)}
                                                disabled={formDisabled}
                                            />
                                            {errors.weeklyLeadQty ? <p className="mt-1 text-xs text-rose-500">{errors.weeklyLeadQty}</p> : null}
                                        </div>
                                    ) : (
                                        <div />
                                    )}
                                </>
                            ) : (
                                <>
                                    <div />
                                    <div>
                                        <label className="text-[14px] font-semibold text-muted-foreground">Custom Credit</label>
                                        {renderPreferenceSwitch(
                                            customerCreditSwitch,
                                            (checked) => onSet("customCreditValue", checked ? form.customCreditValue || "0" : ""),
                                            formDisabled,
                                        )}
                                    </div>
                                    {customerCreditSwitch ? (
                                        <div>
                                            <label className="text-[14px] font-semibold text-muted-foreground">Custom Credit</label>
                                            <Input
                                                className="mt-2"
                                                value={form.customCreditValue}
                                                onChange={(event) => onChange("customCreditValue", event.target.value)}
                                                disabled={formDisabled}
                                            />
                                            {errors.customCreditValue ? <p className="mt-1 text-xs text-rose-500">{errors.customCreditValue}</p> : null}
                                        </div>
                                    ) : (
                                        <div />
                                    )}
                                </>
                            )}

                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Invoice Number</label>
                                {renderPreferenceSwitch(invoiceSwitch, (checked) => onSet("invoiceNumber", checked ? form.invoiceNumber || "1" : ""), formDisabled)}
                            </div>
                            {invoiceSwitch ? (
                                <div>
                                    <label className="text-[14px] font-semibold text-muted-foreground">Invoice Number</label>
                                    <Input
                                        className="mt-2"
                                        value={form.invoiceNumber}
                                        onChange={(event) => onChange("invoiceNumber", event.target.value)}
                                        disabled={formDisabled}
                                    />
                                </div>
                            ) : (
                                <div />
                            )}

                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Extra Text</label>
                                {renderPreferenceSwitch(extraTextSwitch, (checked) => onSet("extraTextContent", checked ? form.extraTextContent || "Text" : ""), formDisabled)}
                            </div>
                            {extraTextSwitch ? (
                                <div>
                                    <label className="text-[14px] font-semibold text-muted-foreground">Content</label>
                                    <Input
                                        className="mt-2"
                                        placeholder="Please type text"
                                        value={form.extraTextContent}
                                        onChange={(event) => onChange("extraTextContent", event.target.value)}
                                        disabled={formDisabled}
                                    />
                                </div>
                            ) : (
                                <div />
                            )}

                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Exclude from Report</label>
                                {renderPreferenceSwitch(form.excludeReport, () => onToggle("excludeReport"), formDisabled)}
                            </div>
                            {form.excludeReport ? (
                                <div>
                                    <label className="text-[14px] font-semibold text-muted-foreground">Content</label>
                                    <Input
                                        className="mt-2"
                                        placeholder="Please type text"
                                        value={excludeReportContentUi}
                                        onChange={(event) => setExcludeReportContentUi(event.target.value)}
                                        disabled={formDisabled}
                                    />
                                </div>
                            ) : (
                                <div />
                            )}

                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Show Percentage</label>
                                {renderPreferenceSwitch(form.showPercentage, () => onToggle("showPercentage"), formDisabled)}
                            </div>
                            <div>
                                <label className="text-[14px] font-semibold text-muted-foreground">Show Total Lead Qty</label>
                                {renderPreferenceSwitch(form.showTotalLeadQty, () => onToggle("showTotalLeadQty"), formDisabled)}
                            </div>
                        </div>
                    </div>
                </Card>
                <div className="flex items-center justify-end gap-2 w-full xl:w-1/2">
                    <Button variant="outline" asChild className="rounded-sm">
                        <Link href="/customer">Cancel</Link>
                    </Button>
                    <Button className="rounded-sm" onClick={handleSave} disabled={isSaving || !isEditable}>
                        {isSaving ? "Creating..." : "Create Customer"}
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
