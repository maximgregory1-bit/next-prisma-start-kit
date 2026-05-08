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

export function SignInPage() {
    const [showPassword, setShowPassword] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage(null);
        setIsSubmitting(true);

        const formData = new FormData(event.currentTarget);
        const identifier = String(formData.get("identifier") ?? "").trim();
        const password = String(formData.get("password") ?? "");

        try {
            const result = await signIn("credentials", {
                redirect: false,
                identifier,
                password,
            });

            if (!result) {
                setErrorMessage("Unable to sign in right now. Please try again.");
                return;
            }

            if (result.error) {
                setErrorMessage(result.error === "CredentialsSignin" ? "Invalid credentials" : result.error);
                return;
            }

            router.push("/dashboard");
            router.refresh();
        } catch {
            setErrorMessage("Unable to reach authentication service. Please check your connection and try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-background">
            <div
                className="pointer-events-none absolute right-20 top-24 hidden h-32 w-32 opacity-70 sm:block"
                style={{
                    backgroundImage: "radial-gradient(circle, rgba(105,108,255,0.35) 2px, transparent 2px)",
                    backgroundSize: "16px 16px",
                }}
            />
            <div
                className="pointer-events-none absolute bottom-16 left-16 hidden h-28 w-28 opacity-60 sm:block"
                style={{
                    backgroundImage: "radial-gradient(circle, rgba(105,108,255,0.25) 2px, transparent 2px)",
                    backgroundSize: "14px 14px",
                }}
            />
            <div className="relative flex min-h-screen items-center justify-center px-4 py-12">
                <Card className="w-full max-w-md border-border/60 bg-card/90 shadow-xl backdrop-blur">
                    <CardContent className="space-y-6 p-8">
                        <div className="flex items-center justify-center gap-2">
                            <Image src="/images/logo.png" alt="start-kit" width={150} height={28} className="dark:hidden w-fit" />
                            <Image src="/images/white_logo.png" alt="start-kit" width={150} height={28} className="hidden dark:block w-fit" />
                        </div>
                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-semibold text-foreground">
                                Welcome to start-kit!
                                <span className="ml-1">&#128075;</span>
                            </h1>
                            <p className="text-sm text-muted-foreground">Please sign-in to your account</p>
                        </div>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Email or Phone</label>
                                <Input name="identifier" placeholder="Enter your email or phone" className="h-10 rounded-md bg-card" autoComplete="username" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">Password</label>
                                <div className="relative">
                                    <Input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="********"
                                        className="h-10 rounded-md bg-card pr-10"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-muted-foreground">
                                    <Checkbox className="size-4" />
                                    Remember Me
                                </label>
                                <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                                    Forgot Password?
                                </Link>
                            </div>
                            <Button className="h-10 w-full rounded-md" disabled={isSubmitting}>
                                {isSubmitting ? "Signing in..." : "Login"}
                            </Button>
                        </form>
                        {errorMessage ? <p className="text-center text-sm text-destructive">{errorMessage}</p> : null}
                        <div className="text-center text-sm text-muted-foreground">
                            New on our platform?{" "}
                            <Link href="/signup" className="font-medium text-primary hover:underline">
                                Create an account
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
