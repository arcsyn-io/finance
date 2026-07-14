import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { bulkUpdateImportRowsJson } from "@/server/controllers/import-controller";
import { getApiApplicationContext } from "@/server/context/api-application-context";
import { createImportService } from "@/server/services/import-service-factory";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  const context = await getApiApplicationContext();
  if (!context) return unauthorized();

  const routeParams = await params;
  const response = await bulkUpdateImportRowsJson({
    context,
    service: createImportService(),
    importRequestId: routeParams.id,
    body: await request.json(),
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
