import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Sidebar, Topbar } from "@/features/dashboard/components";

export function DashboardPage() {
    return (
        <DashboardLayout sidebar={<Sidebar activeItem="Dashboard" />} header={<Topbar activeItem="Dashboard" />} mainClassName="relative">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
            <div className="relative space-y-6">Welcome</div>
        </DashboardLayout>
    );
}
