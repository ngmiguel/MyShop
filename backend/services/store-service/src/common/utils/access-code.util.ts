const ACCESS_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const DEFAULT_ACCESS_CODE_LENGTH = 9;
const DEFAULT_ACCESS_CODE_TTL_DAYS = 90;

export function generateAccessCode(length = DEFAULT_ACCESS_CODE_LENGTH): string {
  const safeLength = Math.min(16, Math.max(6, length));
  let code = '';
  for (let i = 0; i < safeLength; i += 1) {
    const index = Math.floor(Math.random() * ACCESS_CODE_ALPHABET.length);
    code += ACCESS_CODE_ALPHABET[index];
  }
  return code;
}

export function computeAccessCodeExpiry(days = DEFAULT_ACCESS_CODE_TTL_DAYS): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function formatAccessCodeWithPrefix(prefix: string, length = DEFAULT_ACCESS_CODE_LENGTH): string {
  const normalizedPrefix = prefix
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 5);
  const suffixLength = Math.max(4, length - normalizedPrefix.length - 1);
  const suffix = generateAccessCode(suffixLength);
  return normalizedPrefix ? `${normalizedPrefix}-${suffix}` : suffix;
}
