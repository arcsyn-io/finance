import {
  ArrowDownUp,
  BookOpen,
  CircleHelp,
  Landmark,
  WalletCards,
} from "lucide-react";
import {
  economicEventHelp,
  financialHelpSections,
} from "@/modules/help/view-models/financial-help-content";
import { EconomicEventFlowDiagrams } from "@/modules/help/components/EconomicEventFlowDiagrams";

const sectionIcons = {
  lancamentos: BookOpen,
  carteiras: WalletCards,
  categorias: ArrowDownUp,
  natureza: Landmark,
  eventos: CircleHelp,
};

export function FinancialHelp() {
  return (
    <div className="flex w-full flex-col gap-5 lg:gap-6">
      <header className="rounded-xl border border-accent/20 bg-[radial-gradient(circle_at_top_right,hsl(var(--accent)/0.16),transparent_42%),hsl(var(--panel))] p-5 sm:p-6">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">
          Central de ajuda
        </span>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Entenda suas transações financeiras
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Use este guia para registrar cada fato corretamente e entender seus
          efeitos no dinheiro disponível, no consumo e no patrimônio.
        </p>
      </header>

      <nav aria-label="Tópicos da ajuda" className="rounded-xl border border-border bg-panel p-3">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-subtle">
          Neste guia
        </p>
        <div className="grid gap-1 sm:grid-cols-2 xl:grid-cols-5">
          {financialHelpSections.map((section, index) => (
            <a
              className="rounded-lg px-2 py-2 text-xs text-muted transition hover:bg-surface-elevated hover:text-foreground"
              href={`#${section.id}`}
              key={section.id}
            >
              <span className="mr-2 text-accent">{index + 1}.</span>
              {section.title.split(":")[0]}
            </a>
          ))}
        </div>
      </nav>

      <section className="grid gap-4 xl:grid-cols-2" aria-label="Conceitos financeiros">
        {financialHelpSections.map((section) => {
          const Icon = sectionIcons[section.id];

          return (
            <article className="rounded-xl border border-border bg-panel p-5" id={section.id} key={section.id}>
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <Icon className="size-4" aria-hidden="true" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">{section.title}</h2>
                  <p className="mt-2 text-xs leading-5 text-muted">{section.description}</p>
                </div>
              </div>
              <ul className="mt-4 grid gap-2 border-t border-border pt-4 text-xs leading-5 text-muted">
                {section.bullets.map((bullet) => (
                  <li className="flex gap-2" key={bullet}>
                    <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </article>
          );
        })}
      </section>

      <EconomicEventFlowDiagrams />

      <section className="rounded-xl border border-border bg-panel p-5" id="eventos-economicos">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">
            Referência rápida
          </span>
          <h2 className="text-base font-semibold">Eventos econômicos disponíveis</h2>
          <p className="text-xs leading-5 text-muted">
            Escolha o evento que melhor descreve o fato; ele qualifica o lançamento sem substituir carteira, categoria ou natureza.
          </p>
        </div>
        <dl className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {economicEventHelp.map((event) => (
            <div className="rounded-lg border border-border bg-surface/60 p-3" key={event.id}>
              <dt className="text-xs font-medium text-foreground">{event.title}</dt>
              <dd className="mt-1 text-[11px] leading-4 text-muted">{event.description}</dd>
              <p className="mt-2 text-[11px] leading-4 text-foreground">
                <span className="font-medium text-accent">Exemplo: </span>
                {event.example}
              </p>
            </div>
          ))}
        </dl>
      </section>

      <aside className="rounded-xl border border-positive/25 bg-positive/10 px-4 py-3 text-xs leading-5 text-foreground">
        <strong>Regra prática:</strong> pergunte onde aconteceu (carteira), por que aconteceu (categoria), como afeta a leitura financeira (natureza) e qual fato ocorreu (evento econômico). A categoria determina a direção.
      </aside>
    </div>
  );
}
