import { ClearAuthFragment } from "@/app/login/clear-auth-fragment";
import { LoginForm } from "@/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <ClearAuthFragment />
      <LoginForm />
    </main>
  );
}
