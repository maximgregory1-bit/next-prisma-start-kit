import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Sidebar, Topbar } from "@/features/dashboard/components";
import { InvoiceMetrics, InvoiceTable } from "@/features/invoice/components";

export function InvoiceListPage() {
    return (
        <DashboardLayout sidebar={<Sidebar activeItem="Invoice" />} header={<Topbar activeItem="Invoice" />}>
            <div className="space-y-6">
                {/* <InvoiceMetrics /> */}
                <InvoiceTable />
            </div>
        </DashboardLayout>
    );
}
