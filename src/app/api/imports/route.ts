import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createImportJson, deleteImportsJson, listImportsJson } from "@/server/controllers/import-controller";
import { getApiApplicationContext } from "@/server/context/api-application-context";
import { createImportService } from "@/server/services/import-service-factory";

export async function GET(request: Request) {
  const context = await getApiApplicationContext();
  if (!context) return unauthorized();

  const response = await listImportsJson({
    context,
    service: createImportService(),
    query: {
      includeConfirmed:
        new URL(request.url).searchParams.get("includeConfirmed") === "true",
    },
  });

  return NextResponse.json(response.body, { status: response.status });
}

export async function POST(request: Request) {
  const context = await getApiApplicationContext();
  if (!context) return unauthorized();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo e obrigatorio" }, { status: 400 });
  }

  const response = await createImportJson({
    context,
    service: createImportService(),
    body: {
      source: formData.get("source"),
      defaultWalletId: nullableFormValue(formData.get("defaultWalletId")),
      defaultCategoryId: nullableFormValue(formData.get("defaultCategoryId")),
      nature: nullableFormValue(formData.get("nature")),
      economicEvent: nullableFormValue(formData.get("economicEvent")),
      fileName: file.name,
      fileContent: await file.text(),
      fileSizeBytes: file.size,
    },
  });

  if (response.status < 400) {
    revalidatePath("/imports");
  }

  return NextResponse.json(response.body, { status: response.status });
}

export async function DELETE(request: Request) {
  const context = await getApiApplicationContext();
  if (!context) return unauthorized();

  const response = await deleteImportsJson({
    context,
    service: createImportService(),
    body: await request.json().catch(() => null),
  });

  if (response.status < 400) revalidatePath("/imports");
  return NextResponse.json(response.body, { status: response.status });
}

function nullableFormValue(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function unauthorized() {
  return NextResponse.json(
    { error: "Autenticacao obrigatoria" },
    { status: 401 },
  );
}
