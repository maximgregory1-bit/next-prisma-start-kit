"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export function SignUpPage() {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("firstName") ?? "").trim();
    const lastName = String(formData.get("lastName") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!firstName || !lastName || !email || !password) {
      setErrorMessage("Please fill in all required fields.");
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: `${firstName} ${lastName}`.trim(),
        email,
        password,
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setErrorMessage(payload.message ?? "Unable to create account.");
      setIsSubmitting(false);
      return;
    }

    const result = await signIn("credentials", {
      redirect: false,
      identifier: email,
      password,
    });

    if (result?.error) {
      setErrorMessage("Account created. Please sign in to continue.");
      setIsSubmitting(false);
      return;
    }

    router.push("/dashboard");
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
                alt="LeaderGroup"
                width={150}
                height={28}
                className="dark:hidden w-fit"
              />
              <Image
                src="/images/white_logo.png"
                alt="LeaderGroup"
                width={150}
                height={28}
                className="hidden dark:block w-fit"
              />
            </div>
            <div className="space-y-2 text-center">
              <h1 className="text-xl font-semibold text-foreground">
                Create an Account!
              </h1>
              <p className="text-sm text-muted-foreground">
                Please enter the required information
              </p>
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  First Name
                </label>
                <Input
                  name="firstName"
                  placeholder="Enter your first name"
                  className="h-10 rounded-md bg-card"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Last Name
                </label>
                <Input
                  name="lastName"
                  placeholder="Enter your last name"
                  className="h-10 rounded-md bg-card"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className="h-10 rounded-md bg-card"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Password
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox className="size-4" />
                <span>
                  I agree to{" "}
                  <Link href="#" className="text-primary hover:underline">
                    privacy policy
                  </Link>{" "}
                  &amp; terms
                </span>
              </div>
              <Button
                className="h-10 w-full rounded-md"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating account..." : "Sign up"}
              </Button>
            </form>
            {errorMessage ? (
              <p className="text-center text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/signin"
                className="font-medium text-primary hover:underline"
              >
                Sign in instead
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
