import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  listEntryAttachmentsJson,
  uploadEntryAttachmentJson,
} from "@/server/controllers/entry-attachment-controller";
import { getApiApplicationContext } from "@/server/context/api-application-context";
import { createEntryAttachmentService } from "@/server/services/entry-attachment-service-factory";

type EntryAttachmentsRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: EntryAttachmentsRouteContext,
) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const response = await listEntryAttachmentsJson({
    context,
    service: createEntryAttachmentService(),
    entryId: id,
  });

  return NextResponse.json(response.body, { status: response.status });
}

export async function POST(
  request: Request,
  { params }: EntryAttachmentsRouteContext,
) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const response = await uploadEntryAttachmentJson({
    context,
    service: createEntryAttachmentService(),
    entryId: id,
    formData: await request.formData(),
  });

  if (response.status < 400) {
    revalidatePath("/transactions");
  }

  return NextResponse.json(response.body, { status: response.status });
}
