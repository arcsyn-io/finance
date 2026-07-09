import { NextResponse } from "next/server";
import {
  setPendingTotpEnrollment,
} from "@/auth/mfa-enrollment";
import { createClient } from "@/lib/supabase/server";

const totpFriendlyName = "Finance";

export async function POST() {
  const supabase = await createClient();
  const { data: factorsData, error: factorsError } =
    await supabase.auth.mfa.listFactors();

  if (factorsError) {
    logMfaError("MFA factor listing failed", factorsError);
    return redirectJson("/mfa?error=enroll_failed", 500);
  }

  const existingTotpFactor = factorsData.totp.find(
    (factor) => factor.friendly_name === totpFriendlyName,
  );

  if (existingTotpFactor?.status === "verified") {
    return redirectJson("/mfa");
  }

  if (existingTotpFactor) {
    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId: existingTotpFactor.id,
    });

    if (unenrollError) {
      logMfaError("MFA stale factor unenroll failed", unenrollError);
      return redirectJson("/mfa?error=enroll_failed", 500);
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: totpFriendlyName,
  });

  if (error || !data || data.type !== "totp") {
    logMfaError("MFA enroll failed", error);
    return redirectJson("/mfa?error=enroll_failed", 500);
  }

  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({
      factorId: data.id,
    });

  if (challengeError || !challenge) {
    logMfaError("MFA enrollment challenge failed", challengeError);
    return redirectJson("/mfa?error=challenge_failed", 500);
  }

  await setPendingTotpEnrollment({
    factorId: data.id,
    challengeId: challenge.id,
    secret: data.totp.secret,
  });

  return redirectJson("/mfa?mode=enroll");
}

function redirectJson(redirectTo: string, status = 200) {
  return NextResponse.json({ redirectTo }, { status });
}

function logMfaError(
  message: string,
  error: { code?: string; message?: string; status?: number } | null,
) {
  console.error(message, {
    code: error?.code,
    message: error?.message,
    status: error?.status,
  });
}
