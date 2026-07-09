import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const signInSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe a senha."),
});

export async function POST(request: Request) {
  const result = signInSchema.safeParse(await request.json());

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Dados invalidos" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return NextResponse.json(
      { redirectTo: "/login?error=invalid_credentials" },
      { status: 401 },
    );
  }

  return NextResponse.json({ redirectTo: "/" });
}
