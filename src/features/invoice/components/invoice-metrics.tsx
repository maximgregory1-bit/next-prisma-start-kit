"use client";

import { BadgeDollarSign, FileText, Users, Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { useInvoiceMetrics } from "@/features/invoice/hooks/use-invoice-metrics";

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

export function InvoiceMetrics() {
    const { data, isLoading } = useInvoiceMetrics();
    const metrics = data
        ? [
              {
                  label: "Clients",
                  value: data.clientCount.toLocaleString(),
                  icon: Users,
                  iconClassName: "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300",
              },
              {
                  label: "Invoices",
                  value: data.invoiceCount.toLocaleString(),
                  icon: FileText,
                  iconClassName: "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300",
              },
              //   {
              //       label: "Paid",
              //       value: formatCurrency(data.paidTotal),
              //       icon: BadgeDollarSign,
              //       iconClassName: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300",
              //   },
              //   {
              //       label: "Unpaid",
              //       value: formatCurrency(data.unpaidTotal),
              //       icon: Wallet,
              //       iconClassName: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300",
              //   },
          ]
        : [];

    return (
        <Card className="border-border/60 bg-card shadow-sm py-3">
            <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                {isLoading
                    ? Array.from({ length: 4 }).map((_, index) => (
                          <div
                              key={`metric-${index}`}
                              className={index < 3 ? "flex items-center justify-between border-border/60 pr-4 sm:pr-6 lg:border-r" : "flex items-center justify-between"}
                          >
                              <div>
                                  <p className="text-2xl font-semibold text-foreground">...</p>
                                  <p className="text-sm text-muted-foreground">Loading</p>
                              </div>
                              <div className="flex size-10 items-center justify-center rounded-sm bg-muted" />
                          </div>
                      ))
                    : metrics.map((item, index) => (
                          <div
                              key={item.label}
                              className={
                                  index < metrics.length - 1 ? "flex items-center justify-between border-border/60 pr-4 sm:pr-6 lg:border-r" : "flex items-center justify-between"
                              }
                          >
                              <div>
                                  <p className="text-2xl font-semibold text-foreground">{item.value}</p>
                                  <p className="text-sm text-muted-foreground">{item.label}</p>
                              </div>
                              <div className={"flex size-10 items-center justify-center rounded-sm " + item.iconClassName}>
                                  <item.icon className="size-5" />
                              </div>
                          </div>
                      ))}
            </CardContent>
        </Card>
    );
}
