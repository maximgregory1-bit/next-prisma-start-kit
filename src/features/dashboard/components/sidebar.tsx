"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { ChevronRight, Menu, ChevronsRight, ChevronsLeft, CircleUser, LogOut, Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layouts/sidebar-context";
import { navigation } from "@/features/dashboard/data/dashboard-data";

const sidebarClasses = "flex h-full w-full flex-col bg-sidebar text-sidebar-foreground";

function SidebarContent({ activeItem, activeChild }: { activeItem?: string; activeChild?: string }) {
    const { collapsed, toggleCollapsed } = useSidebar();
    const { data: session } = useSession();
    const [profileImage, setProfileImage] = React.useState<string | null>(null);

    React.useEffect(() => {
        let mounted = true;

        const loadProfileImage = async () => {
            try {
                const response = await fetch("/api/user/me", { cache: "no-store" });
                if (!response.ok) return;
                const payload = (await response.json().catch(() => null)) as { image?: string | null } | null;
                if (!mounted) return;
                setProfileImage(payload?.image ?? null);
            } catch {
                // Ignore profile image fetch failures; default avatar remains.
            }
        };

        const onProfileUpdated = (event: Event) => {
            const customEvent = event as CustomEvent<{ image?: string | null }>;
            setProfileImage(customEvent.detail?.image ?? null);
        };

        void loadProfileImage();
        window.addEventListener("admin-profile-updated", onProfileUpdated as EventListener);

        return () => {
            mounted = false;
            window.removeEventListener("admin-profile-updated", onProfileUpdated as EventListener);
        };
    }, []);

    const displayName = session?.user?.name || session?.user?.email || "User";
    const displayRole = session?.user?.email ? "Admin" : "Guest";
    const avatarSrc = profileImage || "/images/avatar.png";

    return (
        <div className={sidebarClasses}>
            <div className={cn("flex items-center justify-center px-5 py-6", collapsed ? "justify-center" : "gap-3")}>
                {collapsed ? (
                    <Link href="/dashboard" className="flex items-center justify-center text-xl font-black text-primary">
                        SK
                    </Link>
                ) : (
                    <Link href="/dashboard" className="flex items-center justify-center gap-3">
                        <Image src="/images/logo.png" alt="start-kit" width={200} height={25} className="dark:hidden " />
                        <Image src="/images/white_logo.png" alt="start-kit" width={200} height={25} className="hidden dark:block " />
                    </Link>
                )}
            </div>
            <ScrollArea className={cn("flex-1 pb-6", collapsed ? "px-2" : "px-5")}>
                <div className="space-y-6">
                    {navigation.map((section) => (
                        <div key={section.title}>
                            {section.title && !collapsed ? <p className="px-3 text-xs font-semibold uppercase text-muted-foreground/80">{section.title}</p> : null}
                            <div className="mt-3 space-y-1">
                                {section.items.map((item) => {
                                    const isActive = activeItem ? item.label === activeItem : item.isActive;

                                    const linkContent = (
                                        <Link
                                            href={item.link ?? "#"}
                                            className={cn(
                                                "relative flex items-center rounded-sm px-3 py-3 text-[15px] font-medium transition",
                                                isActive ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground",
                                                collapsed ? "justify-center" : "justify-between",
                                            )}
                                        >
                                            {isActive ? <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" /> : null}
                                            <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
                                                <item.icon className="size-5" />
                                                <span className={cn(collapsed ? "hidden" : "inline")}>{item.label}</span>
                                            </div>
                                            {!collapsed ? (
                                                <div className="flex items-center gap-2">
                                                    {item.badge ? (
                                                        <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                                                            {item.badge}
                                                        </Badge>
                                                    ) : null}
                                                    {item.children ? <ChevronRight className="size-4 text-muted-foreground" /> : null}
                                                </div>
                                            ) : null}
                                        </Link>
                                    );

                                    return (
                                        <div key={item.label}>
                                            {collapsed ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                                                    <TooltipContent className="rounded-sm px-3" side="right" align="center" sideOffset={12}>
                                                        {item.label}
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                linkContent
                                            )}
                                            {item.children && !collapsed ? (
                                                <div className="ml-7 mt-2 space-y-1 border-l border-sidebar-border pl-3">
                                                    {item.children.map((child) => {
                                                        const isChildActive = activeChild ? child.label === activeChild : child.isActive;

                                                        return (
                                                            <Link
                                                                key={child.label}
                                                                href="#"
                                                                className={cn(
                                                                    "flex items-center rounded-md px-2 py-1.5 text-xs font-medium transition",
                                                                    isChildActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                                                                )}
                                                            >
                                                                {child.label}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <div className={cn("border-t border-sidebar-border", collapsed ? "px-2 py-2" : "px-4 py-3")}>
                <div className={cn("flex items-center", collapsed ? "flex-col gap-2" : "justify-between")}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-primary/30"
                                aria-label="Open profile menu"
                            >
                                <div className="relative">
                                    <Avatar className="size-9 border border-border">
                                        <AvatarImage src={avatarSrc} alt="Profile" />
                                    </Avatar>
                                    <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-emerald-500" />
                                </div>
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="end" sideOffset={10} className="w-64 rounded-md p-2">
                            <DropdownMenuLabel className="px-2 py-2">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Avatar className="size-10 border border-border">
                                            <AvatarImage src={avatarSrc} alt="Profile" />
                                        </Avatar>
                                        <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-card bg-emerald-500" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-semibold text-foreground">{displayName}</p>
                                        <p className="text-xs text-muted-foreground">{displayRole}</p>
                                    </div>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild className="gap-2 my-2 rounded-sm">
                                <Link href="/setting">
                                    <CircleUser className="size-4" />
                                    My Profile
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="gap-2 my-2 rounded-sm">
                                <Link href="/setting">
                                    <Settings className="size-4" />
                                    Settings
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/signin" })} className="gap-2 my-2 rounded-sm">
                                <LogOut className="size-4" />
                                Log Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <ThemeToggle />
                </div>
            </div>
            <div className="border-t border-sidebar-border">
                <button
                    type="button"
                    onClick={toggleCollapsed}
                    className={cn("inline-flex w-full items-center justify-center transition", collapsed ? "h-9" : "h-10")}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <ChevronsRight className="size-4 text-primary" /> : <ChevronsLeft className="size-4 text-primary" />}
                </button>
            </div>
        </div>
    );
}

export function Sidebar({ className, activeItem, activeChild }: { className?: string; activeItem?: string; activeChild?: string }) {
    const { collapsed } = useSidebar();

    return (
        <aside
            className={cn(
                "border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:transition-[width] lg:duration-200",
                collapsed ? "lg:w-20" : "lg:w-70",
                className,
            )}
        >
            <SidebarContent activeItem={activeItem} activeChild={activeChild} />
        </aside>
    );
}

export function MobileSidebar({ activeItem, activeChild }: { activeItem?: string; activeChild?: string }) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <button
                    className="inline-flex size-10 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm lg:hidden"
                    aria-label="Open sidebar"
                >
                    <Menu className="size-5" />
                </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
                <SidebarContent activeItem={activeItem} activeChild={activeChild} />
            </SheetContent>
        </Sheet>
    );
}
