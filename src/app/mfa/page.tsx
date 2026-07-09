import { redirect } from "next/navigation";
import { getPendingTotpEnrollment } from "@/auth/mfa-enrollment";
import {
  ChallengeTotpForm,
  EnrollTotpForm,
  VerifyEnrollmentForm,
} from "@/auth/mfa-forms";
import { getMfaState } from "@/auth/mfa";
import { getCurrentUser } from "@/auth/user";

export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  enroll_failed:
    "Nao foi possivel iniciar o cadastro do MFA. Confira se TOTP esta habilitado no Supabase.",
  challenge_failed:
    "Nao foi possivel gerar o desafio do autenticador. Tente novamente.",
  enrollment_expired:
    "A configuracao expirou. Inicie o cadastro do autenticador novamente.",
  invalid_code: "Codigo invalido ou expirado. Confira o horario do dispositivo e tente novamente.",
};

export default async function MfaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const state = await getMfaState();

  if (!state.needsMfa) {
    redirect("/");
  }

  const error = typeof params.error === "string" ? params.error : null;
  const mode = typeof params.mode === "string" ? params.mode : null;
  const pendingEnrollment = await getPendingTotpEnrollment();
  const firstTotpFactor = state.verifiedTotpFactors[0];

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <section className="w-full max-w-md rounded-md border border-border bg-panel p-6 shadow-2xl shadow-black/20">
        <div>
          <p className="text-xs font-bold uppercase text-accent">
            Finance
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Verificacao em duas etapas</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            Confirme um codigo do app autenticador para acessar seus dados financeiros.
          </p>
        </div>

        {error ? (
          <p className="mt-5 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {errorMessages[error] ?? "Nao foi possivel validar o MFA. Tente novamente."}
          </p>
        ) : null}

        {mode === "enroll" && pendingEnrollment ? (
          <VerifyEnrollmentForm secret={pendingEnrollment.secret} />
        ) : firstTotpFactor ? (
          <ChallengeTotpForm factorId={firstTotpFactor.id} />
        ) : (
          <EnrollTotpForm />
        )}
      </section>
    </main>
  );
}
