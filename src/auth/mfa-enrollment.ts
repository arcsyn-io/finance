import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

const enrollmentCookieName = "finance_mfa_enrollment";

const pendingTotpEnrollmentSchema = z.object({
  factorId: z.string().uuid(),
  challengeId: z.string().uuid(),
  qrCode: z.string().min(1),
  secret: z.string().min(1),
});

export type PendingTotpEnrollment = z.infer<
  typeof pendingTotpEnrollmentSchema
>;

export async function setPendingTotpEnrollment(
  enrollment: PendingTotpEnrollment,
) {
  const cookieStore = await cookies();

  cookieStore.set({
    name: enrollmentCookieName,
    value: JSON.stringify(enrollment),
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/mfa",
    maxAge: 60 * 10,
  });
}

export async function getPendingTotpEnrollment() {
  const cookieStore = await cookies();
  const value = cookieStore.get(enrollmentCookieName)?.value;

  if (!value) {
    return null;
  }

  try {
    return pendingTotpEnrollmentSchema.parse(JSON.parse(value));
  } catch {
    return null;
  }
}

export async function clearPendingTotpEnrollment() {
  const cookieStore = await cookies();
  cookieStore.delete(enrollmentCookieName);
}
