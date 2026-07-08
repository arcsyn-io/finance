import { redirect } from "next/navigation";
import { getMfaState } from "@/auth/mfa";
import { getCurrentUser } from "@/auth/user";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const mfa = await getMfaState();

  if (mfa.needsMfa) {
    redirect("/mfa");
  }

  return children;
}
