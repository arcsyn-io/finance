import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  listImportAttachmentsJson,
  uploadImportAttachmentJson,
} from "@/server/controllers/import-attachment-controller";
import { getApiApplicationContext } from "@/server/context/api-application-context";
import { createImportAttachmentService } from "@/server/services/import-attachment-service-factory";

type ImportRowAttachmentsRouteContext = {
  params: Promise<{ id: string; rowId: string }>;
};

export async function GET(
  _request: Request,
  { params }: ImportRowAttachmentsRouteContext,
) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const { id, rowId } = await params;
  const response = await listImportAttachmentsJson({
    context,
    service: createImportAttachmentService(),
    importRequestId: id,
    importRowId: rowId,
  });

  return NextResponse.json(response.body, { status: response.status });
}

export async function POST(
  request: Request,
  { params }: ImportRowAttachmentsRouteContext,
) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const { id, rowId } = await params;
  const response = await uploadImportAttachmentJson({
    context,
    service: createImportAttachmentService(),
    importRequestId: id,
    importRowId: rowId,
    formData: await request.formData(),
  });

  if (response.status < 400) {
    revalidatePath("/imports");
  }

  return NextResponse.json(response.body, { status: response.status });
}
