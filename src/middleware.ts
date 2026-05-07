import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { env } from "@/lib/env";

export default async function middleware(request: NextRequest) {
    // Determine whether cookies should be treated as secure. When behind
    // a proxy (vercel, nginx, etc.) the incoming request protocol may be
    // communicated via `x-forwarded-proto`. Fall back to `NEXTAUTH_URL` or
    // NODE_ENV when header is absent.
    const forwardedProto = request.headers.get("x-forwarded-proto");
    const reqProto = forwardedProto ?? new URL(request.url).protocol.replace(":", "");
    const nextauthUrlIsHttps = env.NEXTAUTH_URL ? env.NEXTAUTH_URL.startsWith("https://") : false;
    const secureCookie = reqProto === "https" || nextauthUrlIsHttps || env.NODE_ENV === "production";

    const token = await getToken({
        req: request,
        secret: env.NEXTAUTH_SECRET,
        secureCookie,
    });

    if (request.nextUrl.pathname === "/signin") {
        if (token) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }

        return NextResponse.next();
    }

    if (!token) {
        const signInUrl = new URL("/signin", request.url);
        signInUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/customer/:path*", "/invoice/:path*", "/setting/:path*", "/signin"],
};
