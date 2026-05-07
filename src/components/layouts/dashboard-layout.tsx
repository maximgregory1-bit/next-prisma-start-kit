"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { SidebarProvider, useSidebar } from "@/components/layouts/sidebar-context";

type DashboardLayoutProps = {
    sidebar?: ReactNode;
    header?: ReactNode;
    children: ReactNode;
    mainClassName?: string;
};

function DashboardLayoutContent({ sidebar, header: _header, children, mainClassName }: DashboardLayoutProps) {
    const { collapsed } = useSidebar();

    return (
        <div className={cn("min-h-screen bg-background", sidebar ? (collapsed ? "lg:pl-20" : "lg:pl-70") : "")}>
            {sidebar ? <div className="hidden lg:block">{sidebar}</div> : null}
            <div className="min-h-screen bg-background">
                <main className={cn("relative px-4 pb-10 pt-10 sm:px-6 lg:px-8", mainClassName)}>{children}</main>
            </div>
        </div>
    );
}

export function DashboardLayout(props: DashboardLayoutProps) {
    return (
        <SidebarProvider>
            <DashboardLayoutContent {...props} />
        </SidebarProvider>
    );
}
