import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { confirmImportJson } from "@/server/controllers/import-controller";
import { getApiApplicationContext } from "@/server/context/api-application-context";
import { createImportService } from "@/server/services/import-service-factory";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: RouteContext) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const response = await confirmImportJson({
    context,
    service: createImportService(),
    id: (await params).id,
  });

  if (response.status < 400) {
    revalidatePath("/imports");
    revalidatePath("/transactions");
  }

  return NextResponse.json(response.body, { status: response.status });
}
