"use client";

import { FormEvent, useTransition } from "react";
import { useRouter } from "next/navigation";

type MfaApiResponse = {
  readonly redirectTo?: string;
  readonly error?: string;
};

export function VerifyEnrollmentForm({ secret }: { readonly secret: string }) {
  return (
    <MfaCodeForm
      action="/api/mfa/verify-enrollment"
      buttonLabel="Ativar MFA"
      secret={secret}
    />
  );
}

export function ChallengeTotpForm({
  factorId,
}: {
  readonly factorId: string;
}) {
  return (
    <MfaCodeForm
      action="/api/mfa/challenge"
      buttonLabel="Verificar"
      factorId={factorId}
    />
  );
}

export function EnrollTotpForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch("/api/mfa/enroll", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const body = (await response.json()) as MfaApiResponse;

    router.push(body.redirectTo ?? "/mfa?error=enroll_failed");
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => startTransition(() => void handleSubmit(event))}
      className="mt-6"
    >
      <button
        className="h-10 w-full rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
      >
        Configurar app autenticador
      </button>
    </form>
  );
}

function MfaCodeForm({
  action,
  buttonLabel,
  factorId,
  secret,
}: {
  readonly action: string;
  readonly buttonLabel: string;
  readonly factorId?: string;
  readonly secret?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await fetch(action, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        factorId,
        code: String(formData.get("code") ?? ""),
      }),
    });
    const body = (await response.json()) as MfaApiResponse;

    router.push(body.redirectTo ?? "/mfa?error=invalid_code");
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => startTransition(() => void handleSubmit(event))}
      className="mt-6 space-y-4"
    >
      {secret ? (
        <div className="rounded-md border border-border bg-background p-4">
          <p className="text-sm font-medium text-foreground">
            Chave para configuracao manual
          </p>
          <p className="mt-3 break-all rounded-md border border-border bg-panel p-3 font-mono text-sm text-muted">
            {secret}
          </p>
        </div>
      ) : null}

      <label className="block text-sm">
        <span className="text-muted">Codigo de 6 digitos</span>
        <input
          className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-accent focus:shadow-[0_0_0_3px_rgba(14,165,233,0.18)]"
          inputMode="numeric"
          maxLength={6}
          name="code"
          required
        />
      </label>

      <button
        className="h-10 w-full rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
      >
        {buttonLabel}
      </button>
    </form>
  );
}
