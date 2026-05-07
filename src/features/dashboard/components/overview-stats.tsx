"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CreditCard, DollarSign, Users } from "lucide-react";

import { useLeaderGroupInvoiceAnalytics } from "@/features/dashboard/hooks/use-leadergroup-invoice-analytics";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);

const formatChange = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

export function OverviewStats() {
    const { data, isLoading } = useLeaderGroupInvoiceAnalytics();

    const overviewStats = [
        {
            label: "Total Customers",
            value: data?.totalCustomers ?? 0,
            // change: formatChange(data?.customerGrowthPct ?? 0),
            // changeLabel: "vs previous month",
            icon: Users,
            accent: "bg-sky-500/15 text-sky-600 dark:text-sky-300",
            border: "bg-sky-400/50 group-hover:bg-sky-400",
            href: "/customer",
        },
        // {
        //     label: "Active Customers",
        //     value: data?.activeCustomers ?? 0,
        //     change: data && data.totalCustomers > 0 ? `${Math.round((data.activeCustomers / data.totalCustomers) * 100)}%` : "0%",
        //     changeLabel: "active ratio",
        //     icon: Users,
        //     accent: "bg-amber-400/20 text-amber-600 dark:text-amber-300",
        //     border: "bg-amber-400/50 group-hover:bg-amber-400",
        // },
        {
            label: "Total Invoices",
            value: data?.totalInvoices ?? 0,
            // change: formatChange(data?.invoiceGrowthPct ?? 0),
            // changeLabel: "vs previous month",
            icon: CreditCard,
            accent: "bg-rose-400/20 text-rose-600 dark:text-rose-300",
            border: "bg-rose-400/50 group-hover:bg-rose-400",
            href: "/invoice",
        },
        // {
        //     label: "Revenue Balance",
        //     value: data ? formatCurrency((data.paidTotal ?? 0) - (data.unpaidTotal ?? 0)) : "$0",
        //     change: data ? `${formatCurrency(data.paidTotal)} paid / ${formatCurrency(data.unpaidTotal)} unpaid` : "$0 paid / $0 unpaid",
        //     changeLabel: "lifetime totals",
        //     icon: DollarSign,
        //     accent: "bg-cyan-400/20 text-cyan-600 dark:text-cyan-300",
        //     border: "bg-cyan-400/50 group-hover:bg-cyan-400",
        // },
    ];

    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {overviewStats.map((stat) => {
                const cardBody = (
                    <Card className="relative overflow-hidden border-border/60 bg-card/80 shadow-sm py-3 group">
                        <div className={cn("absolute inset-x-0 bottom-0 h-1", stat.border)} />
                        <CardContent className="p-5 space-y-2">
                            <div className="flex items-center gap-4">
                                <div className={cn("flex size-12 items-center justify-center rounded-md", stat.accent)}>
                                    <stat.icon className="size-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-semibold text-foreground">{isLoading ? "..." : stat.value}</p>
                                </div>
                            </div>
                            <p className="text-sm font-medium text-foreground">{stat.label}</p>
                            {/* <p className="mt-1 text-md text-muted-foreground/50">
                                <span className="font-semibold text-foreground">{isLoading ? "Loading" : stat.change}</span> {stat.changeLabel}
                            </p> */}
                        </CardContent>
                    </Card>
                );

                return stat.href ? (
                    <Link key={stat.label} href={stat.href} className="block">
                        {cardBody}
                    </Link>
                ) : (
                    <div key={stat.label}>{cardBody}</div>
                );
            })}
        </section>
    );
}
