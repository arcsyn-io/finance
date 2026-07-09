import { getCurrentUser } from "@/auth/user";
import { ApplicationContext } from "@/server/context/application-context";

export async function getApiApplicationContext(): Promise<ApplicationContext | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return ApplicationContext.user({
    principalId: user.id,
  });
}
