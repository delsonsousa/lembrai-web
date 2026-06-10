export const MIN_PASSWORD_LENGTH = 12;

export function validatePasswordStrength(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false as const,
      message: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }

  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return {
      ok: false as const,
      message: "A senha precisa ter letras e números.",
    };
  }

  return { ok: true as const, message: "" };
}
