import crypto from 'node:crypto';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generates a URL-friendly, collision-resistant unique ID (15 characters default).
 */
export function generateId(length = 15) {
  const bytes = crypto.randomBytes(length);
  let id = '';
  for (let i = 0; i < length; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return id;
}

/**
 * Generates a secure random token key for invalidating JWTs when password/email changes.
 */
export function generateTokenKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}
