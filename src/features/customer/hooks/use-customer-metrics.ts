"use client";

import * as React from "react";

import {
  fetchCustomerMetrics,
  type CustomerMetricsResponse,
} from "@/features/customer/api/customer-api";

type MetricsState = {
  data: CustomerMetricsResponse | null;
  isLoading: boolean;
};

export function useCustomerMetrics(): MetricsState {
  const [data, setData] = React.useState<CustomerMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const controller = new AbortController();

    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        const payload = await fetchCustomerMetrics({
          signal: controller.signal,
        });
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
