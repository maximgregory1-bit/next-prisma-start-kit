"use client";

import * as React from "react";

import { Toast, ToastAction, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";

const TOAST_LIMIT = 3;
const TOAST_DURATION = 3000;
const TOAST_REMOVE_DELAY = 1000000;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

type ToastType = ToastProps & {
    id: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: ToastActionElement;
};

type State = {
    toasts: ToastType[];
};

type Action =
    | { type: "ADD_TOAST"; toast: ToastType }
    | { type: "UPDATE_TOAST"; toast: Partial<ToastType> }
    | { type: "DISMISS_TOAST"; toastId?: ToastType["id"] }
    | { type: "REMOVE_TOAST"; toastId?: ToastType["id"] };

let count = 0;

const genId = () => {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
};

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const addToRemoveQueue = (toastId: string) => {
    if (toastTimeouts.has(toastId)) {
        return;
    }

    const timeout = setTimeout(() => {
        toastTimeouts.delete(toastId);
        dispatch({ type: "REMOVE_TOAST", toastId });
    }, TOAST_REMOVE_DELAY);

    toastTimeouts.set(toastId, timeout);
};

const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
            };
        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((toast) => (toast.id === action.toast.id ? { ...toast, ...action.toast } : toast)),
            };
        case "DISMISS_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((toast) => {
                    if (toast.id === action.toastId || action.toastId === undefined) {
                        return { ...toast, open: false };
                    }
                    return toast;
                }),
            };
        case "REMOVE_TOAST":
            if (action.toastId === undefined) {
                return { ...state, toasts: [] };
            }
            return {
                ...state,
                toasts: state.toasts.filter((toast) => toast.id !== action.toastId),
            };
        default:
            return state;
    }
};

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener) => listener(memoryState));
}

function toast(props: Omit<ToastType, "id">) {
    const id = genId();

    const update = (updateProps: Partial<ToastType>) =>
        dispatch({
            type: "UPDATE_TOAST",
            toast: { ...updateProps, id },
        });

    const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open) => {
                if (!open) {
                    dismiss();
                }
            },
        },
    });

    return { id, dismiss, update };
}

function useToast() {
    const [state, setState] = React.useState<State>(memoryState);

    React.useEffect(() => {
        listeners.push(setState);
        return () => {
            const index = listeners.indexOf(setState);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, []);

    return {
        ...state,
        toast,
        dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    };
}

export { useToast, toast };
export type { ToastActionElement };

export function Toaster() {
    const { toasts } = useToast();

    return (
        <ToastProvider duration={TOAST_DURATION}>
            {toasts.map(({ id, title, description, action, ...props }) => (
                <Toast key={id} {...props}>
                    <div className="grid gap-1">
                        {title ? <ToastTitle>{title}</ToastTitle> : null}
                        {description ? <ToastDescription>{description}</ToastDescription> : null}
                    </div>
                    {action}
                    <ToastClose />
                </Toast>
            ))}
            <ToastViewport />
        </ToastProvider>
    );
}
