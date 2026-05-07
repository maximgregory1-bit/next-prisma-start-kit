import * as React from "react";
import { ResetPasswordPage } from "@/features/auth/components";

export default function ResetPassword() {
    return (
        <React.Suspense fallback={null}>
            <ResetPasswordPage />
        </React.Suspense>
    );
}
