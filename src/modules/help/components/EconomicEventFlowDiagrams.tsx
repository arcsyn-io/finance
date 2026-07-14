import { ArrowDown, ArrowRight, CheckCircle2 } from "lucide-react";
import { economicEventFlowGuides } from "@/modules/help/view-models/economic-event-flow-guides";

export function EconomicEventFlowDiagrams() {
  return (
    <section aria-labelledby="economic-event-diagrams-title" className="space-y-4">
      <div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-accent">
          Em prática
        </span>
        <h2 className="mt-1 text-base font-semibold" id="economic-event-diagrams-title">
          Diagramas de classificação e eventos econômicos
        </h2>
        <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
          Siga o fluxo de cada cenário para entender quais campos preencher e como o lançamento aparece nas análises.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {economicEventFlowGuides.map((guide) => (
          <article className="rounded-xl border border-border bg-panel p-5" key={guide.id}>
            <h3 className="text-sm font-semibold">{guide.title}</h3>
            <p className="mt-1 text-xs leading-5 text-muted">{guide.scenario}</p>

            <ol className="mt-4 flex flex-col gap-2 md:flex-row md:items-stretch md:gap-1">
              {guide.steps.map((step, index) => (
                <li className="flex min-w-0 flex-1 flex-col items-center md:flex-row" key={step.label}>
                  <div className="w-full rounded-lg border border-border bg-surface/70 p-3 text-center">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">
                      {index + 1}. {step.label}
                    </span>
                    <p className="mt-1 text-xs font-medium leading-4 text-foreground">
                      {step.detail}
                    </p>
                  </div>
                  {index < guide.steps.length - 1 ? (
                    <span className="flex shrink-0 items-center justify-center py-1 text-subtle md:px-1 md:py-0" aria-hidden="true">
                      <ArrowDown className="size-3 md:hidden" />
                      <ArrowRight className="hidden size-3 md:block" />
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>

            <p className="mt-4 flex gap-2 rounded-lg bg-accent/10 p-3 text-xs leading-5 text-foreground">
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-accent" aria-hidden="true" />
              <span>{guide.conclusion}</span>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
