"use client";

import { FormEvent, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Plus, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Category, CategoryType } from "@/domain/category/category";

type CategoryFormProps = {
  readonly categoryTypes: readonly CategoryType[];
};

type CategoryRowFormsProps = CategoryFormProps & {
  readonly category: Category;
};

type CategoryApiResponse = {
  readonly status?: string;
  readonly error?: string;
};

export function CreateCategoryForm({ categoryTypes }: CategoryFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const response = await postJson("/api/categories", {
      name: String(formData.get("name") ?? ""),
      type: emptyToUndefined(formData.get("type")),
    });

    if (response.ok) {
      form.reset();
      navigateWithMessage(router, searchParams, "status", "created");
      return;
    }

    navigateWithMessage(
      router,
      searchParams,
      "error",
      response.body.error ?? "Nao foi possivel salvar a categoria",
    );
  }

  return (
    <form
      onSubmit={(event) => startTransition(() => void handleSubmit(event))}
      className="grid gap-3 p-5 md:grid-cols-[1fr_220px_auto]"
    >
      <Label className="flex flex-col gap-2">
        Nome
        <Input
          name="name"
          placeholder="Ex.: Alimentacao"
        />
      </Label>
      <Label className="flex flex-col gap-2">
        Tipo
        <Select
          name="type"
          defaultValue="EXPENSE"
        >
          {categoryTypes.map((type) => (
            <option key={type} value={type}>
              {type === "INCOME" ? "Receita" : "Despesa"}
            </option>
          ))}
        </Select>
      </Label>
      <Button
        className="self-end"
        disabled={pending}
      >
        <Plus aria-hidden="true" />
        Criar
      </Button>
    </form>
  );
}

export function CategoryRowForms({
  category,
  categoryTypes,
}: CategoryRowFormsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const response = await postJson(`/api/categories/${category.id}`, {
      name: String(formData.get("name") ?? ""),
      type: emptyToUndefined(formData.get("type")),
      active: formData.get("active") === "on",
    }, "PUT");

    if (response.ok) {
      navigateWithMessage(router, searchParams, "status", "updated");
      return;
    }

    navigateWithMessage(
      router,
      searchParams,
      "error",
      response.body.error ?? "Nao foi possivel salvar a categoria",
    );
  }

  async function handleStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const active = !category.active;
    const response = await postJson(
      `/api/categories/${category.id}/active`,
      { active },
      "PATCH",
    );

    if (response.ok) {
      navigateWithMessage(
        router,
        searchParams,
        "status",
        active ? "activated" : "deactivated",
      );
      return;
    }

    navigateWithMessage(
      router,
      searchParams,
      "error",
      response.body.error ?? "Nao foi possivel salvar a categoria",
    );
  }

  return (
    <article className="grid gap-3 p-4 transition hover:bg-white/[0.018]">
      <form
        onSubmit={(event) => startTransition(() => void handleUpdate(event))}
        className="grid gap-3 md:grid-cols-[1fr_150px_90px_auto]"
      >
        <Label className="flex flex-col gap-2">
          Nome
          <Input
            defaultValue={category.name}
            name="name"
          />
        </Label>
        <Label className="flex flex-col gap-2">
          Tipo
          <Select
            defaultValue={category.type}
            name="type"
          >
            {categoryTypes.map((type) => (
              <option key={type} value={type}>
                {type === "INCOME" ? "Receita" : "Despesa"}
              </option>
            ))}
          </Select>
        </Label>
        <Label className="flex h-10 items-center gap-2 self-end text-sm">
          <input
            className="h-4 w-4 accent-[hsl(var(--accent))]"
            defaultChecked={category.active}
            name="active"
            type="checkbox"
          />
          Ativa
        </Label>
        <Button
          className="self-end"
          disabled={pending}
          variant="outline"
        >
          <Save aria-hidden="true" />
          Salvar
        </Button>
      </form>
      <form
        onSubmit={(event) => startTransition(() => void handleStatus(event))}
        className="flex justify-end"
      >
        <Button
          disabled={pending}
          size="sm"
          variant="ghost"
        >
          {category.active ? (
            <Check aria-hidden="true" />
          ) : (
            <RotateCcw aria-hidden="true" />
          )}
          {category.active ? "Desativar" : "Ativar"}
        </Button>
      </form>
    </article>
  );
}

async function postJson(
  url: string,
  body: unknown,
  method = "POST",
): Promise<{ ok: boolean; body: CategoryApiResponse }> {
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return {
    ok: response.ok,
    body: (await response.json()) as CategoryApiResponse,
  };
}

function emptyToUndefined(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string" || value === "") {
    return undefined;
  }

  return value;
}

function navigateWithMessage(
  router: ReturnType<typeof useRouter>,
  searchParams: ReturnType<typeof useSearchParams>,
  key: "status" | "error",
  value: string,
) {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("status");
  params.delete("error");
  params.set(key, value);

  router.push(`/categories?${params.toString()}`);
  router.refresh();
}
