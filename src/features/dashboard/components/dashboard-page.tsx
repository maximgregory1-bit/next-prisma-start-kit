import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { DeliveryPerformance, ExceptionsChart, OrdersByCountries, OverviewStats, ShipmentStatistics, Sidebar, Topbar, VehiclesOverview } from "@/features/dashboard/components";

export function DashboardPage() {
    return (
        <DashboardLayout sidebar={<Sidebar activeItem="Dashboard" />} header={<Topbar activeItem="Dashboard" />} mainClassName="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
            <div className="relative space-y-6">
                <OverviewStats />
                {/* <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <VehiclesOverview />
          </div>
          <div className="lg:col-span-2">
            <ShipmentStatistics />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <DeliveryPerformance />
          <ExceptionsChart />
          <OrdersByCountries />
        </div> */}
            </div>
        </DashboardLayout>
    );
}
