import { ClearAuthFragment } from "@/app/login/clear-auth-fragment";
import { LoginForm } from "@/auth/login-form";
import { BarChart3, CircleDot, FolderTree, ShieldCheck, Sparkles } from "lucide-react";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen bg-background text-foreground">
      <ClearAuthFragment />
      <section className="relative hidden flex-[2] flex-col justify-between overflow-hidden border-r border-border p-12 lg:flex">
        <div className="pointer-events-none absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-positive/10 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-accent/15 text-accent">
            <FolderTree className="size-4" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold">Finance</span>
        </div>

        <div className="relative flex max-w-xl flex-col gap-6">
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent">
            <CircleDot className="size-2.5" aria-hidden="true" />
            Plataforma financeira
          </span>
          <h1 className="text-5xl font-bold leading-tight tracking-tight">
            Visibilidade total sobre seu caixa
          </h1>
          <p className="text-sm leading-6 text-muted">
            Centralize fluxo de caixa, liquidez real e patrimonio liquido em
            uma unica plataforma para decidir com clareza mes a mes.
          </p>

          <div className="mt-2 flex flex-col gap-3">
            {[
              { icon: BarChart3, text: "Analise mensal de entradas e saidas" },
              { icon: ShieldCheck, text: "Alertas de risco e consistencia" },
              { icon: Sparkles, text: "Relatorios prontos para revisao" },
            ].map(({ icon: Icon, text }) => (
              <div className="flex items-center gap-3" key={text}>
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-accent/15 text-accent">
                  <Icon className="size-3" aria-hidden="true" />
                </div>
                <span className="text-xs text-muted">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-[10px] italic text-muted/70">
          Controle financeiro para crescer com responsabilidade.
        </p>
      </section>
      <section className="flex flex-1 items-center justify-center px-6 py-12">
        <LoginForm />
      </section>
    </main>
  );
}
