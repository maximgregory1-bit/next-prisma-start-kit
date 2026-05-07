"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { cn } from "@/lib/utils";
import { type InvoiceRow } from "@/features/invoice/data/invoice-data";
import { useInvoiceTable } from "@/features/invoice/hooks/use-invoice-table";

const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

type InvoiceRowWithNo = InvoiceRow & { displayNo: number };

export function InvoiceTable() {
    const router = useRouter();

    const {
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
    } = useInvoiceTable();

    const getInvoiceId = React.useCallback((id: string) => (id.startsWith("#") ? id.slice(1) : id), []);

    // `displayRows` now provided by hook

    const columns = React.useMemo(
        () => [
            {
                id: "no",
                headerClassName: "text-sm",
                header: "No",
                sortable: true,
                sortValue: (row: InvoiceRowWithNo) => row.displayNo,
                cell: (row: InvoiceRowWithNo) => <span className="text-sm font-semibold text-foreground">{row.displayNo}</span>,
            },
            {
                id: "customer",
                headerClassName: "text-sm",
                header: "Customer",
                sortable: true,
                sortValue: (row: InvoiceRow) => row.customerName,
                cell: (row: InvoiceRow) => (
                    <div className="flex items-center gap-3">
                        <div className={cn("flex size-9 items-center justify-center rounded-full text-xs font-semibold", row.customerColor)}>{row.customerInitials}</div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">{row.customerName}</p>
                            <p className="text-xs text-muted-foreground">{row.customerContact}</p>
                        </div>
                    </div>
                ),
            },
            {
                id: "startDate",
                headerClassName: "text-sm",
                header: "Start Date",
                sortable: true,
                sortValue: (row: InvoiceRow) => new Date(row.startDate).getTime(),
                cell: (row: InvoiceRow) => <span className="text-muted-foreground">{new Date(row.startDate).toLocaleDateString()}</span>,
            },
            {
                id: "endDate",
                headerClassName: "text-sm",
                header: "End Date",
                sortable: true,
                sortValue: (row: InvoiceRow) => new Date(row.endDate).getTime(),
                cell: (row: InvoiceRow) => <span className="text-muted-foreground">{new Date(row.endDate).toLocaleDateString()}</span>,
            },
            {
                id: "amount",
                headerClassName: "text-sm",
                header: "Amount",
                sortable: true,
                sortValue: (row: InvoiceRow) => row.amount,
                cell: (row: InvoiceRow) => <span className="text-muted-foreground">{formatCurrency(row.amount)}</span>,
            },
            {
                id: "sentDate",
                headerClassName: "text-sm",
                header: "Sent Date",
                sortable: true,
                sortValue: (row: InvoiceRow) => new Date(row.sentDate).getTime(),
                cell: (row: InvoiceRow) => <span className="text-muted-foreground">{new Date(row.sentDate).toLocaleDateString()}</span>,
            },
            {
                id: "actions",
                headerClassName: "text-sm",
                header: "Actions",
                cell: (row: InvoiceRow) => (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                            <Link href={`/invoice/${getInvoiceId(row.id)}`} aria-label={`Edit invoice ${row.id}`}>
                                <SquarePen className="size-4" />
                            </Link>
                        </Button>
                    </div>
                ),
            },
        ],
        [getInvoiceId],
    );

    return (
        <Card className="border-border/60 bg-card shadow-sm py-3">
            <DataTable
                data={displayRows}
                columns={columns}
                rowId={(row) => row.id}
                enableSelection={false}
                loading={isLoading}
                loadingLabel="Loading invoices..."
                emptyLabel="No invoices found."
                manualPagination
                pageIndex={pageIndex}
                pageSize={pageSize}
                totalRows={totalRows}
                onPageChange={setPageIndex}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPageIndex(1);
                }}
                manualSearch
                searchValue={searchValue}
                onSearchChange={(value) => {
                    setSearchValue(value);
                    setPageIndex(1);
                }}
                manualFilters
                filterValues={filterValues}
                onFilterChange={(next) => {
                    setFilterValues(next);
                    setPageIndex(1);
                }}
                manualSort
                sortState={sortState}
                onSortChange={(next) => {
                    setSortState(next);
                    setPageIndex(1);
                }}
                onRowClick={(row) => {
                    router.push(`/invoice/${getInvoiceId(row.id)}`);
                }}
                search={{
                    placeholder: "Search Invoice",
                    accessor: (row) => [row.id, row.customerName, row.customerContact, String(row.amount), row.startDate, row.endDate, row.sentDate].join(" ").toLowerCase(),
                }}
                filters={[
                    {
                        key: "status",
                        label: "Invoice Status",
                        options: ["Paid", "Unpaid", "Partial", "Overdue"],
                        accessor: (row) => row.statusLabel,
                    },
                ]}
            />
        </Card>
    );
}
