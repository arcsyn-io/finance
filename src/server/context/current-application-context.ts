import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/user";
import { ApplicationContext } from "@/server/context/application-context";

export async function getCurrentApplicationContext(): Promise<ApplicationContext> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return ApplicationContext.user({
    principalId: user.id,
  });
}
