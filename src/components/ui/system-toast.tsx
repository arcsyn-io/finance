"use client";

import { Check, TriangleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

type SystemToastTone = "success" | "error";

export type SystemToastMessage = {
  readonly id: number;
  readonly message: string;
  readonly tone: SystemToastTone;
};

export function SystemToast({
  toast,
  onDismiss,
}: {
  readonly toast: SystemToastMessage;
  readonly onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const Icon = toast.tone === "success" ? Check : TriangleAlert;
  const toneClasses =
    toast.tone === "success"
      ? "border-positive/35 bg-positive/15 text-positive"
      : "border-negative/35 bg-negative/15 text-negative";

  useEffect(() => {
    setVisible(true);

    const timeout = window.setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [onDismiss, toast.id]);

  function dismiss() {
    setVisible(false);
    onDismiss();
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed right-4 top-4 z-50 flex w-[min(360px,calc(100vw-2rem))] items-start gap-3 rounded-lg border border-border bg-surface-elevated px-4 py-3 text-xs text-foreground shadow-2xl shadow-background/50">
      <span
        className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${toneClasses}`}
      >
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <p className="min-w-0 flex-1 leading-5">{toast.message}</p>
      <button
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted transition hover:bg-surface hover:text-foreground"
        onClick={dismiss}
        type="button"
      >
        <X className="size-3.5" aria-hidden="true" />
        <span className="sr-only">Fechar mensagem</span>
      </button>
    </div>
  );
}
