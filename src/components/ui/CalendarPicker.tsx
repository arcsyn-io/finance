"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const monthNames = [
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

const weekDayNames = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"] as const;
const selectedRangeColor = "#5ea6cc";

type CalendarPickerProps =
  | {
      readonly mode: "single";
      readonly onChange: (date: string) => void;
      readonly value: string;
    }
  | {
      readonly endDate: string;
      readonly mode: "range";
      readonly onChange: (startDate: string, endDate: string) => void;
      readonly startDate: string;
    };

export function CalendarPicker(props: CalendarPickerProps) {
  const initialDate =
    props.mode === "single"
      ? props.value
        ? parseDateInput(props.value)
        : new Date()
      : props.startDate
        ? parseDateInput(props.startDate)
        : new Date();
  const [viewDate, setViewDate] = useState(
    () => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [phase, setPhase] = useState<0 | 1 | 2>(
    props.mode === "range" && props.startDate && props.endDate
      ? 2
      : props.mode === "range" && props.startDate
        ? 1
        : 0,
  );

  const startDate = props.mode === "range" ? props.startDate : props.value;
  const endDate = props.mode === "range" ? props.endDate : "";
  const previewEndDate = props.mode === "range" && phase === 1 ? hoverDate : endDate;
  const rangeStart =
    props.mode === "range" && startDate && previewEndDate
      ? startDate <= previewEndDate
        ? startDate
        : previewEndDate
      : startDate;
  const rangeEnd =
    props.mode === "range" && startDate && previewEndDate
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
    if (props.mode === "single") {
      props.onChange(date);
      return;
    }

    if (phase === 0 || phase === 2) {
      setPhase(1);
      props.onChange(date, "");
      return;
    }

    const nextStartDate = date < props.startDate ? date : props.startDate;
    const nextEndDate = date < props.startDate ? props.startDate : date;
    setPhase(2);
    props.onChange(nextStartDate, nextEndDate);
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
            props.mode === "range" &&
            Boolean(rangeStart && rangeEnd) &&
            date > rangeStart &&
            date < rangeEnd;
          const selected =
            props.mode === "single"
              ? date === props.value
              : date === props.startDate || (phase === 2 && date === props.endDate);

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
        {props.mode === "single"
          ? props.value
            ? formatDateInput(props.value)
            : "Selecione a data"
          : props.startDate && props.endDate
            ? `${formatDateInput(props.startDate)} -> ${formatDateInput(
                props.endDate,
              )}`
            : "Selecione o periodo"}
      </div>
    </div>
  );
}

function calendarCells(year: number, month: number): (number | null)[] {
  const firstWeekDay = new Date(year, month, 1).getDay();
  const daysCount = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekDay }, () => null),
    ...Array.from({ length: daysCount }, (_, index) => index + 1),
  ];

  while (cells.length < 42) {
    cells.push(null);
  }

  return cells;
}

export function parseDateInput(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

export function formatDateInput(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
