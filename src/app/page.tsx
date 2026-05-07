import { redirect } from "next/navigation";

import { auth } from "@/lib/next-auth";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  redirect("/signin");
}
