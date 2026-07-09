import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const challengeTotpSchema = z.object({
  factorId: z.string().uuid(),
  code: z.string().trim().regex(/^\d{6}$/, "Informe o codigo de 6 digitos."),
});

export async function POST(request: Request) {
  const result = challengeTotpSchema.safeParse(await request.json());

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Codigo invalido" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify(result.data);

  if (error) {
    console.error("MFA challenge verification failed", {
      code: error.code,
      message: error.message,
      status: error.status,
    });

    return NextResponse.json(
      { redirectTo: "/mfa?error=invalid_code" },
      { status: 401 },
    );
  }

  return NextResponse.json({ redirectTo: "/" });
}
