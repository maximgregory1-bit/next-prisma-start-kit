import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { deliveryPerformance } from "@/features/dashboard/data/dashboard-data";

export function DeliveryPerformance() {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Delivery Performance</CardTitle>
        <p className="text-sm text-muted-foreground">
          12% increase in this month
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {deliveryPerformance.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.value}</p>
              </div>
              <span className="text-xs font-semibold text-emerald-500">
                {item.change}
              </span>
            </div>
            <Progress
              value={item.progress}
              className="h-2 bg-muted"
              indicatorClassName={item.color}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
