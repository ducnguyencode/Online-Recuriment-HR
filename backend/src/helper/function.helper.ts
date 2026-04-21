import { randomBytes } from 'crypto';

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function generatePassword(length = 8): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const bytes = randomBytes(length);

  return Array.from(bytes)
    .map((b) => chars[b % chars.length])
    .join('');
}
