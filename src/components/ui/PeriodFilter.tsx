"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Check, ChevronLeft, ChevronRight } from "lucide-react";

export type PeriodFilterPreset =
  | "today"
  | "current-month"
  | "current-quarter"
  | "current-semester"
  | "custom";

export type PeriodFilterRange = {
  readonly preset: PeriodFilterPreset;
  readonly startDate: string;
  readonly endDate: string;
};

type PeriodFilterProps = {
  readonly initialStartDate: string;
  readonly initialEndDate: string;
  readonly initialPreset?: PeriodFilterPreset;
  readonly onChange: (range: PeriodFilterRange) => void;
};

const presets: readonly {
  readonly id: PeriodFilterPreset;
  readonly label: string;
}[] = [
  { id: "today", label: "Hoje" },
  { id: "current-month", label: "Mes atual" },
  { id: "current-quarter", label: "Trimestre atual" },
  { id: "current-semester", label: "Semestre atual" },
  { id: "custom", label: "Personalizado" },
];

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Marco",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

const shortMonthNames = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

const weekDayNames = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"] as const;
const selectedRangeColor = "#5ea6cc";

export function PeriodFilter({
  initialEndDate,
  initialPreset = "current-month",
  initialStartDate,
  onChange,
}: PeriodFilterProps) {
  const [preset, setPreset] = useState<PeriodFilterPreset>(initialPreset);
  const [referenceDate, setReferenceDate] = useState(() =>
    parseDate(initialStartDate),
  );
  const [customStartDate, setCustomStartDate] = useState(initialStartDate);
  const [customEndDate, setCustomEndDate] = useState(initialEndDate);
  const [menuOpen, setMenuOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const canNavigate = preset !== "custom";

  useEffect(() => {
    function closeWhenOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
        setCalendarOpen(false);
      }
    }

    document.addEventListener("mousedown", closeWhenOutside);
    return () => document.removeEventListener("mousedown", closeWhenOutside);
  }, []);

  function emit(nextRange: PeriodFilterRange) {
    onChange(nextRange);
  }

  function selectPreset(nextPreset: PeriodFilterPreset) {
    setPreset(nextPreset);

    if (nextPreset === "custom") {
      setCalendarOpen(true);
      return;
    }

    const nextRange = rangeForPreset(nextPreset, referenceDate);
    setMenuOpen(false);
    setCalendarOpen(false);
    emit(nextRange);
  }

  function navigate(direction: 1 | -1) {
    if (!canNavigate) {
      return;
    }

    const nextReference = navigateReferenceDate(preset, referenceDate, direction);
    const nextRange = rangeForPreset(preset, nextReference);

    setReferenceDate(nextReference);
    emit(nextRange);
  }

  function handleCustomChange(startDate: string, endDate: string) {
    setCustomStartDate(startDate);
    setCustomEndDate(endDate);

    if (startDate && endDate) {
      setMenuOpen(false);
      setCalendarOpen(false);
      emit({
        preset: "custom",
        startDate,
        endDate,
      });
    }
  }

  return (
    <div className="relative flex items-center gap-1.5" ref={containerRef}>
      <button
        aria-label="Periodo anterior"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-panel text-muted transition hover:bg-surface-elevated hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
        disabled={!canNavigate}
        onClick={() => navigate(-1)}
        type="button"
      >
        <ChevronLeft className="size-3.5" aria-hidden="true" />
      </button>

      <button
        className="flex h-8 min-w-[180px] items-center justify-center gap-2 rounded-lg border border-border bg-panel px-3 text-xs font-semibold text-foreground shadow-sm transition hover:bg-surface-elevated focus:outline-none focus-visible:ring-1 focus-visible:ring-accent sm:min-w-[210px]"
        onClick={() => {
          setMenuOpen((current) => !current);
          setCalendarOpen(false);
        }}
        type="button"
      >
        <Calendar className="size-3.5 text-muted" aria-hidden="true" />
        {periodLabel(preset, referenceDate, customStartDate, customEndDate)}
      </button>

      <button
        aria-label="Proximo periodo"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-panel text-muted transition hover:bg-surface-elevated hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
        disabled={!canNavigate}
        onClick={() => navigate(1)}
        type="button"
      >
        <ChevronRight className="size-3.5" aria-hidden="true" />
      </button>

      {menuOpen ? (
        <div
          className={`absolute left-0 top-10 z-50 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-2xl shadow-black/55 ${
            calendarOpen
              ? "w-[min(254px,calc(100vw-2rem))]"
              : "w-[min(280px,calc(100vw-2rem))] py-1.5"
          }`}
        >
          {!calendarOpen ? (
            <div className="grid gap-1">
              {presets.map((option) => (
                <button
                  className="flex min-h-10 w-full items-center justify-between px-4 text-left text-sm font-medium text-foreground transition hover:bg-surface"
                  key={option.id}
                  onClick={() => selectPreset(option.id)}
                  type="button"
                >
                  <span
                    className={
                      option.id === preset ? "text-accent" : "text-foreground"
                    }
                  >
                    {option.label}
                  </span>
                  {option.id === preset ? (
                    <Check className="size-4 text-accent" aria-hidden="true" />
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <RangeCalendar
              endDate={customEndDate}
              onChange={handleCustomChange}
              startDate={customStartDate}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}

function RangeCalendar({
  endDate,
  onChange,
  startDate,
}: {
  readonly endDate: string;
  readonly onChange: (startDate: string, endDate: string) => void;
  readonly startDate: string;
}) {
  const initialDate = startDate ? parseDate(startDate) : new Date();
  const [viewDate, setViewDate] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [phase, setPhase] = useState<0 | 1 | 2>(
    startDate && endDate ? 2 : startDate ? 1 : 0,
  );

  const previewEndDate = phase === 1 ? hoverDate : endDate;
  const rangeStart =
    startDate && previewEndDate
      ? startDate <= previewEndDate
        ? startDate
        : previewEndDate
      : startDate;
  const rangeEnd =
    startDate && previewEndDate
      ? startDate <= previewEndDate
        ? previewEndDate
        : startDate
      : "";
  const cells = calendarCells(viewDate.getFullYear(), viewDate.getMonth());

  function moveMonth(direction: 1 | -1) {
    setViewDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + direction, 1),
    );
  }

  function selectDate(date: string) {
    if (phase === 0 || phase === 2) {
      setPhase(1);
      onChange(date, "");
      return;
    }

    const nextStartDate = date < startDate ? date : startDate;
    const nextEndDate = date < startDate ? startDate : date;
    setPhase(2);
    onChange(nextStartDate, nextEndDate);
  }

  return (
    <div className="w-full select-none bg-black text-foreground">
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <button
          aria-label="Mes anterior"
          className="flex size-6 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-foreground"
          onClick={() => moveMonth(-1)}
          type="button"
        >
          <ChevronLeft className="size-3.5" aria-hidden="true" />
        </button>
        <span className="text-xs font-bold">
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </span>
        <button
          aria-label="Proximo mes"
          className="flex size-6 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-foreground"
          onClick={() => moveMonth(1)}
          type="button"
        >
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 px-2">
        {weekDayNames.map((day) => (
          <span
            className="py-1 text-center text-[9px] font-bold text-muted"
            key={day}
          >
            {day}
          </span>
        ))}
      </div>

      <div
        className="grid grid-cols-7 px-2 pb-3"
        onMouseLeave={() => setHoverDate(null)}
      >
        {cells.map((day, index) => {
          if (!day) {
            return <div className="h-8" key={`empty-${index}`} />;
          }

          const date = toDateInput(
            new Date(viewDate.getFullYear(), viewDate.getMonth(), day),
          );
          const isStart = date === rangeStart && Boolean(rangeEnd);
          const isEnd = date === rangeEnd && Boolean(rangeStart);
          const inRange =
            Boolean(rangeStart && rangeEnd) && date > rangeStart && date < rangeEnd;
          const selected = date === startDate || (phase === 2 && date === endDate);
          return (
            <div
              className="relative flex h-8 items-center justify-center"
              key={date}
              style={
                inRange
                  ? { backgroundColor: "hsl(var(--calendar-range))" }
                  : undefined
              }
            >
              <button
                className={`relative z-10 flex size-7 items-center justify-center rounded-full text-[11px] font-bold transition ${
                  selected || isStart || isEnd
                    ? "text-background"
                    : "text-foreground hover:bg-surface"
                }`}
                onClick={() => selectDate(date)}
                onMouseEnter={() => setHoverDate(date)}
                style={
                  selected || isStart || isEnd
                    ? { backgroundColor: selectedRangeColor }
                    : undefined
                }
                type="button"
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>

      <div className="border-t border-border px-3 py-2 text-center text-[10px] font-medium text-muted">
        {startDate && endDate
          ? `${formatDate(startDate)} -> ${formatDate(endDate)}`
          : "Selecione o periodo"}
      </div>
    </div>
  );
}

function rangeForPreset(
  preset: Exclude<PeriodFilterPreset, "custom">,
  referenceDate: Date,
): PeriodFilterRange {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  if (preset === "today") {
    const date = toDateInput(referenceDate);
    return { preset, startDate: date, endDate: date };
  }

  if (preset === "current-quarter") {
    const quarterStartMonth = Math.floor(month / 3) * 3;
    const startDate = new Date(year, quarterStartMonth, 1);
    const endDate = new Date(year, quarterStartMonth + 3, 0);

    return {
      preset,
      startDate: toDateInput(startDate),
      endDate: toDateInput(endDate),
    };
  }

  if (preset === "current-semester") {
    const semesterStartMonth = month < 6 ? 0 : 6;
    const startDate = new Date(year, semesterStartMonth, 1);
    const endDate = new Date(year, semesterStartMonth + 6, 0);

    return {
      preset,
      startDate: toDateInput(startDate),
      endDate: toDateInput(endDate),
    };
  }

  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  return {
    preset,
    startDate: toDateInput(startDate),
    endDate: toDateInput(endDate),
  };
}

function navigateReferenceDate(
  preset: PeriodFilterPreset,
  referenceDate: Date,
  direction: 1 | -1,
): Date {
  const nextDate = new Date(referenceDate);

  if (preset === "today") {
    nextDate.setDate(nextDate.getDate() + direction);
    return nextDate;
  }

  if (preset === "current-quarter") {
    nextDate.setMonth(nextDate.getMonth() + direction * 3);
    return nextDate;
  }

  if (preset === "current-semester") {
    nextDate.setMonth(nextDate.getMonth() + direction * 6);
    return nextDate;
  }

  nextDate.setMonth(nextDate.getMonth() + direction);
  return nextDate;
}

function periodLabel(
  preset: PeriodFilterPreset,
  referenceDate: Date,
  customStartDate: string,
  customEndDate: string,
): string {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  if (preset === "today") {
    return `${String(referenceDate.getDate()).padStart(2, "0")} ${shortMonthNames[
      month
    ].toLowerCase()} ${year}`;
  }

  if (preset === "current-quarter") {
    const quarter = Math.floor(month / 3) + 1;
    const startMonth = (quarter - 1) * 3;
    return `Q${quarter} - ${shortMonthNames[startMonth]} a ${
      shortMonthNames[startMonth + 2]
    } ${year}`;
  }

  if (preset === "current-semester") {
    const semester = month < 6 ? 1 : 2;
    const startMonth = semester === 1 ? 0 : 6;
    return `S${semester} - ${shortMonthNames[startMonth]} a ${
      shortMonthNames[startMonth + 5]
    } ${year}`;
  }

  if (preset === "custom") {
    return customStartDate && customEndDate
      ? `${formatDate(customStartDate)} -> ${formatDate(customEndDate)}`
      : "Selecionar periodo";
  }

  return `${monthNames[month]} ${year}`;
}

function calendarCells(year: number, month: number): (number | null)[] {
  const firstWeekDay = new Date(year, month, 1).getDay();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekDay }, () => null),
    ...Array.from({ length: daysCount }, (_, index) => index + 1),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function parseDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
