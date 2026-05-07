"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleX, CircleCheck, Plus, SquarePen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/data-table/data-table";
import { cn } from "@/lib/utils";
import { type CustomerRow } from "@/features/customer/data/customer-data";
import { useCustomers, type CustomerRowWithNo } from "@/features/customer/hooks/use-customers";

function StatusIndicator({ active }: { active: boolean }) {
    return active ? <CircleCheck className="size-5 text-primary" /> : <CircleX className="size-5 text-[#ec003f]" />;
}

function ToggleIndicator({ active, tone = "primary" }: { active: boolean; tone?: "primary" | "danger" }) {
    const trackClass = tone === "danger" ? (active ? "bg-red-500" : "bg-[#ec003f]") : active ? "bg-primary" : "bg-[#ec003f]";

    return (
        <span className={cn("relative inline-flex h-5 w-8 items-center rounded-full transition-colors", trackClass)}>
            <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-background transition-transform", active ? "translate-x-4" : "translate-x-0.5")} />
        </span>
    );
}

export function CustomerTable() {
    const router = useRouter();
    const { rows, isLoading, pageIndex, pageSize, totalRows, searchValue, filterValues, sortState, setPageIndex, setPageSize, setSearchValue, setFilterValues, setSortState } =
        useCustomers();

    const columns = React.useMemo(
        () => [
            {
                id: "no",
                headerClassName: "text-[13px]",
                header: "No",
                sortable: true,
                sortValue: (row: CustomerRowWithNo) => row.displayNo,
                cell: (row: CustomerRowWithNo) => <span className="text-xs font-semibold text-foreground">{row.displayNo}</span>,
            },
            {
                id: "status",
                headerClassName: "text-[13px]",
                header: "Status",
                cell: (row: CustomerRow) => <StatusIndicator active={row.status === "Active"} />,
            },
            {
                id: "name",
                headerClassName: "text-[13px]",
                header: "Name",
                sortable: true,
                sortValue: (row: CustomerRow) => row.name,
                cell: (row: CustomerRow) => <span className="text-xs font-semibold text-foreground">{row.name}</span>,
            },
            {
                id: "contactName",
                headerClassName: "text-[13px]",
                header: "Contact Name",
                sortable: true,
                sortValue: (row: CustomerRow) => row.contactName,
                cell: (row: CustomerRow) => <span className="text-xs text-muted-foreground">{row.contactName}</span>,
            },
            {
                id: "campaigns",
                headerClassName: "text-[13px]",
                header: "Campaigns",
                sortable: true,
                sortValue: (row: CustomerRow) => row.campaigns,
                cell: (row: CustomerRow) => <span className="text-xs text-muted-foreground">{row.campaigns}</span>,
            },
            {
                id: "agents",
                headerClassName: "text-[13px]",
                header: "Agents",
                sortable: true,
                sortValue: (row: CustomerRow) => row.agents,
                cell: (row: CustomerRow) => <span className="text-xs text-muted-foreground">{row.agents}</span>,
            },
            {
                id: "email",
                headerClassName: "text-[13px]",
                header: "Email",
                sortable: true,
                sortValue: (row: CustomerRow) => row.email.length,
                cell: (row: CustomerRow) => <span className="text-xs text-muted-foreground">{row.email.length}</span>,
            },
            {
                id: "phone",
                headerClassName: "text-[13px]",
                header: "Phone",
                sortable: true,
                sortValue: (row: CustomerRow) => row.phone.length,
                cell: (row: CustomerRow) => <span className="text-xs text-muted-foreground">{row.phone.length}</span>,
            },
            {
                id: "bundle",
                headerClassName: "text-[13px]",
                header: "Bundle",
                cell: (row: CustomerRow) => <ToggleIndicator active={row.bundle} tone="primary" />,
            },
            {
                id: "showSaved",
                headerClassName: "text-[13px]",
                header: "Show Saved",
                cell: (row: CustomerRow) => <StatusIndicator active={row.showSaved} />,
            },
            {
                id: "price",
                headerClassName: "text-[13px]",
                header: "Price",
                sortable: true,
                sortValue: (row: CustomerRow) => row.price,
                cell: (row: CustomerRow) => <span className="text-xs text-muted-foreground">${row.price}</span>,
            },
            {
                id: "bundlePrice",
                headerClassName: "text-[13px]",
                header: "Bundle Price",
                sortable: true,
                sortValue: (row: CustomerRow) => row.bundlePrice,
                cell: (row: CustomerRow) => <span className="text-xs text-muted-foreground">${row.bundlePrice}</span>,
            },
            {
                id: "actions",
                headerClassName: "text-[13px]",
                header: "Actions",
                cell: (row: CustomerRow) => (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Button variant="ghost" size="icon" className="size-8" asChild>
                            <Link href={`/customer/${row.id}`} aria-label="Edit customer details">
                                <SquarePen className="size-4" />
                            </Link>
                        </Button>
                    </div>
                ),
            },
        ],
        [],
    );

    return (
        <Card className="border-border/60 bg-card shadow-sm py-3">
            <DataTable
                data={rows}
                columns={columns}
                rowId={(row) => row.id}
                enableSelection={false}
                onRowClick={(row) => router.push(`/customer/${row.id}`)}
                loading={isLoading}
                loadingLabel="Loading customers..."
                emptyLabel="No customers found."
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
                search={{
                    placeholder: "Search Customer",
                    accessor: (row) =>
                        [
                            row.id,
                            row.status,
                            row.name,
                            row.contactName,
                            row.email.join(" "),
                            row.phone.map((entry) => [entry.number, entry.group ?? ""].join(" ")).join(" "),
                            String(row.campaigns),
                            String(row.agents),
                            row.bundle ? "yes" : "no",
                            row.showSaved ? "yes" : "no",
                            row.excludeReport ? "yes" : "no",
                            String(row.price),
                            String(row.bundlePrice),
                            String(row.owed),
                        ]
                            .join(" ")
                            .toLowerCase(),
                }}
                filters={[
                    {
                        key: "status",
                        label: "Status",
                        options: ["Active", "Inactive", "Pending"],
                        accessor: (row) => row.status,
                    },
                ]}
                toolbarAction={
                    <div className="flex items-center">
                        <Button asChild className="h-9 gap-2 rounded-sm">
                            <Link href="/customer/new">
                                <Plus className="size-4" />
                                Add New Customer
                            </Link>
                        </Button>
                    </div>
                }
            />
        </Card>
    );
}
