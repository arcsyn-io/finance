import Link from "next/link";
import { ArrowDownToLine, Plus, Tags } from "lucide-react";

const metrics = [
  {
    label: "Recebimentos",
    value: "R$ 59.750",
    detail: "Acumulado operacional em 2026",
    tone: "text-positive",
  },
  {
    label: "Despesas",
    value: "-R$ 48.840",
    detail: "Consumo e compromissos recorrentes",
    tone: "text-negative",
  },
  {
    label: "Fluxo liquido",
    value: "R$ 10.910",
    detail: "Excedente antes de decisoes patrimoniais",
    tone: "text-accent",
  },
  {
    label: "Liquidez real",
    value: "R$ 23.310",
    detail: "Saldo final acima do caixa minimo",
    tone: "text-asset",
  },
];

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];

const matrixRows = [
  {
    label: "Recebimentos",
    values: ["R$ 9.820", "R$ 9.420", "R$ 10.050", "R$ 10.300", "R$ 9.360", "R$ 10.800"],
  },
  {
    label: "Despesas",
    values: ["-R$ 7.120", "-R$ 8.430", "-R$ 7.300", "-R$ 8.050", "-R$ 10.180", "-R$ 7.760"],
    tone: "text-negative",
  },
  {
    label: "Fluxo liquido",
    values: ["R$ 2.700", "R$ 990", "R$ 2.750", "R$ 2.250", "-R$ 820", "R$ 3.040"],
    decision: true,
  },
  {
    label: "Saldo final",
    values: ["R$ 15.100", "R$ 16.090", "R$ 18.840", "R$ 21.090", "R$ 20.270", "R$ 23.310"],
    decision: true,
    tone: "text-positive",
  },
  {
    label: "Excedente / Resgate",
    values: ["R$ 6.100", "R$ 7.090", "R$ 9.840", "R$ 12.090", "R$ 820", "R$ 14.310"],
    decision: true,
  },
];

export default function Home() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-accent">
            Analise operacional
          </p>
          <h1 className="mt-2 text-3xl font-semibold leading-tight sm:text-4xl">
            Fluxo de caixa mensal
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
            Acompanhe recebimentos, despesas, liquidez e patrimonio sem misturar
            as dimensoes financeiras do dominio.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-foreground transition hover:border-accent"
            href="/categories"
          >
            <Tags className="h-4 w-4" aria-hidden="true" />
            Categorias
          </Link>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-accent-foreground transition hover:brightness-110">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo lancamento
          </button>
        </div>
      </header>

      <section
        className="grid gap-3 rounded-md border border-border bg-surface p-3 md:grid-cols-4"
        aria-label="Filtros"
      >
        {["Ano", "Carteira", "Natureza", "Modo"].map((label) => (
          <label className="grid gap-2 text-xs text-muted" key={label}>
            {label}
            <select className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:border-accent">
              <option>
                {label === "Ano"
                  ? "2026"
                  : label === "Carteira"
                    ? "Todas as carteiras"
                    : label === "Natureza"
                      ? "Operacional"
                      : "Mensal"}
              </option>
            </select>
          </label>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            className="rounded-md border border-border bg-panel p-4"
            key={metric.label}
          >
            <p className="text-sm text-muted">{metric.label}</p>
            <strong className={`mt-3 block text-2xl font-semibold ${metric.tone}`}>
              {metric.value}
            </strong>
            <p className="mt-3 text-sm leading-6 text-muted">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <ChartPanel title="Receitas x despesas" badge="Barras agrupadas">
          <GroupedBars />
        </ChartPanel>
        <ChartPanel title="Fluxo liquido" badge="Positivo no ano" badgeTone="success">
          <SingleBars />
        </ChartPanel>
        <ChartPanel title="Excedente / resgate" badge="Maio exige revisao" badgeTone="warning">
          <DecisionBars />
        </ChartPanel>
      </section>

      <section className="rounded-md border border-border bg-panel">
        <div className="flex flex-col gap-2 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Matriz mensal</h2>
            <p className="mt-1 text-sm text-muted">
              Separacao entre fluxo operacional, liquidez real e excedente.
            </p>
          </div>
          <button className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-foreground transition hover:border-accent">
            <ArrowDownToLine className="h-4 w-4" aria-hidden="true" />
            Exportar
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 bg-panel px-4 py-3 text-left text-xs font-bold text-muted">
                  Linha
                </th>
                {months.map((month) => (
                  <th
                    className="px-4 py-3 text-right text-xs font-bold text-muted"
                    key={month}
                  >
                    {month}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixRows.map((row) => (
                <tr
                  className={row.decision ? "bg-white/[0.025] font-semibold" : ""}
                  key={row.label}
                >
                  <td className="sticky left-0 border-t border-border bg-panel px-4 py-3 text-left text-sm">
                    {row.label}
                  </td>
                  {row.values.map((value, index) => (
                    <td
                      className={`border-t border-border px-4 py-3 text-right text-sm ${row.tone ?? (value.startsWith("-") ? "text-negative" : "text-foreground")}`}
                      key={`${row.label}-${months[index]}`}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ChartPanel({
  badge,
  badgeTone,
  children,
  title,
}: {
  readonly badge: string;
  readonly badgeTone?: "success" | "warning";
  readonly children: React.ReactNode;
  readonly title: string;
}) {
  const badgeClass =
    badgeTone === "success"
      ? "border-positive/40 bg-positive/10 text-emerald-100"
      : badgeTone === "warning"
        ? "border-warning/40 bg-warning/10 text-amber-100"
        : "border-border text-muted";

  return (
    <article className="rounded-md border border-border bg-panel">
      <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <span className={`rounded-full border px-2 py-1 text-xs font-bold ${badgeClass}`}>
          {badge}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </article>
  );
}

function GroupedBars() {
  const data = [
    [82, 70],
    [78, 75],
    [84, 72],
    [86, 80],
    [78, 88],
    [90, 71],
  ];

  return (
    <div>
      <div className="grid min-h-[210px] grid-cols-6 items-end gap-3 border-b border-border pt-2">
        {data.map(([income, expense], index) => (
          <div className="grid h-44 grid-cols-2 items-end gap-1" key={months[index]}>
            <span className="rounded-t bg-positive/75" style={{ height: `${income}%` }} />
            <span className="rounded-t bg-negative/75" style={{ height: `${expense}%` }} />
          </div>
        ))}
      </div>
      <ChartLabels />
    </div>
  );
}

function SingleBars() {
  const data = [48, 18, 52, 27, 34, 70];

  return (
    <div>
      <div className="grid min-h-[210px] grid-cols-6 items-end gap-3 border-b border-border pt-2">
        {data.map((height, index) => (
          <span
            className={`rounded-t ${index === 4 ? "bg-negative/80" : "bg-accent"}`}
            key={months[index]}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <ChartLabels />
    </div>
  );
}

function DecisionBars() {
  const data = [38, 20, 45, 28, 55, 68];

  return (
    <div>
      <div className="grid min-h-[210px] grid-cols-6 items-end gap-3 border-b border-border pt-2">
        {data.map((height, index) => (
          <span
            className={`rounded-t ${index === 4 ? "bg-warning" : "bg-positive/80"}`}
            key={months[index]}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <ChartLabels />
    </div>
  );
}

function ChartLabels() {
  return (
    <div className="grid grid-cols-6 gap-3 pt-2 text-center text-xs text-muted">
      {months.map((month) => (
        <span key={month}>{month}</span>
      ))}
    </div>
  );
}
