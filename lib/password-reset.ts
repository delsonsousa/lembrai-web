import { createHash, randomBytes, timingSafeEqual } from "crypto";

export const PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

export function generatePasswordResetToken() {
  return randomBytes(32).toString("base64url");
}

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token.trim()).digest("hex");
}

export function matchesPasswordResetTokenHash(token: string, hash: string) {
  const tokenHash = hashPasswordResetToken(token);
  const tokenBuffer = Buffer.from(tokenHash);
  const hashBuffer = Buffer.from(hash);

  if (tokenBuffer.length !== hashBuffer.length) return false;
  return timingSafeEqual(tokenBuffer, hashBuffer);
}

export function getPasswordResetExpiresAt() {
  return new Date(
    Date.now() + PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000
  ).toISOString();
}

export function isPasswordResetSchemaMissing(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const details = error as { code?: unknown; message?: unknown };
  return (
    details.code === "PGRST205" ||
    (typeof details.message === "string" &&
      details.message.includes("password_reset_tokens"))
  );
}
