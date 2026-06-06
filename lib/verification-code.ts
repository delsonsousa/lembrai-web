import { createHash, randomInt, timingSafeEqual } from "crypto";

export function generateVerificationCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function hashVerificationCode(email: string, code: string) {
  return createHash("sha256")
    .update(`${email.trim().toLowerCase()}:${code.trim()}`)
    .digest("hex");
}

function safeCompare(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function matchesVerificationCode(
  storedCode: string,
  email: string,
  submittedCode: string
) {
  const normalizedCode = submittedCode.trim();
  const hashedSubmittedCode = hashVerificationCode(email, normalizedCode);

  if (safeCompare(storedCode, hashedSubmittedCode)) return true;

  // Transitional compatibility for codes generated before hash storage.
  return /^\d{6}$/.test(storedCode) && safeCompare(storedCode, normalizedCode);
}
