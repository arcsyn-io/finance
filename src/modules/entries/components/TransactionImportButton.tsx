"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import type { Category } from "@/domain/category/category";
import type { ImportRequest } from "@/domain/import/import";
import type { Wallet } from "@/domain/wallet/wallet";
import { UploadImportDialog } from "@/modules/imports/components/ImportsWorkspace";

type TransactionImportButtonProps = {
  readonly categories: readonly Category[];
  readonly wallets: readonly Wallet[];
};

type ImportApiResponse = {
  readonly importRequest?: ImportRequest;
  readonly error?: string;
};

export function TransactionImportButton({
  categories,
  wallets,
}: TransactionImportButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function submit(formData: FormData) {
    setPending(true);
    setError(undefined);

    try {
      const response = await fetch("/api/imports", {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as ImportApiResponse;

      if (!response.ok || !body.importRequest) {
        setError(body.error ?? "Nao foi possivel importar arquivo");
        setPending(false);
        return;
      }

      setOpen(false);
      router.push(`/imports?importId=${encodeURIComponent(body.importRequest.id)}`);
    } catch {
      setError("Nao foi possivel importar arquivo");
      setPending(false);
    }
  }

  return (
    <>
      <button
        className="flex h-8 items-center gap-1.5 rounded-lg border border-accent/50 bg-transparent px-3 text-xs font-semibold text-accent transition hover:bg-accent/10"
        onClick={() => {
          setError(undefined);
          setOpen(true);
        }}
        type="button"
      >
        <Upload className="size-3.5" aria-hidden="true" />
        Importar
      </button>
      {open ? (
        <UploadImportDialog
          categories={categories}
          error={error}
          onClose={() => {
            if (!pending) setOpen(false);
          }}
          onSubmit={(formData) => void submit(formData)}
          pending={pending}
          wallets={wallets}
        />
      ) : null}
    </>
  );
}
