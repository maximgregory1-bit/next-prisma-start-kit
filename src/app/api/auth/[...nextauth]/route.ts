import { handlers } from "@/lib/next-auth";

export const runtime = "nodejs";

export const { GET, POST } = handlers;
