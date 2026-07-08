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
const totpFriendlyName = "Finance";

export async function enrollTotp() {
  const supabase = await createClient();
  const { data: factorsData, error: factorsError } =
    await supabase.auth.mfa.listFactors();

  if (factorsError) {
    console.error("MFA factor listing failed", {
      code: factorsError.code,
      message: factorsError.message,
      status: factorsError.status,
    });
    redirect("/mfa?error=enroll_failed");
  }

  const existingTotpFactor = factorsData.totp.find(
    (factor) => factor.friendly_name === totpFriendlyName,
  );

  if (existingTotpFactor?.status === "verified") {
    redirect("/mfa");
  }

  if (existingTotpFactor) {
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId: existingTotpFactor.id,
    });

    if (unenrollError) {
      console.error("MFA stale factor unenroll failed", {
        code: unenrollError.code,
        message: unenrollError.message,
        status: unenrollError.status,
      });
      redirect("/mfa?error=enroll_failed");
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: totpFriendlyName,
  });

  if (error || !data || data.type !== "totp") {
    console.error("MFA enroll failed", {
      code: error?.code,
      message: error?.message,
      status: error?.status,
    });
    redirect("/mfa?error=enroll_failed");
  }

  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({
      factorId: data.id,
    });

  if (challengeError || !challenge) {
    console.error("MFA enrollment challenge failed", {
      code: challengeError?.code,
      message: challengeError?.message,
      status: challengeError?.status,
    });
    redirect("/mfa?error=challenge_failed");
  }

  await setPendingTotpEnrollment({
    factorId: data.id,
    challengeId: challenge.id,
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
    console.error("MFA enrollment verification failed", {
      code: error.code,
      message: error.message,
      status: error.status,
    });
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
    console.error("MFA challenge verification failed", {
      code: error.code,
      message: error.message,
      status: error.status,
    });
    redirect("/mfa?error=invalid_code");
  }

  redirect("/");
}
