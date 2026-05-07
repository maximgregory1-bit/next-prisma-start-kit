import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { sendResetEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const forgotSchema = z.object({
  email: z.string().email(),
});

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = forgotSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email } = parsed.data;
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const baseUrl =
    env.NEXTAUTH_URL ?? env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { email: true },
    });

    if (user?.email) {
      await prisma.passwordResetToken.deleteMany({
        where: { email: user.email },
      });

      await prisma.passwordResetToken.create({
        data: {
          email: user.email,
          token: tokenHash,
          expires: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const resetLink = `${baseUrl}/reset-password?token=${rawToken}`;
      await sendResetEmail({ to: user.email, resetLink });
    }

    return NextResponse.json({
      message: "If the email exists, a reset link was sent.",
    });
  } catch (error) {
    console.error("Forgot password failed", error);
    return NextResponse.json(
      { message: "Unable to process request" },
      { status: 500 },
    );
  }
}
