import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json(
      { error: "Nao foi possivel sair da conta" },
      { status: 500 },
    );
  }

  return NextResponse.json({ redirectTo: "/login" });
}
