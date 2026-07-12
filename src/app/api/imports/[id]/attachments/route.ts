import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  listImportAttachmentsJson,
  uploadImportAttachmentJson,
} from "@/server/controllers/import-attachment-controller";
import { getApiApplicationContext } from "@/server/context/api-application-context";
import { createImportAttachmentService } from "@/server/services/import-attachment-service-factory";

type ImportAttachmentsRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  _request: Request,
  { params }: ImportAttachmentsRouteContext,
) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const response = await listImportAttachmentsJson({
    context,
    service: createImportAttachmentService(),
    importRequestId: id,
    importRowId: null,
  });

  return NextResponse.json(response.body, { status: response.status });
}

export async function POST(
  request: Request,
  { params }: ImportAttachmentsRouteContext,
) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const response = await uploadImportAttachmentJson({
    context,
    service: createImportAttachmentService(),
    importRequestId: id,
    importRowId: null,
    formData: await request.formData(),
  });

  if (response.status < 400) {
    revalidatePath("/imports");
  }

  return NextResponse.json(response.body, { status: response.status });
}
