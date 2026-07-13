import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getApiApplicationContext } from "@/server/context/api-application-context";
import { updateCashFlowConfigJson } from "@/server/controllers/cash-flow-controller";
import { createCashFlowService } from "@/server/services/cash-flow-service-factory";

export async function PUT(request: Request) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const response = await updateCashFlowConfigJson({
    context,
    service: createCashFlowService(),
    body: await parseJsonBody(request),
  });

  if (response.status < 400) {
    revalidatePath("/analysis/cash-flow");
  }

  return NextResponse.json(response.body, { status: response.status });
}

async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}
