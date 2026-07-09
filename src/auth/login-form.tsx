"use client";

import { FormEvent, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <Card className="w-full max-w-sm shadow-2xl shadow-black/20">
      <CardHeader className="border-b-0 pb-0">
        <p className="text-xs font-bold uppercase text-accent">
          Finance
        </p>
        <CardTitle className="mt-2 text-2xl">Entrar</CardTitle>
        <p className="mt-3 text-sm leading-6 text-muted">
          Acesse seu painel financeiro com MFA obrigatorio.
        </p>
      </CardHeader>
      <CardContent>
    <form
      onSubmit={(event) => startTransition(() => void handleSubmit(event))}
    >

      <Label className="mt-6 block text-sm">
        E-mail
        <Input
          className="mt-2"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </Label>

      <Label className="mt-4 block text-sm">
        Senha
        <Input
          className="mt-2"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Label>

      <Button
        className="mt-6 w-full"
        disabled={pending}
      >
        Entrar
      </Button>
    </form>
      </CardContent>
    </Card>
  );
}
