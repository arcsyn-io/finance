import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { cancelImportJson, getImportJson } from "@/server/controllers/import-controller";
import { getApiApplicationContext } from "@/server/context/api-application-context";
import { createImportService } from "@/server/services/import-service-factory";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const context = await getApiApplicationContext();
  if (!context) return unauthorized();

  const response = await getImportJson({
    context,
    service: createImportService(),
    id: (await params).id,
  });

  return NextResponse.json(response.body, { status: response.status });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await getApiApplicationContext();
  if (!context) return unauthorized();

  const response = await cancelImportJson({
    context,
    service: createImportService(),
    id: (await params).id,
  });

  if (response.status < 400) revalidatePath("/imports");
  return NextResponse.json(response.body, { status: response.status });
}

function unauthorized() {
  return NextResponse.json(
    { error: "Autenticacao obrigatoria" },
    { status: 401 },
  );
}
