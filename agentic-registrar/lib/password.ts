/**
 * Many password hashes (e.g. bcrypt) use at most the first 72 UTF-8 bytes.
 * Truncates without splitting a multibyte character.
 */
export function truncatePasswordTo72Bytes(password: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(password);
  if (bytes.length <= 72) return password;

  let len = 72;
  while (len > 0 && (bytes[len - 1] & 0xc0) === 0x80) {
    len--;
  }
  return new TextDecoder().decode(bytes.slice(0, len));
}
