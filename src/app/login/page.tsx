import { ClearAuthFragment } from "@/app/login/clear-auth-fragment";
import { LoginForm } from "@/auth/login-form";
import {
  BarChart3,
  CircleDot,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const features = [
  { icon: BarChart3, text: "Analise mensal de entradas e saidas" },
  { icon: ShieldCheck, text: "Alertas de risco e insustentabilidade" },
  { icon: Sparkles, text: "Relatorios exportaveis em segundos" },
];

export default function LoginPage() {
  return (
    <main className="login-shell flex min-h-screen text-foreground">
      <ClearAuthFragment />
      <section className="login-hero-panel relative hidden flex-[2] flex-col justify-between overflow-hidden border-r border-border p-12 lg:flex">
        <div className="relative flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-md bg-accent/20 text-accent">
            <LayoutGrid className="size-4" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold">Finance</span>
        </div>

        <div className="relative flex max-w-[610px] flex-col gap-6">
          <span className="flex w-fit items-center gap-1.5 rounded-full border border-accent/35 bg-accent/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-accent">
            <CircleDot className="size-2.5" aria-hidden="true" />
            Plataforma Financeira
          </span>
          <h1 className="text-[52px] font-bold leading-[1.22] tracking-tight">
            Visibilidade total sobre seu caixa
          </h1>
          <p className="text-sm leading-relaxed text-muted">
            Finance centraliza fluxo de caixa, projecoes e composicao de
            despesas em uma unica plataforma para que sua equipe tome decisoes
            com clareza e seguranca, mes a mes.
          </p>

          <div className="mt-2 flex flex-col gap-3">
            {features.map(({ icon: Icon, text }) => (
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
          Controle financeiro inteligente para empresas que crescem com
          responsabilidade.
        </p>
      </section>
      <section className="flex flex-1 items-center justify-center px-8 py-12">
        <LoginForm />
      </section>
    </main>
  );
}
