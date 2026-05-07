"use client";

import * as React from "react";

import { fetchCustomerAgents, fetchCustomerCampaigns, type CustomerAgent, type CustomerCampaign } from "@/features/customer/api/customer-api";

type RelationsState = {
    campaigns: CustomerCampaign[];
    agents: CustomerAgent[];
    isLoading: boolean;
    error: string | null;
    reload: () => void;
};

export function useCustomerRelations(customerId: string): RelationsState {
    const [campaigns, setCampaigns] = React.useState<CustomerCampaign[]>([]);
    const [agents, setAgents] = React.useState<CustomerAgent[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [refreshToken, setRefreshToken] = React.useState(0);

    const reload = React.useCallback(() => {
        setRefreshToken((prev) => prev + 1);
    }, []);

    React.useEffect(() => {
        if (!customerId) {
            return;
        }

        const controller = new AbortController();

        const loadRelations = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const [campaignsPayload, agentsPayload] = await Promise.all([
                    fetchCustomerCampaigns(customerId, { signal: controller.signal }),
                    fetchCustomerAgents(customerId, { signal: controller.signal }),
                ]);

                setCampaigns(campaignsPayload.campaigns ?? []);
                setAgents(agentsPayload.agents ?? []);
            } catch (err) {
                if (controller.signal.aborted) {
                    return;
                }
                console.error(err);
                setError("Unable to load campaigns and agents.");
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        loadRelations();

        return () => {
            controller.abort();
        };
    }, [customerId, refreshToken]);

    return {
        campaigns,
        agents,
        isLoading,
        error,
        reload,
    };
}
