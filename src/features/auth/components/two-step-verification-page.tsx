"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const CODE_LENGTH = 6;

export function TwoStepVerificationPage() {
  const [code, setCode] = React.useState<string[]>(
    Array.from({ length: CODE_LENGTH }, () => "")
  );
  const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const nextCode = [...code];
    nextCode[index] = nextValue;
    setCode(nextCode);

    // Auto-advance to the next input when a digit is entered.
    if (nextValue && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
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
                Two Step Verification
              </h1>
              <p className="text-sm text-muted-foreground">
                We sent a verification code to your mobile. Enter the code from
                the mobile in the field below.
              </p>
              <p className="text-sm font-medium text-foreground">******1234</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Type your 6 digit security code
              </p>
              <div className="flex items-center justify-center gap-2">
                {code.map((value, index) => (
                  <Input
                    key={`code-${index}`}
                    ref={(element) => {
                      inputsRef.current[index] = element;
                    }}
                    value={value}
                    onChange={(event) => handleChange(index, event.target.value)}
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    inputMode="numeric"
                    className="h-12 w-12 rounded-md bg-card text-center text-base font-semibold"
                    aria-label={`Digit ${index + 1}`}
                    maxLength={1}
                  />
                ))}
              </div>
            </div>
            <Button className="h-10 w-full rounded-md">Verify my account</Button>
            <div className="text-center text-sm text-muted-foreground">
              Didn&apos;t get the code?{" "}
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
