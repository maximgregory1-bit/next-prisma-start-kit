export type InvoiceMetricsResponse = {
    clientCount: number;
    invoiceCount: number;
    paidTotal: number;
    unpaidTotal: number;
};

export type InvoiceRow = {
    id: string;
    customerName: string;
    customerContact: string;
    customerInitials: string;
    customerColor: string;
    amount: number;
    startDate: string;
    endDate: string;
    sentDate: string;
    statusLabel: "Paid" | "Unpaid" | "Partial" | "Overdue";
};

export type InvoiceNotification = {
    id: string;
    email: string;
    phone: string;
    createdAt: string;
};

export type InvoiceDetail = {
    id: string;
    customerId: string;
    customerName: string;
    customerContact: string;
    customerStatus: "Paid" | "Unpaid" | "Partial" | "Overdue";
    amount: number;
    startDate: string;
    endDate: string;
    sentDate: string;
    excelFile: string;
    imageFile: string;
    prior: number | null;
    pageOrientation: boolean;
    notifications: InvoiceNotification[];
};

export type InvoicesResponse = {
    rows: InvoiceRow[];
    total: number;
    page?: number;
    pageSize?: number;
};

export type FetchInvoicesParams = {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    sort?: string;
    direction?: "asc" | "desc";
};

export type UpdateInvoicePayload = {
    amount: number;
    startDate: string;
    endDate: string;
    sentDate: string;
    excelFile: string;
    imageFile: string;
    prior: number | null;
    pageOrientation: boolean;
};

type FetchOptions = {
    signal?: AbortSignal;
};

export async function fetchInvoiceMetrics(options: FetchOptions = {}) {
    const response = await fetch("/api/invoices/metrics", {
        signal: options.signal,
    });

    if (!response.ok) {
        throw new Error("Failed to load invoice metrics");
    }

    return (await response.json()) as InvoiceMetricsResponse;
}

export async function fetchInvoices(params: FetchInvoicesParams, options: FetchOptions = {}) {
    const searchParams = new URLSearchParams();
    searchParams.set("page", String(params.page));
    searchParams.set("pageSize", String(params.pageSize));
    if (params.search) {
        searchParams.set("search", params.search);
    }
    if (params.status) {
        searchParams.set("status", params.status);
    }
    if (params.sort) {
        searchParams.set("sort", params.sort);
    }
    if (params.direction) {
        searchParams.set("direction", params.direction);
    }

    const response = await fetch(`/api/invoices?${searchParams.toString()}`, {
        signal: options.signal,
    });

    if (!response.ok) {
        throw new Error("Failed to load invoices");
    }

    return (await response.json()) as InvoicesResponse;
}

export async function fetchInvoiceDetail(invoiceId: string, options: FetchOptions = {}) {
    const response = await fetch(`/api/invoices/${invoiceId}`, {
        signal: options.signal,
    });

    if (!response.ok) {
        throw new Error("Failed to load invoice");
    }

    return (await response.json()) as InvoiceDetail;
}

export async function updateInvoiceDetail(invoiceId: string, payload: UpdateInvoicePayload) {
    const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error("Failed to update invoice");
    }

    return (await response.json()) as { id: string };
}

export async function deleteInvoice(invoiceId: string) {
    const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("Failed to delete invoice");
    }

    return await response.json();
}
