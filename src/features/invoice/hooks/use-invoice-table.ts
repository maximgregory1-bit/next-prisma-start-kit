"use client";

import * as React from "react";

import { useToast } from "@/components/ui/use-toast";
import { useInvoices } from "@/features/invoice/hooks/use-invoices";

export function useInvoiceTable() {
    const {
        rows,
        isLoading,
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
    } = useInvoices();

    const { toast } = useToast();

    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [confirmingInvoiceId, setConfirmingInvoiceId] = React.useState<string | null>(null);
    const [deletingId, setDeletingId] = React.useState<string | null>(null);

    const openConfirm = React.useCallback((id: string) => {
        setConfirmingInvoiceId(id);
        setDeleteDialogOpen(true);
    }, []);

    const closeConfirm = React.useCallback(() => {
        setDeleteDialogOpen(false);
        setConfirmingInvoiceId(null);
    }, []);

    const handleDelete = React.useCallback(
        async (id: string | null) => {
            if (!id) return;
            if (deletingId) return;
            setDeletingId(id);
            try {
                await deleteInvoiceById(id);
                toast({ title: "Invoice deleted", description: "Invoice removed successfully.", variant: "success" });
                closeConfirm();
            } catch (err) {
                console.error(err);
                toast({ title: "Delete failed", description: "Unable to delete invoice.", variant: "destructive" });
            } finally {
                setDeletingId(null);
            }
        },
        [closeConfirm, deleteInvoiceById, deletingId, toast],
    );

    const displayRows = React.useMemo(() => rows.map((row, index) => ({ ...row, displayNo: (pageIndex - 1) * pageSize + index + 1 })), [pageIndex, pageSize, rows]);

    return {
        rows,
        displayRows,
        isLoading,
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
        // dialog + delete
        deleteDialogOpen,
        confirmingInvoiceId,
        deletingId,
        openConfirm,
        closeConfirm,
        handleDelete,
    };
}
