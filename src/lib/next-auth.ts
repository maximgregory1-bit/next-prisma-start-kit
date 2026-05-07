import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth-options";

export const { handlers, auth } = NextAuth(authOptions);
