/**
 * Input validation & sanitization utilities for security hardening.
 */

// Allows letters (including accented/ñ), numbers, spaces, hyphens, commas, periods
const SAFE_TEXT_REGEX = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-,.()#]+$/;

export const MAX_NAME_LENGTH = 50;
export const MAX_DESCRIPTION_LENGTH = 100;

export function validateSafeText(value: string): string | null {
  if (!value.trim()) return null; // empty is handled by required checks
  if (!SAFE_TEXT_REGEX.test(value)) {
    return 'El formato contiene caracteres no permitidos (< > / \\ { } [ ] = ; no están permitidos)';
  }
  return null;
}

export function validateName(value: string): string | null {
  if (value.length > MAX_NAME_LENGTH) {
    return `Máximo ${MAX_NAME_LENGTH} caracteres permitidos`;
  }
  return validateSafeText(value);
}

export function validateDescription(value: string): string | null {
  if (value.length > MAX_DESCRIPTION_LENGTH) {
    return `Máximo ${MAX_DESCRIPTION_LENGTH} caracteres permitidos`;
  }
  return validateSafeText(value);
}

/** Sanitize by stripping dangerous chars (fallback) */
export function sanitize(value: string): string {
  return value.replace(/[<>\/\\{}\[\]=;`"']/g, '');
}
