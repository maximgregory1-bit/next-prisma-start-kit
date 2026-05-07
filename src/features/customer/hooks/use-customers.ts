"use client";

import * as React from "react";

import { fetchCustomers, type FetchCustomersParams } from "@/features/customer/api/customer-api";
import { type CustomerRow } from "@/features/customer/data/customer-data";

type SortState = { id: string; direction: "asc" | "desc" } | null;

type CustomersState = {
    rows: CustomerRowWithNo[];
    isLoading: boolean;
    pageIndex: number;
    pageSize: number;
    totalRows: number;
    searchValue: string;
    filterValues: Record<string, string>;
    sortState: SortState;
    reload: () => void;
    setPageIndex: React.Dispatch<React.SetStateAction<number>>;
    setPageSize: React.Dispatch<React.SetStateAction<number>>;
    setSearchValue: React.Dispatch<React.SetStateAction<string>>;
    setFilterValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setSortState: React.Dispatch<React.SetStateAction<SortState>>;
};

export type CustomerRowWithNo = CustomerRow & { displayNo: number };

export function useCustomers(): CustomersState {
    const [rows, setRows] = React.useState<CustomerRowWithNo[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [pageIndex, setPageIndex] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(1000);
    const [totalRows, setTotalRows] = React.useState(0);
    const [searchValue, setSearchValue] = React.useState("");
    const [filterValues, setFilterValues] = React.useState<Record<string, string>>({
        status: "All",
    });
    const [sortState, setSortState] = React.useState<SortState>(null);
    const [refreshToken, setRefreshToken] = React.useState(0);

    const reload = React.useCallback(() => {
        setRefreshToken((prev) => prev + 1);
    }, []);

    React.useEffect(() => {
        const controller = new AbortController();

        const loadCustomers = async () => {
            try {
                setIsLoading(true);

                const statusFilter = filterValues.status;
                const params: FetchCustomersParams = {
                    page: pageIndex,
                    pageSize,
                    search: searchValue.trim() ? searchValue.trim() : undefined,
                    status: statusFilter && statusFilter !== "All" ? statusFilter : undefined,
                    sort: sortState?.id,
                    direction: sortState?.direction,
                };

                const payload = await fetchCustomers(params, {
                    signal: controller.signal,
                });
                const hydrated = (payload.rows ?? []).map((row, index) => ({
                    ...row,
                    displayNo: (pageIndex - 1) * pageSize + index + 1,
                }));

                setRows(hydrated);
                setTotalRows(payload.total ?? 0);
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }
                console.error(error);
                setRows([]);
                setTotalRows(0);
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        loadCustomers();

        return () => {
            controller.abort();
        };
    }, [pageIndex, pageSize, searchValue, filterValues, sortState, refreshToken]);

    return {
        rows,
        isLoading,
        pageIndex,
        pageSize,
        totalRows,
        searchValue,
        filterValues,
        sortState,
        reload,
        setPageIndex,
        setPageSize,
        setSearchValue,
        setFilterValues,
        setSortState,
    };
}
