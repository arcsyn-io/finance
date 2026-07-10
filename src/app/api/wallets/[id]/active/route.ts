import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getApiApplicationContext } from "@/server/context/api-application-context";
import { setWalletActiveJson } from "@/server/controllers/wallet-controller";
import { createWalletService } from "@/server/services/wallet-service-factory";

type WalletActiveRouteParams = {
  readonly params: Promise<{
    readonly id: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: WalletActiveRouteParams,
) {
  const context = await getApiApplicationContext();

  if (!context) {
    return NextResponse.json(
      { error: "Autenticacao obrigatoria" },
      { status: 401 },
    );
  }

  const { id } = await params;
  const response = await setWalletActiveJson({
    context,
    service: createWalletService(),
    id,
    body: await request.json(),
  });

  if (response.status < 400) {
    revalidatePath("/wallets");
  }

  return NextResponse.json(response.body, { status: response.status });
}
