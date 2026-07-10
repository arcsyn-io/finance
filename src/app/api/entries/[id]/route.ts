import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  deleteEntryJson,
  restoreEntryJson,
  updateEntryJson,
} from "@/server/controllers/entry-controller";
import { getApiApplicationContext } from "@/server/context/api-application-context";
import { createEntryService } from "@/server/services/entry-service-factory";

type EntryRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, { params }: EntryRouteContext) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const response = await updateEntryJson({
    context,
    service: createEntryService(),
    id,
    body: await request.json(),
  });

  if (response.status < 400) {
    revalidatePath("/transactions");
  }

  return NextResponse.json(response.body, { status: response.status });
}

export async function DELETE(_request: Request, { params }: EntryRouteContext) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const response = await deleteEntryJson({
    context,
    service: createEntryService(),
    id,
  });

  if (response.status < 400) {
    revalidatePath("/transactions");
  }

  return NextResponse.json(response.body, { status: response.status });
}

export async function PATCH(request: Request, { params }: EntryRouteContext) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const body = (await request.json()) as { restore?: unknown };

  if (body.restore !== true) {
    return NextResponse.json(
      { error: "Operacao do lancamento e obrigatoria" },
      { status: 400 },
    );
  }

  const { id } = await params;
  const response = await restoreEntryJson({
    context,
    service: createEntryService(),
    id,
  });

  if (response.status < 400) {
    revalidatePath("/transactions");
  }

  return NextResponse.json(response.body, { status: response.status });
}
