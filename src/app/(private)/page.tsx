import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowDownToLine,
  Plus,
  SlidersHorizontal,
  Tags,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const metrics = [
  {
    label: "Recebimentos no ano",
    value: "R$ 2.319.000",
    detail: "Entradas operacionais recorrentes",
  },
  {
    label: "Despesas no ano",
    value: "R$ 2.021.000",
    detail: "Saidas operacionais e compromissos",
  },
  {
    label: "Fluxo acumulado",
    value: "+R$ 298.000",
    detail: "Excedente antes de decisoes patrimoniais",
    tone: "positive",
  },
  {
    label: "Saldo final",
    value: "R$ 443.000",
    detail: "Liquidez projetada para dezembro",
  },
];

const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago"];

const monthlyData = [
  { month: "Jan", income: 82, expense: 70, flow: 44, decision: 38 },
  { month: "Fev", income: 74, expense: 78, flow: -12, decision: 20 },
  { month: "Mar", income: 92, expense: 66, flow: 68, decision: 46 },
  { month: "Abr", income: 87, expense: 63, flow: 64, decision: 44 },
  { month: "Mai", income: 79, expense: 65, flow: 35, decision: 34 },
  { month: "Jun", income: 68, expense: 74, flow: -18, decision: 18 },
  { month: "Jul", income: 67, expense: 68, flow: -28, decision: 26 },
  { month: "Ago", income: 84, expense: 66, flow: 48, decision: 40 },
];

const matrixRows = [
  {
    label: "Recebimentos",
    values: ["R$ 182k", "R$ 165k", "R$ 205k", "R$ 194k", "R$ 176k", "R$ 150k", "R$ 149k", "R$ 187k"],
  },
  {
    label: "Despesas",
    values: ["R$ 164k", "R$ 171k", "R$ 155k", "R$ 149k", "R$ 152k", "R$ 174k", "R$ 160k", "R$ 155k"],
    tone: "text-negative",
  },
  {
    label: "Fluxo liquido",
    values: ["R$ 15k", "-R$ 3k", "R$ 47k", "R$ 45k", "R$ 24k", "-R$ 6k", "-R$ 16k", "R$ 19k"],
    decision: true,
  },
  {
    label: "Saldo final",
    values: ["R$ 165k", "R$ 162k", "R$ 209k", "R$ 254k", "R$ 278k", "R$ 272k", "R$ 256k", "R$ 275k"],
    decision: true,
    tone: "text-positive",
  },
  {
    label: "Excedente / Resgate",
    values: ["R$ 15k", "-R$ 3k", "R$ 47k", "R$ 45k", "R$ 24k", "-R$ 6k", "-R$ 16k", "R$ 19k"],
    decision: true,
  },
];

export default function Home() {
  return (
    <div className="flex w-full flex-col gap-5 lg:gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Fluxo de caixa mensal
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
            Analise da sustentabilidade mensal considerando recebimentos,
            despesas operacionais e necessidade de resgate ou excedente.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/categories">
              <Tags aria-hidden="true" />
              Categorias
            </Link>
          </Button>
          <Button>
            <Plus aria-hidden="true" />
            Novo lancamento
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-3.5 text-muted" aria-hidden="true" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              Filtros
            </span>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            {["Ano", "Carteira", "Natureza", "Comparacao"].map((label) => (
              <Label className="grid min-w-32 gap-1" key={label}>
                <span className="text-[10px] uppercase tracking-wider">{label}</span>
                <Select>
                  <option>
                    {label === "Ano"
                      ? "2026"
                      : label === "Carteira"
                        ? "Todas"
                        : label === "Natureza"
                          ? "Todas"
                          : "Nenhuma"}
                  </option>
                </Select>
              </Label>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card
            className={metric.tone === "positive" ? "border-positive/25 bg-positive/10" : ""}
            key={metric.label}
          >
            <CardContent className="p-4">
              <p className={`mb-2 text-[10px] uppercase tracking-wider ${metric.tone === "positive" ? "text-positive" : "text-muted"}`}>
                {metric.label}
              </p>
              <strong className={`block text-lg font-bold tabular-nums md:text-2xl ${metric.tone === "positive" ? "text-positive" : "text-foreground"}`}>
                {metric.value}
              </strong>
              <p className="mt-2 text-[11px] leading-5 text-muted">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Visao grafica</h2>
        <div className="grid gap-3 lg:grid-cols-3">
          <ChartPanel
            description="Comparativo mensal de entradas e saidas"
            title="Receitas x despesas"
          >
            <GroupedBars />
          </ChartPanel>
          <ChartPanel
            badge={<Badge variant="success">Positivo no ano</Badge>}
            description="Linha operacional antes das decisoes patrimoniais"
            title="Fluxo liquido"
          >
            <FlowBars />
          </ChartPanel>
          <ChartPanel
            badge={<Badge variant="warning">Jul exige revisao</Badge>}
            description="Quando ha excedente ou necessidade de resgate"
            title="Excedente / resgate"
          >
            <DecisionBars />
          </ChartPanel>
        </div>
      </section>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Matriz mensal</CardTitle>
            <CardDescription className="mt-1">
              Separacao entre fluxo operacional, liquidez real e excedente.
            </CardDescription>
          </div>
          <Button size="sm" variant="outline">
            <ArrowDownToLine aria-hidden="true" />
            Exportar
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 bg-panel px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Linha
                </th>
                {months.map((month) => (
                  <th
                    className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted"
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
                  <td className="sticky left-0 border-t border-border bg-panel px-4 py-3 text-left text-xs">
                    {row.label}
                  </td>
                  {row.values.map((value, index) => (
                    <td
                      className={`border-t border-border px-4 py-3 text-right text-xs ${row.tone ?? (value.startsWith("-") ? "text-negative" : "text-foreground")}`}
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
      </Card>
    </div>
  );
}

function ChartPanel({
  badge,
  children,
  description,
  title,
}: {
  readonly badge?: ReactNode;
  readonly children: ReactNode;
  readonly description: string;
  readonly title: string;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 border-b-0 pb-0">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription className="mt-0.5">{description}</CardDescription>
        </div>
        {badge}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function GroupedBars() {
  return (
    <div>
      <div className="grid min-h-[200px] grid-cols-8 items-end gap-2 border-b border-border pt-2">
        {monthlyData.map((item) => (
          <div className="grid h-44 grid-cols-2 items-end gap-1" key={item.month}>
            <span className="rounded-t-sm bg-accent/75" style={{ height: `${item.income}%` }} />
            <span className="rounded-t-sm bg-muted/45" style={{ height: `${item.expense}%` }} />
          </div>
        ))}
      </div>
      <ChartLabels />
    </div>
  );
}

function FlowBars() {
  return (
    <div>
      <div className="grid min-h-[200px] grid-cols-8 items-center gap-2 border-b border-border pt-2">
        {monthlyData.map((item) => (
          <div className="flex h-44 items-center" key={item.month}>
            <span
              className={`w-full rounded-sm ${item.flow < 0 ? "bg-negative" : "bg-accent"}`}
              style={{
                height: `${Math.max(Math.abs(item.flow), 10)}%`,
                transform: item.flow < 0 ? "translateY(42%)" : "translateY(-18%)",
              }}
            />
          </div>
        ))}
      </div>
      <ChartLabels />
    </div>
  );
}

function DecisionBars() {
  return (
    <div>
      <div className="grid min-h-[200px] grid-cols-8 items-end gap-2 border-b border-border pt-2">
        {monthlyData.map((item) => (
          <span
            className={`rounded-t-sm ${item.flow < 0 ? "bg-negative" : "bg-positive/80"}`}
            key={item.month}
            style={{ height: `${Math.max(item.decision, 12)}%` }}
          />
        ))}
      </div>
      <ChartLabels />
    </div>
  );
}

function ChartLabels() {
  return (
    <div className="grid grid-cols-8 gap-2 pt-2 text-center text-[10px] text-muted">
      {monthlyData.map((item) => (
        <span key={item.month}>{item.month}</span>
      ))}
    </div>
  );
}
