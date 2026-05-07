import { ChevronDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

type InvoiceFiltersProps = {
  search: string;
  status: string;
  pageSize: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPageSizeChange: (value: number) => void;
};

export function InvoiceFilters({
  search,
  status,
  pageSize,
  onSearchChange,
  onStatusChange,
  onPageSizeChange,
}: InvoiceFiltersProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Show</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                {pageSize}
                <ChevronDown className="ml-2 size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {[10, 25, 50].map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => onPageSizeChange(size)}
                >
                  {size}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button className="h-9 gap-2 rounded-sm">
          <Plus className="size-4" />
          Create Invoice
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Input
          placeholder="Search Invoice"
          className="h-9 w-full max-w-xs bg-card"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              {status}
              <ChevronDown className="ml-2 size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["All", "Paid", "Unpaid", "Partial", "Overdue"].map((value) => (
              <DropdownMenuItem
                key={value}
                onClick={() => onStatusChange(value)}
              >
                {value}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
