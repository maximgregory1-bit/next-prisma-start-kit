"use client";

import * as React from "react";
import { Toast as ToastPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Viewport>, React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>>(
    ({ className, ...props }, ref) => (
        <ToastPrimitive.Viewport ref={ref} className={cn("fixed top-4 right-4 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[380px]", className)} {...props} />
    ),
);
ToastViewport.displayName = "ToastViewport";

const toastVariants = cva(
    "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-2",
    {
        variants: {
            variant: {
                default: "bg-card text-card-foreground",
                success: "border-primary/50 bg-primary text-primary-foreground",
                destructive: "border-destructive/50 bg-destructive text-primary-foreground",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

const Toast = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Root>, React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & VariantProps<typeof toastVariants>>(
    ({ className, variant, ...props }, ref) => (
        <ToastPrimitive.Root ref={ref} data-variant={variant ?? "default"} className={cn(toastVariants({ variant }), className)} {...props} />
    ),
);
Toast.displayName = "Toast";

const ToastAction = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Action>, React.ComponentPropsWithoutRef<typeof ToastPrimitive.Action>>(
    ({ className, ...props }, ref) => (
        <ToastPrimitive.Action
            ref={ref}
            className={cn(
                "inline-flex h-8 items-center justify-center rounded-md border border-input bg-transparent px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent",
                className,
            )}
            {...props}
        />
    ),
);
ToastAction.displayName = "ToastAction";

const ToastClose = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Close>, React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>>(({ className, ...props }, ref) => (
    <ToastPrimitive.Close
        ref={ref}
        className={cn(
            "absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none",
            "group-data-[variant=success]:bg-primary group-data-[variant=success]:text-primary-foreground",
            "group-data-[variant=destructive]:bg-destructive group-data-[variant=destructive]:text-primary-foreground",
            className,
        )}
        {...props}
    >
        <X className="size-4" />
    </ToastPrimitive.Close>
));
ToastClose.displayName = "ToastClose";

const ToastTitle = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Title>, React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>>(({ className, ...props }, ref) => (
    <ToastPrimitive.Title ref={ref} className={cn("text-sm font-semibold", className)} {...props} />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef<React.ElementRef<typeof ToastPrimitive.Description>, React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>>(
    ({ className, ...props }, ref) => <ToastPrimitive.Description ref={ref} className={cn("text-xs", className)} {...props} />,
);
ToastDescription.displayName = "ToastDescription";

export { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction };
