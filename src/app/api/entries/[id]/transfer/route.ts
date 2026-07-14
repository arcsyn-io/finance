import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  linkEntryTransferJson,
  unlinkEntryTransferJson,
} from "@/server/controllers/entry-controller";
import { getApiApplicationContext } from "@/server/context/api-application-context";
import { createEntryService } from "@/server/services/entry-service-factory";

type EntryTransferRouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  { params }: EntryTransferRouteContext,
) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const response = await linkEntryTransferJson({
    context,
    service: createEntryService(),
    id,
    body: await request.json(),
  });

  if (response.status < 400) {
    revalidatePath("/transactions");
    revalidatePath("/wallets");
  }

  return NextResponse.json(response.body, { status: response.status });
}

export async function DELETE(
  _request: Request,
  { params }: EntryTransferRouteContext,
) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const response = await unlinkEntryTransferJson({
    context,
    service: createEntryService(),
    id,
  });

  if (response.status < 400) {
    revalidatePath("/transactions");
    revalidatePath("/wallets");
  }

  return NextResponse.json(response.body, { status: response.status });
}
