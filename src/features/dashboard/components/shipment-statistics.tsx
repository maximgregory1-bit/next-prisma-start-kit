import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { shipmentSeries } from "@/features/dashboard/data/dashboard-data";

function ShipmentChart() {
  const maxValue = Math.max(...shipmentSeries.map((item) => item.shipment));
  const points = shipmentSeries
    .map((item, index) => {
      const x = (index / (shipmentSeries.length - 1)) * 100;
      const y = 100 - (item.delivery / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="relative h-44">
      <div className="flex h-full items-end justify-between gap-3">
        {shipmentSeries.map((item) => (
          <div key={item.day} className="flex h-full flex-1 flex-col justify-end">
            <div className="relative flex h-32 items-end justify-center">
              <div
                className={cn(
                  "w-3 rounded-full bg-chart-1",
                  "shadow-[0_0_0_1px_rgba(255,255,255,0.05)]"
                )}
                style={{ height: `${(item.shipment / maxValue) * 100}%` }}
              />
            </div>
            <span className="mt-2 text-center text-[10px] text-muted-foreground">
              {item.day}
            </span>
          </div>
        ))}
      </div>
      <svg
        className="pointer-events-none absolute inset-0 h-32 w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke="var(--chart-2)"
          strokeWidth="2"
        />
        {shipmentSeries.map((item, index) => {
          const x = (index / (shipmentSeries.length - 1)) * 100;
          const y = 100 - (item.delivery / maxValue) * 100;
          return (
            <circle
              key={item.day}
              cx={x}
              cy={y}
              r="2.2"
              fill="var(--chart-2)"
            />
          );
        })}
      </svg>
    </div>
  );
}

export function ShipmentStatistics() {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm">
      <CardHeader className="flex-row items-start justify-between gap-4 pb-4">
        <div>
          <CardTitle className="text-base font-semibold">
            Shipment statistics
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Total number of deliveries 23.8k
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-lg">
              January
              <ChevronDown className="ml-2 size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>January</DropdownMenuItem>
            <DropdownMenuItem>February</DropdownMenuItem>
            <DropdownMenuItem>March</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-4">
        <ShipmentChart />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-chart-1" />
            Shipment
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-chart-2" />
            Delivery
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
