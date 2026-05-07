import crypto from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const resetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = resetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid request", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;
  const tokenHash = hashToken(token);

  try {
    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        token: tokenHash,
        expires: { gt: new Date() },
      },
      select: { email: true },
    });

    if (!resetRecord?.email) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { email: resetRecord.email },
      data: {
        password: hashedPassword,
      },
    });

    await prisma.passwordResetToken.deleteMany({
      where: { email: resetRecord.email },
    });

    return NextResponse.json({ message: "Password updated" });
  } catch (error) {
    console.error("Reset password failed", error);
    return NextResponse.json(
      { message: "Unable to reset password" },
      { status: 500 }
    );
  }
}
