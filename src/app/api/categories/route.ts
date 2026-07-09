import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createCategoryJson } from "@/server/controllers/category-controller";
import { getApiApplicationContext } from "@/server/context/api-application-context";
import { createCategoryService } from "@/server/services/category-service-factory";

export async function POST(request: Request) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const response = await createCategoryJson({
    context,
    service: await createCategoryService(),
    body: await request.json(),
  });

  if (response.status < 400) {
    revalidatePath("/categories");
  }

  return NextResponse.json(response.body, { status: response.status });
}
