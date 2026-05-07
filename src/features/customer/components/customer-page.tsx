import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Sidebar, Topbar } from "@/features/dashboard/components";
import { CustomerMetrics } from "@/features/customer/components/customer-metrics";
import { CustomerTable } from "@/features/customer/components/customer-table";

export function CustomerPage() {
    return (
        <DashboardLayout sidebar={<Sidebar activeItem="Customer" />} header={<Topbar activeItem="Customer" />}>
            <div className="space-y-6">
                {/* <CustomerMetrics /> */}
                <CustomerTable />
            </div>
        </DashboardLayout>
    );
}
