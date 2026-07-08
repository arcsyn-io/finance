import { redirect } from "next/navigation";
import { enrollTotp, challengeTotp, verifyEnrollment } from "@/auth/mfa-actions";
import { getPendingTotpEnrollment } from "@/auth/mfa-enrollment";
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
      <section className="w-full max-w-md rounded-lg border border-border bg-panel p-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-accent">
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
          <form action={verifyEnrollment} className="mt-6 space-y-4">
            <div className="rounded-md border border-border bg-background p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="QR Code para configurar MFA"
                className="mx-auto h-48 w-48 bg-white p-2"
                src={pendingEnrollment.qrCode}
              />
              <p className="mt-4 break-all text-xs text-muted">
                {pendingEnrollment.secret}
              </p>
            </div>

            <label className="block text-sm">
              <span className="text-muted">Codigo de 6 digitos</span>
              <input
                className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                inputMode="numeric"
                maxLength={6}
                name="code"
                required
              />
            </label>

            <button className="h-10 w-full rounded-md bg-accent px-4 text-sm font-semibold text-background transition hover:brightness-110">
              Ativar MFA
            </button>
          </form>
        ) : firstTotpFactor ? (
          <form action={challengeTotp} className="mt-6 space-y-4">
            <input type="hidden" name="factorId" value={firstTotpFactor.id} />
            <label className="block text-sm">
              <span className="text-muted">Codigo de 6 digitos</span>
              <input
                className="mt-2 h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                inputMode="numeric"
                maxLength={6}
                name="code"
                required
              />
            </label>
            <button className="h-10 w-full rounded-md bg-accent px-4 text-sm font-semibold text-background transition hover:brightness-110">
              Verificar
            </button>
          </form>
        ) : (
          <form action={enrollTotp} className="mt-6">
            <button className="h-10 w-full rounded-md bg-accent px-4 text-sm font-semibold text-background transition hover:brightness-110">
              Configurar app autenticador
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
