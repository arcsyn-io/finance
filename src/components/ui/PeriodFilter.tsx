"use client";

import { useState } from "react";
import { Calendar, Check, ChevronLeft, ChevronRight } from "lucide-react";
import {
  CalendarPicker,
  formatDateInput,
  monthNames,
  parseDateInput,
  toDateInput,
} from "@/components/ui/CalendarPicker";
import { Dropdown } from "@/components/ui/Dropdown";

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

export function PeriodFilter({
  initialEndDate,
  initialPreset = "current-month",
  initialStartDate,
  onChange,
}: PeriodFilterProps) {
  const [preset, setPreset] = useState<PeriodFilterPreset>(initialPreset);
  const [referenceDate, setReferenceDate] = useState(() =>
    parseDateInput(initialStartDate),
  );
  const [customStartDate, setCustomStartDate] = useState(initialStartDate);
  const [customEndDate, setCustomEndDate] = useState(initialEndDate);
  const [menuOpen, setMenuOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const canNavigate = preset !== "custom";

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
    <div className="relative flex items-center gap-1.5">
      <button
        aria-label="Periodo anterior"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-panel text-muted transition hover:bg-surface-elevated hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
        disabled={!canNavigate}
        onClick={() => navigate(-1)}
        type="button"
      >
        <ChevronLeft className="size-3.5" aria-hidden="true" />
      </button>

      <Dropdown
        onOpenChange={(open) => {
          setMenuOpen(open);

          if (!open) {
            setCalendarOpen(false);
          }
        }}
        open={menuOpen}
        panelClassName={`overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-2xl shadow-black/55 ${
          calendarOpen ? "" : "py-1.5"
        }`}
        trigger={({ open, triggerRef }) => (
          <button
            aria-expanded={open}
            className="flex h-8 min-w-[180px] items-center justify-center gap-2 rounded-lg border border-border bg-panel px-3 text-xs font-semibold text-foreground shadow-sm transition hover:bg-surface-elevated focus:outline-none focus-visible:ring-1 focus-visible:ring-accent sm:min-w-[210px]"
            onClick={() => {
              setMenuOpen((current) => !current);
              setCalendarOpen(false);
            }}
            ref={(node) => {
              triggerRef.current = node;
            }}
            type="button"
          >
            <Calendar className="size-3.5 text-muted" aria-hidden="true" />
            {periodLabel(preset, referenceDate, customStartDate, customEndDate)}
          </button>
        )}
        width={calendarOpen ? 254 : 280}
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
          <CalendarPicker
            endDate={customEndDate}
            mode="range"
            onChange={handleCustomChange}
            startDate={customStartDate}
          />
        )}
      </Dropdown>

      <button
        aria-label="Proximo periodo"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-panel text-muted transition hover:bg-surface-elevated hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
        disabled={!canNavigate}
        onClick={() => navigate(1)}
        type="button"
      >
        <ChevronRight className="size-3.5" aria-hidden="true" />
      </button>
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
      ? `${formatDateInput(customStartDate)} -> ${formatDateInput(
          customEndDate,
        )}`
      : "Selecionar periodo";
  }

  return `${monthNames[month]} ${year}`;
}
