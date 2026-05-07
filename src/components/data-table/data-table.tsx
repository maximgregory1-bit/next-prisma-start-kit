"use client";

import * as React from "react";
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SortState = {
    id: string;
    direction: "asc" | "desc";
} | null;

type DataTableFilter<T> = {
    key: string;
    label: string;
    options: string[];
    accessor: (row: T) => string;
};

type DataTableColumn<T> = {
    id: string;
    header: React.ReactNode;
    cell: (row: T) => React.ReactNode;
    sortable?: boolean;
    sortValue?: (row: T) => string | number;
    headerClassName?: string;
    cellClassName?: string;
};

type DataTableProps<T> = {
    data: T[];
    columns: DataTableColumn<T>[];
    rowId: (row: T) => string;
    search?: {
        placeholder?: string;
        accessor: (row: T) => string;
    };
    filters?: DataTableFilter<T>[];
    pageSizeOptions?: number[];
    initialPageSize?: number;
    toolbarAction?: React.ReactNode;
    enableSelection?: boolean;
    emptyLabel?: string;
    loading?: boolean;
    loadingLabel?: string;
    manualSearch?: boolean;
    manualFilters?: boolean;
    manualSort?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    filterValues?: Record<string, string>;
    onFilterChange?: (values: Record<string, string>) => void;
    sortState?: SortState;
    onSortChange?: (sort: SortState) => void;
    manualPagination?: boolean;
    pageIndex?: number;
    pageSize?: number;
    totalRows?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    onRowClick?: (row: T) => void;
};

export function DataTable<T>({
    data,
    columns,
    rowId,
    search,
    filters = [],
    pageSizeOptions = [50, 100, 500, 1000],
    initialPageSize = 10,
    toolbarAction,
    enableSelection = true,
    emptyLabel = "No results.",
    loading = false,
    loadingLabel = "Loading...",
    manualSearch = false,
    manualFilters = false,
    manualSort = false,
    searchValue: controlledSearchValue,
    onSearchChange,
    filterValues: controlledFilterValues,
    onFilterChange,
    sortState: controlledSort,
    onSortChange,
    manualPagination = false,
    pageIndex: controlledPageIndex,
    pageSize: controlledPageSize,
    totalRows,
    onPageChange,
    onPageSizeChange,
    onRowClick,
}: DataTableProps<T>) {
    const [searchValue, setSearchValue] = React.useState("");
    const [pageSize, setPageSize] = React.useState(initialPageSize);
    const [pageIndex, setPageIndex] = React.useState(1);
    const [sort, setSort] = React.useState<SortState>(null);
    const [selected, setSelected] = React.useState<Record<string, boolean>>({});
    const [filterValues, setFilterValues] = React.useState<Record<string, string>>(() =>
        filters.reduce(
            (acc, filter) => {
                acc[filter.key] = "All";
                return acc;
            },
            {} as Record<string, string>,
        ),
    );

    const effectiveSearchValue = controlledSearchValue ?? searchValue;
    const effectiveFilterValues = controlledFilterValues ?? filterValues;
    const effectiveSort = controlledSort ?? sort;
    const applySearch = !manualSearch;
    const applyFilters = !manualFilters;
    const applySort = !manualSort;

    const filteredRows = React.useMemo(() => {
        const searchText = effectiveSearchValue.trim().toLowerCase();
        return data.filter((row) => {
            const matchesFilters = applyFilters
                ? filters.every((filter) => {
                      const current = effectiveFilterValues[filter.key] ?? "All";
                      if (current === "All") {
                          return true;
                      }
                      return filter.accessor(row) === current;
                  })
                : true;
            if (!matchesFilters) {
                return false;
            }
            if (!search || !searchText || !applySearch) {
                return true;
            }
            return search.accessor(row).toLowerCase().includes(searchText);
        });
    }, [data, search, effectiveSearchValue, filters, effectiveFilterValues, applyFilters, applySearch]);

    const sortedRows = React.useMemo(() => {
        if (!applySort || !effectiveSort) {
            return filteredRows;
        }
        const column = columns.find((col) => col.id === effectiveSort.id);
        if (!column?.sortValue) {
            return filteredRows;
        }
        return [...filteredRows].sort((a, b) => {
            const left = column.sortValue?.(a);
            const right = column.sortValue?.(b);
            if (left === right) {
                return 0;
            }
            if (left === undefined) {
                return 1;
            }
            if (right === undefined) {
                return -1;
            }
            return left < right ? (effectiveSort.direction === "asc" ? -1 : 1) : effectiveSort.direction === "asc" ? 1 : -1;
        });
    }, [columns, filteredRows, effectiveSort, applySort]);

    const activePageSize = manualPagination ? (controlledPageSize ?? initialPageSize) : pageSize;
    const activePageIndex = manualPagination ? (controlledPageIndex ?? 1) : pageIndex;
    const effectiveTotalRows = manualPagination ? (totalRows ?? sortedRows.length) : sortedRows.length;
    const totalPages = Math.max(1, Math.ceil(effectiveTotalRows / activePageSize));
    const currentPage = Math.min(activePageIndex, totalPages);
    const pageStart = (currentPage - 1) * activePageSize;
    const pagedRows = manualPagination ? sortedRows : sortedRows.slice(pageStart, pageStart + activePageSize);

    React.useEffect(() => {
        if (manualPagination) {
            onPageChange?.(1);
            return;
        }
        setPageIndex(1);
    }, [effectiveSearchValue, effectiveFilterValues, activePageSize, manualPagination, onPageChange]);

    React.useEffect(() => {
        if (manualPagination) {
            if (activePageIndex > totalPages) {
                onPageChange?.(totalPages);
            }
            return;
        }
        if (pageIndex > totalPages) {
            setPageIndex(totalPages);
        }
    }, [manualPagination, activePageIndex, onPageChange, pageIndex, totalPages]);

    const selectedCount = Object.keys(selected).filter((key) => selected[key]).length;

    const allPageSelected = pagedRows.length > 0 && pagedRows.every((row) => selected[rowId(row)]);
    const somePageSelected = pagedRows.some((row) => selected[rowId(row)]) && !allPageSelected;

    const toggleAllPage = (checked: boolean) => {
        const next = { ...selected };
        pagedRows.forEach((row) => {
            next[rowId(row)] = checked;
        });
        setSelected(next);
    };

    const toggleRow = (id: string, checked: boolean) => {
        setSelected((prev) => ({ ...prev, [id]: checked }));
    };

    const handleSort = (id: string) => {
        const next = (() => {
            if (!effectiveSort || effectiveSort.id !== id) {
                return { id, direction: "asc" } as SortState;
            }
            if (effectiveSort.direction === "asc") {
                return { id, direction: "desc" } as SortState;
            }
            return null;
        })();

        if (manualSort) {
            onSortChange?.(next);
            return;
        }

        setSort(next);
    };

    const renderSortIcon = (id: string) => {
        if (!effectiveSort || effectiveSort.id !== id) {
            return <ArrowUpDown className="size-3" />;
        }
        return <span className="text-xs">{effectiveSort.direction === "asc" ? "\u25B2" : "\u25BC"}</span>;
    };

    const pageNumbers = React.useMemo(() => {
        const maxPages = 5;
        const start = Math.max(1, currentPage - Math.floor(maxPages / 2));
        const end = Math.min(totalPages, start + maxPages - 1);
        const adjustedStart = Math.max(1, end - maxPages + 1);
        return Array.from({ length: end - adjustedStart + 1 }, (_, index) => {
            return adjustedStart + index;
        });
    }, [currentPage, totalPages]);

    return (
        <div>
            <div className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Show</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9">
                                    {activePageSize}
                                    <ChevronDown className="ml-2 size-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                {pageSizeOptions.map((size) => (
                                    <DropdownMenuItem key={size} onClick={() => (manualPagination ? onPageSizeChange?.(size) : setPageSize(size))}>
                                        {size}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    {search ? (
                        <Input
                            placeholder={search.placeholder ?? "Search"}
                            className="h-9 w-full max-w-xs bg-card rounded-sm"
                            value={effectiveSearchValue}
                            onChange={(event) => {
                                const value = event.target.value;
                                if (manualSearch) {
                                    onSearchChange?.(value);
                                    return;
                                }
                                setSearchValue(value);
                                onSearchChange?.(value);
                            }}
                        />
                    ) : null}
                    {filters.map((filter) => (
                        <DropdownMenu key={filter.key}>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9">
                                    {effectiveFilterValues[filter.key] ?? "All"}
                                    <ChevronDown className="ml-2 size-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {["All", ...filter.options].map((option) => (
                                    <DropdownMenuItem
                                        key={option}
                                        onClick={() => {
                                            const next = {
                                                ...effectiveFilterValues,
                                                [filter.key]: option,
                                            };
                                            if (manualFilters) {
                                                onFilterChange?.(next);
                                                return;
                                            }
                                            setFilterValues(next);
                                            onFilterChange?.(next);
                                        }}
                                    >
                                        {option}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ))}
                    {toolbarAction ? <div className="flex items-center">{toolbarAction}</div> : null}
                </div>
            </div>
            <div className="w-full overflow-auto">
                <table className="w-full min-w-225 text-left text-sm">
                    <thead className="border-b border-border/60 bg-muted/40 text-xs text-muted-foreground">
                        <tr>
                            {enableSelection ? (
                                <th className="px-4 py-3">
                                    <Checkbox
                                        checked={allPageSelected || (somePageSelected && "indeterminate")}
                                        onCheckedChange={(value) => toggleAllPage(!!value)}
                                        aria-label="Select all"
                                        className="rounded-xs"
                                    />
                                </th>
                            ) : null}
                            {columns.map((column) => (
                                <th key={column.id} className={cn("px-4 py-3", column.headerClassName)}>
                                    {column.sortable ? (
                                        <button type="button" className="inline-flex items-center gap-1" onClick={() => handleSort(column.id)}>
                                            {column.header}
                                            {renderSortIcon(column.id)}
                                        </button>
                                    ) : (
                                        column.header
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length + (enableSelection ? 1 : 0)} className="px-4 py-10 text-center">
                                    <div className="inline-flex items-center gap-3 rounded-md bg-muted/40 px-4 py-2">
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        <span className="text-sm text-muted-foreground">{loadingLabel}</span>
                                    </div>
                                </td>
                            </tr>
                        ) : pagedRows.length ? (
                            pagedRows.map((row) => (
                                <tr
                                    key={rowId(row)}
                                    className={cn("hover:bg-muted/30", onRowClick ? "cursor-pointer" : undefined)}
                                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                                >
                                    {enableSelection ? (
                                        <td className="px-4 py-4">
                                            <Checkbox
                                                checked={!!selected[rowId(row)]}
                                                onCheckedChange={(value) => toggleRow(rowId(row), !!value)}
                                                aria-label={`Select ${rowId(row)}`}
                                                className="rounded-xs"
                                            />
                                        </td>
                                    ) : null}
                                    {columns.map((column) => (
                                        <td key={`${rowId(row)}-${column.id}`} className={cn("px-4 py-4", column.cellClassName)}>
                                            {column.cell(row)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length + (enableSelection ? 1 : 0)} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                    {emptyLabel}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground">
                    {selectedCount} of {effectiveTotalRows} row(s) selected
                </p>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="size-9 rounded-sm"
                            onClick={() => (manualPagination ? onPageChange?.(Math.max(1, currentPage - 1)) : setPageIndex((prev) => Math.max(1, prev - 1)))}
                            disabled={currentPage <= 1}
                        >
                            <ChevronLeft />
                        </Button>
                        <div className="flex items-center gap-1">
                            {pageNumbers.map((page) => (
                                <Button
                                    key={page}
                                    variant={page === currentPage ? "default" : "outline"}
                                    size="icon"
                                    className="size-9 rounded-sm"
                                    onClick={() => (manualPagination ? onPageChange?.(page) : setPageIndex(page))}
                                >
                                    {page}
                                </Button>
                            ))}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            className="size-9 rounded-sm"
                            onClick={() => (manualPagination ? onPageChange?.(Math.min(totalPages, currentPage + 1)) : setPageIndex((prev) => Math.min(totalPages, prev + 1)))}
                            disabled={currentPage >= totalPages}
                        >
                            <ChevronRight />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
