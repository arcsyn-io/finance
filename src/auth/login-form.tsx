"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LayoutGrid, LoaderCircle, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthApiResponse = {
  readonly redirectTo?: string;
  readonly error?: string;
};

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="flex w-full max-w-[410px] flex-col gap-8">
      <div className="flex items-center gap-2.5 lg:hidden">
        <div className="flex size-7 items-center justify-center rounded-md bg-accent/20 text-accent">
          <LayoutGrid className="size-3.5" aria-hidden="true" />
        </div>
        <span className="text-sm font-bold">Finance</span>
      </div>

      <div>
        <h2 className="text-[22px] font-bold leading-tight tracking-tight">
          Bem-vindo de volta
        </h2>
        <p className="mt-1 text-xs text-muted">
          Entre com suas credenciais para continuar
        </p>
      </div>

      <form
        onSubmit={(event) => startTransition(() => void handleSubmit(event))}
        className="flex flex-col gap-4"
      >
        <Label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
          E-mail
          <span className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              className="pl-9"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              required
              disabled={pending}
            />
          </span>
        </Label>

        <Label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-wider">
          <span className="flex items-center justify-between">
            Senha
            <button
              className="text-[10px] normal-case tracking-normal text-accent hover:underline"
              disabled={pending}
              type="button"
            >
              Esqueceu a senha?
            </button>
          </span>
          <span className="relative">
            <Lock
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              className="pl-9 pr-10"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="********"
              required
              disabled={pending}
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
              onClick={() => setShowPassword((value) => !value)}
              disabled={pending}
              type="button"
            >
              {showPassword ? (
                <EyeOff className="size-3.5" aria-hidden="true" />
              ) : (
                <Eye className="size-3.5" aria-hidden="true" />
              )}
              <span className="sr-only">
                {showPassword ? "Ocultar senha" : "Mostrar senha"}
              </span>
            </button>
          </span>
        </Label>

        <Button className="mt-2 w-full" disabled={pending}>
          {pending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
          {pending ? "Entrando..." : "Entrar"}
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] text-muted">ou</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button className="w-full" type="button" variant="outline">
        Entrar com SSO corporativo
      </Button>

      <p className="text-center text-[10px] leading-5 text-muted">
        Ao entrar, voce concorda com os{" "}
        <span className="cursor-pointer text-accent hover:underline">
          Termos de Uso
        </span>{" "}
        e a{" "}
        <span className="cursor-pointer text-accent hover:underline">
          Politica de Privacidade
        </span>
        .
      </p>
    </div>
  );
}
