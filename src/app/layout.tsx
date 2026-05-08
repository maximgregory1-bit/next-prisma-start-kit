import type { Metadata } from "next";
import * as React from "react";
import { Geist, Geist_Mono, Plus_Jakarta_Sans, Public_Sans } from "next/font/google";

import { ThemeProvider } from "@/components/theme/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { RouteLoader } from "@/components/ui/route-loader";
import { Toaster } from "@/components/ui/toaster";

import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
    variable: "--font-jakarta",
    subsets: ["latin"],
});

const publicSans = Public_Sans({
    variable: "--font-public-sans",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "start-kit Logistics Dashboard",
    description: "Fleet insights and delivery performance overview.",
    icons: {
        icon: "/favicon.ico",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable} ${jakarta.variable} ${publicSans.variable} antialiased`}>
                <AuthSessionProvider>
                    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
                        <TooltipProvider delayDuration={200}>
                            <React.Suspense fallback={null}>
                                <RouteLoader />
                            </React.Suspense>
                            <Toaster />
                            {children}
                        </TooltipProvider>
                    </ThemeProvider>
                </AuthSessionProvider>
            </body>
        </html>
    );
}
