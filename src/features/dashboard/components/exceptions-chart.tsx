import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exceptionReasons } from "@/features/dashboard/data/dashboard-data";

function DonutChart() {
  const total = exceptionReasons.reduce((sum, item) => sum + item.value, 0);
  const gradientStops = exceptionReasons
    .reduce(
      (acc, item) => {
        const start = (acc.total / total) * 100;
        const end = ((acc.total + item.value) / total) * 100;
        return {
          total: acc.total + item.value,
          stops: [...acc.stops, `${item.color} ${start}% ${end}%`],
        };
      },
      { total: 0, stops: [] as string[] }
    )
    .stops.join(", ");

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="size-40 rounded-full"
        style={{ background: `conic-gradient(${gradientStops})` }}
      />
      <div className="absolute size-24 rounded-full bg-card" />
      <div className="absolute text-center">
        <p className="text-2xl font-semibold text-foreground">239</p>
        <p className="text-xs text-muted-foreground">Exceptions</p>
      </div>
    </div>
  );
}

export function ExceptionsChart() {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">
          Reasons for delivery exceptions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <DonutChart />
        <div className="space-y-3">
          {exceptionReasons.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="size-2 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-muted-foreground">{item.label}</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {item.value}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
