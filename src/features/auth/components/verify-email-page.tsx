"use client";

import Image from "next/image";
import Link from "next/link";
import { Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function VerifyEmailPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute right-20 top-24 hidden h-32 w-32 opacity-70 sm:block"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(105,108,255,0.35) 2px, transparent 2px)",
          backgroundSize: "16px 16px",
        }}
      />
      <div
        className="pointer-events-none absolute bottom-16 left-16 hidden h-28 w-28 opacity-60 sm:block"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(105,108,255,0.25) 2px, transparent 2px)",
          backgroundSize: "14px 14px",
        }}
      />
      <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-border/60 bg-card/90 shadow-xl backdrop-blur">
          <CardContent className="space-y-6 p-8">
            <div className="flex items-center justify-center gap-2">
              <Image
                src="/images/logo.png"
                alt="start-kit"
                width={150}
                height={28}
                className="w-fit dark:hidden"
              />
              <Image
                src="/images/white_logo.png"
                alt="start-kit"
                width={150}
                height={28}
                className="hidden w-fit dark:block"
              />
            </div>
            <div className="space-y-2 text-center">
              <h1 className="text-xl font-semibold text-foreground">
                Verify your email
                <Mail className="ml-2 inline-block size-5 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground">
                Account activation link sent to your email address:
                john.doe@email.com Please follow the link inside to continue.
              </p>
            </div>
            <Button className="h-10 w-full rounded-md">Skip for now</Button>
            <div className="text-center text-sm text-muted-foreground">
              Didn&apos;t get the mail?{" "}
              <Link href="#" className="font-medium text-primary hover:underline">
                Resend
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
