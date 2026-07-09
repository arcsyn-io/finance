"use client";

import { FormEvent, useTransition } from "react";
import { useRouter } from "next/navigation";

type AuthApiResponse = {
  readonly redirectTo?: string;
  readonly error?: string;
};

export function LoginForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      }),
    });
    const body = (await response.json()) as AuthApiResponse;

    router.push(body.redirectTo ?? "/login?error=invalid_credentials");
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => startTransition(() => void handleSubmit(event))}
      className="w-full max-w-sm rounded-md border border-border bg-panel p-6 shadow-2xl shadow-black/20"
    >
      <div>
        <p className="text-xs font-bold uppercase text-accent">
          Finance
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Entrar</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          Acesse seu painel financeiro com MFA obrigatorio.
        </p>
      </div>

      <label className="mt-6 block text-sm">
        <span className="text-muted">E-mail</span>
        <input
          className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_rgba(14,165,233,0.18)]"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </label>

      <label className="mt-4 block text-sm">
        <span className="text-muted">Senha</span>
        <input
          className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_rgba(14,165,233,0.18)]"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>

      <button
        className="mt-6 h-10 w-full rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
      >
        Entrar
      </button>
    </form>
  );
}
