"use client";

import {
  ChangeEvent,
  forwardRef,
  KeyboardEvent,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Calendar } from "lucide-react";
import {
  CalendarPicker,
  formatDateInput,
} from "@/components/ui/CalendarPicker";
import { Dropdown } from "@/components/ui/Dropdown";

type CalendarFieldProps = {
  readonly className?: string;
  readonly disabled?: boolean;
  readonly label?: string;
  readonly onChange: (date: string) => void;
  readonly value: string;
};

export const CalendarField = forwardRef<HTMLInputElement, CalendarFieldProps>(
  function CalendarField(
    { className = "", disabled = false, label = "Data", onChange, value },
    ref,
  ) {
  const [open, setOpen] = useState(false);
  const [textValue, setTextValue] = useState(() =>
    value ? formatDateInput(value) : "",
  );
  const inputRef = useRef<HTMLInputElement | null>(null);

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  useEffect(() => {
    setTextValue(value ? formatDateInput(value) : "");
  }, [value]);

  function selectDate(date: string) {
    onChange(date);
    setTextValue(formatDateInput(date));
    setOpen(false);
  }

  function changeText(event: ChangeEvent<HTMLInputElement>) {
    const formattedDate = formatDateText(event.target.value);
    setTextValue(formattedDate);

    const date = parseDisplayDate(formattedDate);

    if (date) {
      onChange(date);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
    }
  }

  return (
    <Dropdown
      onOpenChange={setOpen}
      open={open}
      panelClassName="overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-2xl shadow-black/55"
      trigger={({ open: dropdownOpen, toggle, triggerRef }) => (
        <div
          className={`flex h-8 w-full items-center rounded-md border border-border bg-surface/70 text-xs font-medium text-foreground outline-none transition focus-within:ring-1 focus-within:ring-accent hover:bg-surface-elevated ${className}`}
          ref={(node) => {
            triggerRef.current = node;
          }}
        >
          <input
            aria-label={label}
            className="min-w-0 flex-1 bg-transparent px-2.5 text-xs text-foreground outline-none placeholder:text-muted tabular-nums"
            inputMode="numeric"
            disabled={disabled}
            onChange={changeText}
            onKeyDown={handleKeyDown}
            placeholder="dd/mm/aaaa"
            ref={inputRef}
            value={textValue}
          />
          <button
            aria-expanded={dropdownOpen}
            aria-label="Abrir calendario"
            className="flex h-full w-8 shrink-0 items-center justify-center rounded-r-md text-muted transition hover:bg-surface hover:text-foreground"
            disabled={disabled}
            onClick={toggle}
            type="button"
          >
            <Calendar className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      )}
      width={254}
    >
      <CalendarPicker mode="single" onChange={selectDate} value={value} />
    </Dropdown>
  );
  },
);

function formatDateText(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 4),
    digits.slice(4, 8),
  ].filter(Boolean);

  return parts.join("/");
}

function parseDisplayDate(value: string): string | null {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return null;
  }

  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}
