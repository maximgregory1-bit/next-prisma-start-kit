"use client";

import * as React from "react";

import { fetchInvoiceMetrics, type InvoiceMetricsResponse } from "@/features/invoice/api/invoice-api";

type MetricsState = {
    data: InvoiceMetricsResponse | null;
    isLoading: boolean;
};

export function useInvoiceMetrics(): MetricsState {
    const [data, setData] = React.useState<InvoiceMetricsResponse | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const controller = new AbortController();

        const loadMetrics = async () => {
            try {
                setIsLoading(true);
                const payload = await fetchInvoiceMetrics({ signal: controller.signal });
                setData(payload);
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }
                console.error(error);
                setData(null);
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        loadMetrics();

        return () => {
            controller.abort();
        };
    }, []);

    return { data, isLoading };
}
