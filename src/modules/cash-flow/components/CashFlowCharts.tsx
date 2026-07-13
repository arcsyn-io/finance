import { Fragment } from "react";
import type { AnnualCashFlowViewModel } from "@/modules/cash-flow/view-models/cash-flow-view-model";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatMoney, formatSignedMoney } from "@/modules/cash-flow/components/CashFlowMoneyCell";

type CashFlowChartsProps = {
  readonly report: AnnualCashFlowViewModel;
};

type ChartPoint = {
  readonly label: string;
  readonly valueInCents: number;
};

export function CashFlowCharts({ report }: CashFlowChartsProps) {
  const receipts = report.months.map((month) => ({
    label: formatMonth(month.referenceMonth),
    valueInCents: month.receiptsCents,
  }));
  const expenses = report.months.map((month) => ({
    label: formatMonth(month.referenceMonth),
    valueInCents: month.expensesCents,
  }));
  const netCashFlow = report.months.map((month) => ({
    label: formatMonth(month.referenceMonth),
    valueInCents: month.netCashFlowCents,
  }));
  const surplus = report.months.map((month) => ({
    label: formatMonth(month.referenceMonth),
    valueInCents: month.surplusOrDeficitCents,
  }));

  return (
    <section aria-label="Gráficos mensais" className="grid gap-3 xl:grid-cols-3">
      <ChartCard
        description={`${formatMoney(sum(receipts))} recebidos · ${formatMoney(sum(expenses))} gastos`}
        title="Receitas x despesas"
      >
        <AreaLineChart
          ariaLabel="Comparação mensal entre receitas e despesas"
          series={[
            {
              color: "hsl(var(--positive))",
              id: "cash-flow-receipts",
              label: "Receitas",
              points: receipts,
            },
            {
              color: "hsl(var(--negative))",
              id: "cash-flow-expenses",
              label: "Despesas",
              points: expenses,
            },
          ]}
        />
      </ChartCard>
      <ChartCard description={rangeDescription(netCashFlow)} title="Fluxo líquido">
        <AreaLineChart
          ariaLabel="Fluxo de caixa líquido mensal"
          series={[
            {
              color: "hsl(var(--positive))",
              id: "cash-flow-net",
              label: "Fluxo líquido",
              negativeColor: "hsl(var(--negative))",
              points: netCashFlow,
            },
          ]}
        />
      </ChartCard>
      <ChartCard description={rangeDescription(surplus)} title="Excedente / resgate">
        <AreaLineChart
          ariaLabel="Excedente ou necessidade de resgate mensal"
          series={[
            {
              color: "hsl(var(--warning))",
              id: "cash-flow-surplus",
              label: "Excedente / resgate",
              negativeColor: "hsl(var(--negative))",
              points: surplus,
            },
          ]}
        />
      </ChartCard>
    </section>
  );
}

function ChartCard({
  children,
  description,
  title,
}: {
  readonly children: React.ReactNode;
  readonly description: string;
  readonly title: string;
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="gap-1 border-b-0 pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="truncate" title={description}>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-3">{children}</CardContent>
    </Card>
  );
}

type AreaSeries = {
  readonly color: string;
  readonly id: string;
  readonly label: string;
  readonly negativeColor?: string;
  readonly points: readonly ChartPoint[];
};

type SvgPoint = {
  readonly x: number;
  readonly y: number;
};

const CHART_WIDTH = 360;
const CHART_HEIGHT = 210;
const CHART_MARGIN = { top: 12, right: 10, bottom: 30, left: 38 } as const;

function AreaLineChart({
  ariaLabel,
  series,
}: {
  readonly ariaLabel: string;
  readonly series: readonly AreaSeries[];
}) {
  const values = series.flatMap((item) =>
    item.points.map((point) => point.valueInCents),
  );
  const rawMinimum = Math.min(0, ...values);
  const rawMaximum = Math.max(0, ...values);
  const magnitude = Math.max(1, rawMaximum - rawMinimum);
  const padding = magnitude * 0.08;
  const minimum = rawMinimum < 0 ? rawMinimum - padding : 0;
  const maximum = rawMaximum > 0 ? rawMaximum + padding : padding;
  const plotWidth = CHART_WIDTH - CHART_MARGIN.left - CHART_MARGIN.right;
  const plotHeight = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const zeroY = valueToY(0, minimum, maximum, plotHeight);
  const labels = series[0]?.points ?? [];
  const ticks = Array.from({ length: 5 }, (_, index) =>
    minimum + ((maximum - minimum) * index) / 4,
  ).reverse();

  return (
    <div aria-label={ariaLabel} role="img">
      <svg
        aria-hidden="true"
        className="h-auto min-h-48 w-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      >
        <defs>
          {series.map((item) => {
            const zeroOffset = Math.max(
              0,
              Math.min(100, (zeroY / plotHeight) * 100),
            );
            const negativeColor = item.negativeColor ?? item.color;
            return (
              <Fragment key={item.id}>
                <linearGradient id={`${item.id}-line`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset={`${zeroOffset}%`} stopColor={item.color} />
                  <stop offset={`${zeroOffset}%`} stopColor={negativeColor} />
                </linearGradient>
                <linearGradient id={`${item.id}-area`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={item.color} stopOpacity="0.3" />
                  <stop offset={`${zeroOffset}%`} stopColor={item.color} stopOpacity="0.12" />
                  <stop offset={`${zeroOffset}%`} stopColor={negativeColor} stopOpacity="0.16" />
                  <stop offset="100%" stopColor={negativeColor} stopOpacity="0.32" />
                </linearGradient>
              </Fragment>
            );
          })}
        </defs>

        {ticks.map((tick) => {
          const y = CHART_MARGIN.top + valueToY(tick, minimum, maximum, plotHeight);
          return (
            <g key={tick}>
              <line
                stroke="hsl(var(--border))"
                strokeOpacity="0.75"
                x1={CHART_MARGIN.left}
                x2={CHART_WIDTH - CHART_MARGIN.right}
                y1={y}
                y2={y}
              />
              <text
                fill="hsl(var(--muted))"
                fontSize="8"
                textAnchor="end"
                x={CHART_MARGIN.left - 6}
                y={y + 3}
              >
                {formatCompactValue(tick)}
              </text>
            </g>
          );
        })}

        {labels.map((point, index) => {
          const x = CHART_MARGIN.left + pointX(index, labels.length, plotWidth);
          return (
            <g key={point.label}>
              <line
                stroke="hsl(var(--border))"
                strokeOpacity="0.45"
                x1={x}
                x2={x}
                y1={CHART_MARGIN.top}
                y2={CHART_MARGIN.top + plotHeight}
              />
              <text
                fill="hsl(var(--muted))"
                fontSize="8"
                textAnchor="middle"
                x={x}
                y={CHART_HEIGHT - 9}
              >
                {point.label}
              </text>
            </g>
          );
        })}

        {minimum < 0 ? (
          <line
            stroke="hsl(var(--muted))"
            strokeDasharray="3 3"
            strokeOpacity="0.75"
            x1={CHART_MARGIN.left}
            x2={CHART_WIDTH - CHART_MARGIN.right}
            y1={CHART_MARGIN.top + zeroY}
            y2={CHART_MARGIN.top + zeroY}
          />
        ) : null}

        {series.map((item) => {
          const coordinates = item.points.map<SvgPoint>((point, index) => ({
            x: CHART_MARGIN.left + pointX(index, item.points.length, plotWidth),
            y:
              CHART_MARGIN.top +
              valueToY(point.valueInCents, minimum, maximum, plotHeight),
          }));
          const linePath = smoothPath(coordinates);
          const baseline = CHART_MARGIN.top + zeroY;
          const areaPath = coordinates.length
            ? `${linePath} L ${coordinates.at(-1)?.x ?? 0} ${baseline} L ${coordinates[0].x} ${baseline} Z`
            : "";

          return (
            <g key={item.id}>
              <path d={areaPath} fill={`url(#${item.id}-area)`} />
              <path
                d={linePath}
                fill="none"
                stroke={`url(#${item.id}-line)`}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
              />
            </g>
          );
        })}

        {series.map((item) => {
          const coordinates = item.points.map<SvgPoint>((point, index) => ({
            x: CHART_MARGIN.left + pointX(index, item.points.length, plotWidth),
            y:
              CHART_MARGIN.top +
              valueToY(point.valueInCents, minimum, maximum, plotHeight),
          }));

          return coordinates.map((coordinate, index) => {
            const point = item.points[index];
            const tooltip = tooltipPosition(coordinate);
            const pointColor =
              point.valueInCents < 0
                ? item.negativeColor ?? item.color
                : item.color;

            return (
              <g
                aria-label={`${item.label} em ${point.label}: ${formatMoney(point.valueInCents)}`}
                className="group cursor-crosshair outline-none"
                key={`${item.id}-${point.label}`}
                tabIndex={0}
              >
                <circle
                  cx={coordinate.x}
                  cy={coordinate.y}
                  fill="transparent"
                  r="8"
                />
                <circle
                  cx={coordinate.x}
                  cy={coordinate.y}
                  fill="hsl(var(--panel))"
                  r="2.7"
                  stroke={pointColor}
                  strokeWidth="1.8"
                />
                <g className="pointer-events-none opacity-0 transition-opacity duration-150 group-focus:opacity-100 group-hover:opacity-100">
                  <rect
                    fill="hsl(var(--surface-elevated))"
                    height="32"
                    rx="5"
                    stroke="hsl(var(--border))"
                    width="112"
                    x={tooltip.x}
                    y={tooltip.y}
                  />
                  <circle
                    cx={tooltip.x + 9}
                    cy={tooltip.y + 10}
                    fill={pointColor}
                    r="2.5"
                  />
                  <text
                    fill="hsl(var(--muted))"
                    fontSize="7.5"
                    x={tooltip.x + 15}
                    y={tooltip.y + 12.5}
                  >
                    {`${item.label} · ${point.label}`}
                  </text>
                  <text
                    fill="hsl(var(--foreground))"
                    fontSize="9"
                    fontWeight="600"
                    x={tooltip.x + 8}
                    y={tooltip.y + 25}
                  >
                    {formatSignedMoney(point.valueInCents)}
                  </text>
                </g>
              </g>
            );
          });
        })}
      </svg>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-4 text-[10px] text-muted">
        {series.map((item) => (
          <span className="inline-flex items-center gap-1.5" key={item.id}>
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function pointX(index: number, length: number, width: number): number {
  return length <= 1 ? width / 2 : (index / (length - 1)) * width;
}

function valueToY(
  value: number,
  minimum: number,
  maximum: number,
  height: number,
): number {
  return ((maximum - value) / (maximum - minimum)) * height;
}

function smoothPath(points: readonly SvgPoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const following = points[index + 2] ?? next;
    const controlOneX = current.x + (next.x - previous.x) / 6;
    const controlOneY = current.y + (next.y - previous.y) / 6;
    const controlTwoX = next.x - (following.x - current.x) / 6;
    const controlTwoY = next.y - (following.y - current.y) / 6;
    path += ` C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${next.x} ${next.y}`;
  }
  return path;
}

function tooltipPosition(point: SvgPoint): { readonly x: number; readonly y: number } {
  const width = 112;
  const height = 32;
  const x = Math.max(2, Math.min(CHART_WIDTH - width - 2, point.x - width / 2));
  const y =
    point.y - height - 9 >= 2
      ? point.y - height - 9
      : Math.min(CHART_HEIGHT - height - 2, point.y + 9);
  return { x, y };
}

function formatCompactValue(valueInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(valueInCents / 100);
}

function sum(points: readonly ChartPoint[]): number {
  return points.reduce((total, point) => total + point.valueInCents, 0);
}

function rangeDescription(points: readonly ChartPoint[]): string {
  const values = points.map((point) => point.valueInCents);
  const minimum = Math.min(0, ...values);
  const maximum = Math.max(0, ...values);
  return `Faixa mensal: ${formatSignedMoney(minimum)} a ${formatSignedMoney(maximum)}`;
}

function formatMonth(referenceMonth: string): string {
  const month = Number(referenceMonth.slice(5, 7));
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(2024, month - 1, 1)))
    .replace(".", "");
}
