"use client";

import * as React from "react";

import { fetchInvoices, type FetchInvoicesParams, type InvoiceRow } from "@/features/invoice/api/invoice-api";

type SortState = { id: string; direction: "asc" | "desc" } | null;

type InvoicesState = {
    rows: InvoiceRow[];
    isLoading: boolean;
    isDeleting: boolean;
    pageIndex: number;
    pageSize: number;
    totalRows: number;
    searchValue: string;
    filterValues: Record<string, string>;
    sortState: SortState;
    setPageIndex: React.Dispatch<React.SetStateAction<number>>;
    setPageSize: React.Dispatch<React.SetStateAction<number>>;
    setSearchValue: React.Dispatch<React.SetStateAction<string>>;
    setFilterValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    setSortState: React.Dispatch<React.SetStateAction<SortState>>;
    deleteInvoiceById: (invoiceId: string) => Promise<void>;
};

export function useInvoices(): InvoicesState {
    const [rows, setRows] = React.useState<InvoiceRow[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [pageIndex, setPageIndex] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(1000);
    const [totalRows, setTotalRows] = React.useState(0);
    const [searchValue, setSearchValue] = React.useState("");
    const [filterValues, setFilterValues] = React.useState<Record<string, string>>({
        status: "All",
    });
    const [sortState, setSortState] = React.useState<SortState>(null);
    const [reloadKey, setReloadKey] = React.useState(0);
    const [isDeleting, setIsDeleting] = React.useState(false);

    React.useEffect(() => {
        const controller = new AbortController();

        const loadInvoices = async () => {
            try {
                setIsLoading(true);

                const statusFilter = filterValues.status;
                const params: FetchInvoicesParams = {
                    page: pageIndex,
                    pageSize,
                    search: searchValue.trim() ? searchValue.trim() : undefined,
                    status: statusFilter && statusFilter !== "All" ? statusFilter : undefined,
                    sort: sortState?.id,
                    direction: sortState?.direction,
                };

                const payload = await fetchInvoices(params, {
                    signal: controller.signal,
                });

                setRows(payload.rows ?? []);
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

        loadInvoices();

        return () => {
            controller.abort();
        };
    }, [pageIndex, pageSize, searchValue, filterValues, sortState, reloadKey]);

    const deleteInvoiceById = async (invoiceId: string) => {
        try {
            setIsDeleting(true);
            const { deleteInvoice } = await import("@/features/invoice/api/invoice-api");
            await deleteInvoice(invoiceId);
            // trigger reload
            setReloadKey((k) => k + 1);
        } catch (err) {
            console.error("Failed to delete invoice", err);
            throw err;
        } finally {
            setIsDeleting(false);
        }
    };

    return {
        rows,
        isLoading,
        isDeleting,
        pageIndex,
        pageSize,
        totalRows,
        searchValue,
        filterValues,
        sortState,
        setPageIndex,
        setPageSize,
        setSearchValue,
        setFilterValues,
        setSortState,
        deleteInvoiceById,
    };
}
