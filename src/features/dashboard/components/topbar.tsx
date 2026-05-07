"use client";

import * as React from "react";
import Link from "next/link";
import { CircleUser, LogOut, Search, Settings } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MobileSidebar } from "@/features/dashboard/components";

export function Topbar({ activeItem, activeChild }: { activeItem?: string; activeChild?: string }) {
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
        <header className="sticky top-4 z-40 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 rounded-md bg-card/90 px-4 py-4 shadow-sm backdrop-blur sm:px-6">
                <div className="flex items-center gap-3">
                    <MobileSidebar activeItem={activeItem} activeChild={activeChild} />
                    {/* <div className="relative hidden min-w-70 flex-1 sm:block">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input placeholder="Search [CTRL + K]" className="h-10 border-none shadow-none bg-card pl-10 text-sm w-full" />
                    </div> */}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground sm:hidden">
                        <Search className="size-4" />
                        <span className="sr-only">Search</span>
                    </Button>
                    <ThemeToggle />
                    {/* <Button variant="ghost" size="icon" className="text-muted-foreground">
                        <Bell className="size-4" />
                        <span className="sr-only">Notifications</span>
                    </Button> */}
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
                        <DropdownMenuContent align="end" className="w-64 rounded-md p-2 mt-4">
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
                </div>
            </div>
        </header>
    );
}
