import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ordersByStatus } from "@/features/dashboard/data/dashboard-data";

function OrdersList({
  items,
}: {
  items: { sender: string; status: string; country: string }[];
}) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={`${item.sender}-${item.country}`}
          className="flex items-center justify-between rounded-xl border border-border/60 bg-card/60 px-4 py-3"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">{item.sender}</p>
            <p className="text-xs text-muted-foreground">{item.country}</p>
          </div>
          <span className="text-xs font-medium text-primary">{item.status}</span>
        </div>
      ))}
    </div>
  );
}

export function OrdersByCountries() {
  return (
    <Card className="border-border/60 bg-card/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">
          Orders by Countries
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          62 deliveries in progress
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="new" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-muted/60">
            <TabsTrigger value="new">New</TabsTrigger>
            <TabsTrigger value="preparing">Preparing</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
          </TabsList>
          <TabsContent value="new">
            <OrdersList items={ordersByStatus.new} />
          </TabsContent>
          <TabsContent value="preparing">
            <OrdersList items={ordersByStatus.preparing} />
          </TabsContent>
          <TabsContent value="shipping">
            <OrdersList items={ordersByStatus.shipping} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
