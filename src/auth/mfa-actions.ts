"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  clearPendingTotpEnrollment,
  getPendingTotpEnrollment,
  setPendingTotpEnrollment,
} from "@/auth/mfa-enrollment";
import { createClient } from "@/lib/supabase/server";

const codeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Informe o codigo de 6 digitos.");

const factorIdSchema = z.string().uuid();

export async function enrollTotp() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: "Finance",
  });

  if (error || !data || data.type !== "totp") {
    redirect("/mfa?error=enroll_failed");
  }

  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({
      factorId: data.id,
    });

  if (challengeError || !challenge) {
    redirect("/mfa?error=challenge_failed");
  }

  await setPendingTotpEnrollment({
    factorId: data.id,
    challengeId: challenge.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  });

  redirect("/mfa?mode=enroll");
}

export async function verifyEnrollment(formData: FormData) {
  const enrollment = await getPendingTotpEnrollment();
  const code = codeSchema.parse(formData.get("code"));

  if (!enrollment) {
    redirect("/mfa?error=enrollment_expired");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.verify({
    factorId: enrollment.factorId,
    challengeId: enrollment.challengeId,
    code,
  });

  if (error) {
    redirect("/mfa?mode=enroll&error=invalid_code");
  }

  await clearPendingTotpEnrollment();
  redirect("/");
}

export async function challengeTotp(formData: FormData) {
  const factorId = factorIdSchema.parse(formData.get("factorId"));
  const code = codeSchema.parse(formData.get("code"));

  const supabase = await createClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });

  if (error) {
    redirect("/mfa?error=invalid_code");
  }

  redirect("/");
}
