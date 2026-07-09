import { NextResponse } from "next/server";
import { z } from "zod";
import {
  clearPendingTotpEnrollment,
  getPendingTotpEnrollment,
} from "@/auth/mfa-enrollment";
import { createClient } from "@/lib/supabase/server";

const verifyEnrollmentSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Informe o codigo de 6 digitos."),
});

export async function POST(request: Request) {
  const enrollment = await getPendingTotpEnrollment();
  const result = verifyEnrollmentSchema.safeParse(await request.json());

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Codigo invalido" },
      { status: 400 },
    );
  }

  if (!enrollment) {
    return NextResponse.json(
      { redirectTo: "/mfa?error=enrollment_expired" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.verify({
    factorId: enrollment.factorId,
    challengeId: enrollment.challengeId,
    code: result.data.code,
  });

  if (error) {
    console.error("MFA enrollment verification failed", {
      code: error.code,
      message: error.message,
      status: error.status,
    });

    return NextResponse.json(
      { redirectTo: "/mfa?mode=enroll&error=invalid_code" },
      { status: 401 },
    );
  }

  await clearPendingTotpEnrollment();
  return NextResponse.json({ redirectTo: "/" });
}
