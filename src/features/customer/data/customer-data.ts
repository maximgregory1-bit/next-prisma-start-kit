import { UserRound } from "lucide-react";

export type CustomerMetric = {
    label: string;
    value: string;
    change: string;
    changePositive: boolean;
    icon: typeof UserRound;
    iconBg: string;
};

export const customerMetrics: CustomerMetric[] = [
    {
        label: "Status Users",
        value: "21,459",
        change: "+29%",
        changePositive: true,
        icon: UserRound,
        iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
    },
    {
        label: "Bundle Users",
        value: "4,567",
        change: "+18%",
        changePositive: true,
        icon: UserRound,
        iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
    },
    {
        label: "Show Saved Users",
        value: "19,860",
        change: "-14%",
        changePositive: false,
        icon: UserRound,
        iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    },
    {
        label: "Exclude Report Users",
        value: "237",
        change: "+42%",
        changePositive: true,
        icon: UserRound,
        iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    },
];

export type CustomerPhoneEntry = {
    type: boolean;
    number: string;
    group?: string | null;
};

export type CustomerRow = {
    id: string;
    name: string;
    contactName: string;
    campaigns: number;
    agents: number;
    email: string[];
    phone: CustomerPhoneEntry[];
    bundle: boolean;
    showSaved: boolean;
    excludeReport: boolean;
    price: number;
    bundlePrice: number;
    owed: number;
    status: "Active" | "Inactive" | "Pending";
};
