import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  deleteImportRowJson,
  setImportRowIgnoredJson,
  updateImportRowJson,
} from "@/server/controllers/import-controller";
import { getApiApplicationContext } from "@/server/context/api-application-context";
import { createImportService } from "@/server/services/import-service-factory";

type RouteContext = {
  params: Promise<{ id: string; rowId: string }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  const context = await getApiApplicationContext();
  if (!context) return unauthorized();

  const routeParams = await params;
  const response = await updateImportRowJson({
    context,
    service: createImportService(),
    importRequestId: routeParams.id,
    rowId: routeParams.rowId,
    body: await request.json(),
  });

  if (response.status < 400) revalidatePath("/imports");
  return NextResponse.json(response.body, { status: response.status });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getApiApplicationContext();
  if (!context) return unauthorized();

  const routeParams = await params;
  const body = await request.json();
  const service = createImportService();
  const response =
    typeof body === "object" && body !== null && "ignored" in body
      ? await setImportRowIgnoredJson({
          context,
          service,
          importRequestId: routeParams.id,
          rowId: routeParams.rowId,
          body,
        })
      : await updateImportRowJson({
          context,
          service,
          importRequestId: routeParams.id,
          rowId: routeParams.rowId,
          body,
        });

  if (response.status < 400) revalidatePath("/imports");
  return NextResponse.json(response.body, { status: response.status });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const context = await getApiApplicationContext();
  if (!context) return unauthorized();

  const routeParams = await params;
  const response = await deleteImportRowJson({
    context,
    service: createImportService(),
    importRequestId: routeParams.id,
    rowId: routeParams.rowId,
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
