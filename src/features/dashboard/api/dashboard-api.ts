export type LeaderGroupInvoiceAnalyticsResponse = {
    totalCustomers: number;
    activeCustomers: number;
    totalInvoices: number;
    paidTotal: number;
    unpaidTotal: number;
    customerGrowthPct: number;
    invoiceGrowthPct: number;
};

type FetchOptions = {
    signal?: AbortSignal;
};

export async function fetchLeaderGroupInvoiceAnalytics(options: FetchOptions = {}) {
    const response = await fetch("/api/dashboard/leadergroup-invoice", {
        signal: options.signal,
    });

    if (!response.ok) {
        throw new Error("Failed to load LeaderGroupInvoice analytics");
    }

    return (await response.json()) as LeaderGroupInvoiceAnalyticsResponse;
}
