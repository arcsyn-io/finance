import { signIn } from "@/auth/actions";
import { ClearAuthFragment } from "@/app/login/clear-auth-fragment";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <ClearAuthFragment />
      <form
        action={signIn}
        className="w-full max-w-sm rounded-lg border border-border bg-panel p-6"
      >
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-accent">
            Finance
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Entrar</h1>
        </div>

        <label className="mt-6 block text-sm">
          <span className="text-muted">E-mail</span>
          <input
            className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-accent"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="mt-4 block text-sm">
          <span className="text-muted">Senha</span>
          <input
            className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-accent"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>

        <button className="mt-6 h-10 w-full rounded-md bg-accent px-4 text-sm font-semibold text-background transition hover:brightness-110">
          Entrar
        </button>
      </form>
    </main>
  );
}
