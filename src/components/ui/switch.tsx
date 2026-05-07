"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
    return (
        <SwitchPrimitive.Root
            data-slot="switch"
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-border/60 bg-muted/10 transition-colors focus-visible:ring-ring disabled:opacity-50",
                "data-[state=checked]:bg-primary data-[state=checked]:border-primary",
                "data-[state=unchecked]:bg-[#ec003f] data-[state=unchecked]:border-[#ec003f]",
                className,
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                data-slot="switch-thumb"
                className={cn(
                    "pointer-events-none absolute left-px top-px h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
                    "data-[state=checked]:translate-x-5",
                )}
            />
        </SwitchPrimitive.Root>
    );
}

export { Switch };
