"use client";
import { CheckCircle2, Layers, Save, ShieldAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useCustomerMetrics } from "@/features/customer/hooks/use-customer-metrics";

type Metric = {
    label: string;
    value: number;
    icon: typeof CheckCircle2;
    iconBg: string;
    bgColor: string;
    txtColor: string;
};

export function CustomerMetrics() {
    const { data, isLoading } = useCustomerMetrics();

    const metrics: Metric[] = data
        ? [
              {
                  label: "Active Customers",
                  value: data.activeCount ?? 0,
                  icon: CheckCircle2,
                  iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
                  bgColor: "bg-emerald-500/10",
                  txtColor: "text-emerald-600 dark:text-emerald-300",
              },
              {
                  label: "Bundle Customers",
                  value: data.bundleCount ?? 0,
                  icon: Layers,
                  iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
                  bgColor: "bg-indigo-500/10",
                  txtColor: "text-indigo-600 dark:text-indigo-300",
              },
              {
                  label: "Show Saved",
                  value: data.showSavedCount ?? 0,
                  icon: Save,
                  iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
                  bgColor: "bg-amber-500/10",
                  txtColor: "text-amber-600 dark:text-amber-300",
              },
              {
                  label: "Exclude Report",
                  value: data.excludeReportCount ?? 0,
                  icon: ShieldAlert,
                  iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
                  bgColor: "bg-rose-500/10",
                  txtColor: "text-rose-600 dark:text-rose-300",
              },
          ]
        : [];

    return (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {isLoading
                ? Array.from({ length: 4 }).map((_, index) => (
                      <Card key={`metric-${index}`} className="border-border/60 bg-card p-4 shadow-sm gap-0">
                          <div className="flex items-start justify-between gap-4">
                              <div>
                                  <p className="text-sm text-muted-foreground">Loading</p>
                                  <div className="flex items-center gap-2">
                                      <p className="mt-2 text-2xl font-semibold text-foreground">...</p>
                                  </div>
                              </div>
                              <div className="rounded-md bg-muted p-2 text-muted-foreground">
                                  <div className="size-5" />
                              </div>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">Fetching metrics</p>
                      </Card>
                  ))
                : metrics.map((metric) => (
                      <Card key={metric.label} className={cn("border-border/60 bg-card p-4 shadow-sm gap-0", metric.bgColor)}>
                          <div className="flex items-start justify-between gap-4">
                              <div>
                                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                                  <div className="flex items-center gap-2">
                                      <p className={cn("mt-2 text-2xl font-semibold", metric.txtColor)}>{metric.value.toLocaleString()}</p>
                                  </div>
                              </div>
                              <div className={cn("rounded-md p-2", metric.iconBg)}>
                                  <metric.icon className="size-5" />
                              </div>
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">Total customers</p>
                      </Card>
                  ))}
        </div>
    );
}
