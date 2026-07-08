import { redirect } from "next/navigation";
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

  return children;
}
