"use client";

import { FormEvent } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePendingRequest } from "@/hooks/use-pending-request";

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
  const { isPending, run } = usePendingRequest();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run(async () => {
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
    });
  }

  return (
    <form
      aria-busy={isPending}
      onSubmit={(event) => void handleSubmit(event)}
      className="mt-6"
    >
      <Button
        className="w-full"
        disabled={isPending}
      >
        {isPending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
        {isPending ? "Configurando..." : "Configurar app autenticador"}
      </Button>
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
  const { isPending, run } = usePendingRequest();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    await run(async () => {
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
    });
  }

  return (
    <form
      aria-busy={isPending}
      onSubmit={(event) => void handleSubmit(event)}
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

      <Label className="block text-sm">
        Codigo de 6 digitos
        <Input
          className="mt-2"
          inputMode="numeric"
          maxLength={6}
          name="code"
          required
          disabled={isPending}
        />
      </Label>

      <Button
        className="w-full"
        disabled={isPending}
      >
        {isPending ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
        {isPending ? "Verificando..." : buttonLabel}
      </Button>
    </form>
  );
}
