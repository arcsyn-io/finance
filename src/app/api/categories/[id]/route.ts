import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { updateCategoryJson } from "@/server/controllers/category-controller";
import { getApiApplicationContext } from "@/server/context/api-application-context";
import { createCategoryService } from "@/server/services/category-service-factory";

type CategoryRouteParams = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

export async function PUT(request: Request, { params }: CategoryRouteParams) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const response = await updateCategoryJson({
    context,
    service: await createCategoryService(),
    id,
    body: await request.json(),
  });

  if (response.status < 400) {
    revalidatePath("/categories");
  }

  return NextResponse.json(response.body, { status: response.status });
}
