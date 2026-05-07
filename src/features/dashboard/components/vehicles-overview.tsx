import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { vehicleStatus } from "@/features/dashboard/data/dashboard-data";

export function VehiclesOverview() {
  const total = vehicleStatus.reduce((sum, item) => sum + item.percent, 0);

  return (
    <Card className="border-border/60 bg-card/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Vehicles Overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          Fleet health across live routes
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {vehicleStatus.map((status) => (
              <span key={status.label}>{status.label}</span>
            ))}
          </div>
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
            {vehicleStatus.map((status) => (
              <div
                key={status.label}
                className={cn("h-full", status.color)}
                style={{ width: `${(status.percent / total) * 100}%` }}
              />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {vehicleStatus.map((status, index) => (
            <div key={status.label}>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3">
                  <span className={cn("size-2 rounded-full", status.color)} />
                  <span className="font-medium text-foreground">
                    {status.label}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {status.duration}
                </div>
                <div className="text-xs font-semibold text-foreground">
                  {status.percent}%
                </div>
              </div>
              {index < vehicleStatus.length - 1 ? (
                <Separator className="mt-4" />
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
