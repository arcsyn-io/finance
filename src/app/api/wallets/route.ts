import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getApiApplicationContext } from "@/server/context/api-application-context";
import { createWalletJson } from "@/server/controllers/wallet-controller";
import { createWalletService } from "@/server/services/wallet-service-factory";

export async function POST(request: Request) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const response = await createWalletJson({
    context,
    service: createWalletService(),
    body: await request.json(),
  });

  if (response.status < 400) {
    revalidatePath("/wallets");
  }

  return NextResponse.json(response.body, { status: response.status });
}
