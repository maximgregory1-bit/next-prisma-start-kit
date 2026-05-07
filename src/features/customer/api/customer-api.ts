import { type CustomerPhoneEntry, type CustomerRow } from "@/features/customer/data/customer-data";

export type CustomerMetricsResponse = {
    activeCount: number;
    bundleCount: number;
    showSavedCount: number;
    excludeReportCount: number;
};

export type CustomersResponse = {
    rows: CustomerRow[];
    total: number;
    page?: number;
    pageSize?: number;
};

export type CustomerDetailResponse = {
    id: string;
    name: string;
    status: "Active" | "Inactive";
    contactName: string;
    email: string[];
    phone: CustomerPhoneEntry[];
    price: number;
    bundlePrice: number;
    owed: number;
    bundle: boolean;
    showSaved: boolean;
    excludeReport: boolean;
    holidayCalculation: boolean;
    weeklyCustomPayment: boolean;
    weeklyLeadQty: number | null;
    invoiceNumber: string;
    extraTextContent: string;
    customCreditValue: number | null;
    showPercentage: boolean;
    showTotalLeadQty: boolean;
    excludeWeekdays: string[];
    campaigns: number;
    agents: number;
};

export type CustomerCampaign = {
    id: string;
    name: string;
    abbreviation?: string | null;
    status: "Active" | "Inactive";
    createdAt?: string;
};

export type CustomerAgent = {
    id: string;
    name: string;
    sheet?: string | null;
    tab?: string | null;
    status: "Active" | "Inactive";
    createdAt?: string;
};

export type CustomerUpdatePayload = {
    name: string;
    status: "Active" | "Inactive";
    contactName?: string;
    email?: string;
    phone: string;
    price: number;
    bundlePrice: number;
    owed: number;
    bundle?: boolean;
    showSaved?: boolean;
    excludeReport?: boolean;
    holidayCalculation?: boolean;
    weeklyCustomPayment?: boolean;
    weeklyLeadQty?: number | null;
    invoiceNumber?: string;
    extraTextContent?: string;
    customCreditValue?: number | null;
    showPercentage?: boolean;
    showTotalLeadQty?: boolean;
    excludeWeekdays?: string[];
};

export type CustomerCreatePayload = {
    name: string;
    status: "Active" | "Inactive";
    contactName?: string;
    email?: string;
    phone: string;
    price?: string;
    bundlePrice?: string;
    owed?: string;
    bundle?: boolean;
    showSaved?: boolean;
    excludeReport?: boolean;
    holidayCalculation?: boolean;
    weeklyCustomPayment?: boolean;
    weeklyLeadQty?: number | null;
    invoiceNumber?: string;
    extraTextContent?: string;
    customCreditValue?: number | null;
    showPercentage?: boolean;
    showTotalLeadQty?: boolean;
    excludeWeekdays?: string[];
};

export type CustomerCampaignPayload = {
    name: string;
    abbreviation?: string;
    status: "Active" | "Inactive";
};

export type CustomerAgentPayload = {
    name: string;
    sheet?: string;
    tab?: string;
    status: "Active" | "Inactive";
};

export type FetchCustomersParams = {
    page: number;
    pageSize: number;
    search?: string;
    status?: string;
    sort?: string;
    direction?: "asc" | "desc";
};

type FetchOptions = {
    signal?: AbortSignal;
};

const getApiErrorMessage = async (response: Response, fallback: string) => {
    try {
        const payload = (await response.json()) as { message?: string };
        return payload.message?.trim() || fallback;
    } catch {
        return fallback;
    }
};

export async function fetchCustomerMetrics(options: FetchOptions = {}) {
    const response = await fetch("/api/customers/metrics", {
        signal: options.signal,
    });

    if (!response.ok) {
        throw new Error("Failed to load metrics");
    }

    return (await response.json()) as CustomerMetricsResponse;
}

export async function fetchCustomers(params: FetchCustomersParams, options: FetchOptions = {}) {
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

    const response = await fetch(`/api/customers?${searchParams.toString()}`, {
        signal: options.signal,
    });

    if (!response.ok) {
        throw new Error("Failed to load customers");
    }

    return (await response.json()) as CustomersResponse;
}

export async function fetchCustomerDetail(id: string, options: FetchOptions = {}) {
    const response = await fetch(`/api/customers/${id}`, {
        signal: options.signal,
    });

    if (!response.ok) {
        throw new Error("Failed to load customer");
    }

    return (await response.json()) as CustomerDetailResponse;
}

export async function updateCustomerDetail(id: string, payload: CustomerUpdatePayload) {
    const response = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to update customer"));
    }

    return (await response.json()) as CustomerDetailResponse;
}

export async function createCustomer(payload: CustomerCreatePayload) {
    const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, "Failed to create customer"));
    }

    return (await response.json()) as CustomerDetailResponse;
}

export async function fetchCustomerCampaigns(id: string, options: FetchOptions = {}) {
    const response = await fetch(`/api/customers/${id}/campaigns`, {
        signal: options.signal,
    });

    if (!response.ok) {
        throw new Error("Failed to load customer campaigns");
    }

    return (await response.json()) as { campaigns: CustomerCampaign[] };
}

export async function fetchCustomerAgents(id: string, options: FetchOptions = {}) {
    const response = await fetch(`/api/customers/${id}/agents`, {
        signal: options.signal,
    });

    if (!response.ok) {
        throw new Error("Failed to load customer agents");
    }

    return (await response.json()) as { agents: CustomerAgent[] };
}

export async function createCustomerCampaign(customerId: string, payload: CustomerCampaignPayload) {
    const response = await fetch(`/api/customers/${customerId}/campaigns`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error("Failed to create campaign");
    }

    return (await response.json()) as CustomerCampaign;
}

export async function updateCustomerCampaign(customerId: string, campaignId: string, payload: CustomerCampaignPayload) {
    const response = await fetch(`/api/customers/${customerId}/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error("Failed to update campaign");
    }

    return (await response.json()) as CustomerCampaign;
}

export async function deleteCustomerCampaign(customerId: string, campaignId: string) {
    const response = await fetch(`/api/customers/${customerId}/campaigns/${campaignId}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("Failed to delete campaign");
    }

    return (await response.json()) as { id: string };
}

export async function createCustomerAgent(customerId: string, payload: CustomerAgentPayload) {
    const response = await fetch(`/api/customers/${customerId}/agents`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error("Failed to create agent");
    }

    return (await response.json()) as CustomerAgent;
}

export async function updateCustomerAgent(customerId: string, agentId: string, payload: CustomerAgentPayload) {
    const response = await fetch(`/api/customers/${customerId}/agents/${agentId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error("Failed to update agent");
    }

    return (await response.json()) as CustomerAgent;
}

export async function deleteCustomerAgent(customerId: string, agentId: string) {
    const response = await fetch(`/api/customers/${customerId}/agents/${agentId}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("Failed to delete agent");
    }

    return (await response.json()) as { id: string };
}

export async function deleteCustomer(id: string) {
    const response = await fetch(`/api/customers/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("Failed to delete customer");
    }

    return (await response.json()) as { id: string };
}
