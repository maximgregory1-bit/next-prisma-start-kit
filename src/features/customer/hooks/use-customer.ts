"use client";

import * as React from "react";

import {
  fetchCustomerDetail,
  type CustomerDetailResponse,
} from "@/features/customer/api/customer-api";

type CustomerState = {
  data: CustomerDetailResponse | null;
  isLoading: boolean;
  error: string | null;
};

export function useCustomer(customerId: string): CustomerState {
  const [data, setData] = React.useState<CustomerDetailResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    const loadCustomer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const payload = await fetchCustomerDetail(customerId, {
          signal: controller.signal,
        });
        setData(payload);
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        console.error(err);
        setError("Unable to load customer details.");
        setData(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    if (customerId) {
      loadCustomer();
    } else {
      setIsLoading(false);
      setData(null);
    }

    return () => {
      controller.abort();
    };
  }, [customerId]);

  return { data, isLoading, error };
}
