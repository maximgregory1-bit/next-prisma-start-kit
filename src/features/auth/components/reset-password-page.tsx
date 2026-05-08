"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ResetPasswordPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (!token) {
      setError("Reset token is missing.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.message ?? "Unable to reset password.");
      setIsSubmitting(false);
      return;
    }

    setMessage("Password updated. You can sign in now.");
    setIsSubmitting(false);
  };

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
                className="dark:hidden w-fit"
              />
              <Image
                src="/images/white_logo.png"
                alt="start-kit"
                width={150}
                height={28}
                className="hidden dark:block w-fit"
              />
            </div>
            <div className="space-y-2 text-center">
              <h1 className="text-xl font-semibold text-foreground flex items-center justify-center">
                Reset Password
                <Lock className="ml-2 inline-block size-5 text-primary" />
              </h1>
              <p className="text-sm text-muted-foreground">
                Your new password must be different from previously used
                passwords
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    className="h-10 rounded-md bg-card pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********"
                    className="h-10 rounded-md bg-card pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
              </div>
              <Button
                className="h-10 w-full rounded-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Set new password"}
              </Button>
            </form>
            {message ? (
              <p className="text-center text-sm text-emerald-600 dark:text-emerald-400">
                {message}
              </p>
            ) : null}
            {error ? (
              <p className="text-center text-sm text-destructive">{error}</p>
            ) : null}
            <div className="text-center text-sm text-muted-foreground">
              <Link
                href="/signin"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                <ArrowLeft className="size-4" />
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
