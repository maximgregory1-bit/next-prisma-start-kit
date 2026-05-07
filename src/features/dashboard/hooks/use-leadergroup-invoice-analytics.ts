"use client";

import * as React from "react";

import { fetchLeaderGroupInvoiceAnalytics, type LeaderGroupInvoiceAnalyticsResponse } from "@/features/dashboard/api/dashboard-api";

type AnalyticsState = {
    data: LeaderGroupInvoiceAnalyticsResponse | null;
    isLoading: boolean;
};

export function useLeaderGroupInvoiceAnalytics(): AnalyticsState {
    const [data, setData] = React.useState<LeaderGroupInvoiceAnalyticsResponse | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
        const controller = new AbortController();

        const loadAnalytics = async () => {
            try {
                setIsLoading(true);
                const payload = await fetchLeaderGroupInvoiceAnalytics({ signal: controller.signal });
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

        loadAnalytics();

        return () => {
            controller.abort();
        };
    }, []);

    return { data, isLoading };
}
