import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { env } from "@/lib/env";
import { verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
    identifier: z.string().min(3).max(160),
    password: z.string().min(8).max(128),
});

export const authOptions: NextAuthConfig = {
    secret: env.NEXTAUTH_SECRET,
    trustHost: true,
    debug: env.NODE_ENV === "development",
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                identifier: { label: "Email or phone", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const parsed = credentialsSchema.safeParse(credentials);
                if (!parsed.success) {
                    return null;
                }

                const { identifier, password } = parsed.data;
                const isEmail = identifier.includes("@");
                const normalized = isEmail ? identifier.toLowerCase() : identifier;

                try {
                    const user = await prisma.user.findFirst({
                        where: isEmail ? { email: normalized } : { phone: normalized },
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            password: true,
                            isApproved: true,
                        },
                    });
                    if (!user) {
                        return null;
                    }

                    if (!user.password) {
                        return null;
                    }

                    const passwordOk = await verifyPassword(password, user.password);
                    if (!passwordOk) {
                        return null;
                    }

                    if (user.isApproved === false) {
                        throw new Error("Account pending approval");
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name ?? undefined,
                    };
                } catch (error) {
                    console.error("Credentials authorize failed", error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Never store avatar in JWT cookie (can be very large base64 data URL).
            if ("picture" in token) {
                delete (token as { picture?: unknown }).picture;
            }

            if (user) {
                token.userId = user.id;
                token.name = user.name ?? undefined;
                token.email = user.email ?? undefined;
            }

            if (trigger === "update" && session) {
                const sessionPayload = session as { name?: string; email?: string };
                if (typeof sessionPayload.name === "string") token.name = sessionPayload.name;
                if (typeof sessionPayload.email === "string") token.email = sessionPayload.email;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.userId as string;
                if (typeof token.name === "string") session.user.name = token.name;
                if (typeof token.email === "string") session.user.email = token.email;
            }
            return session;
        },
    },
    pages: {
        signIn: "/signin",
    },
};
