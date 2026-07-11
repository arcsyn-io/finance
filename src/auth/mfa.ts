import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const getMfaState = cache(async () => {
  try {
    const supabase = await createClient();
    const [{ data: assurance, error: assuranceError }, { data: factorsData }] =
      await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);

    if (assuranceError) {
      return {
        currentLevel: null,
        nextLevel: null,
        verifiedTotpFactors: [],
        needsMfa: true,
      };
    }

    const verifiedTotpFactors =
      factorsData?.totp.filter((factor) => factor.status === "verified") ?? [];

    return {
      currentLevel: assurance.currentLevel,
      nextLevel: assurance.nextLevel,
      verifiedTotpFactors,
      needsMfa: assurance.currentLevel !== "aal2",
    };
  } catch {
    return {
      currentLevel: null,
      nextLevel: null,
      verifiedTotpFactors: [],
      needsMfa: true,
    };
  }
});
