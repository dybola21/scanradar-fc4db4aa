import { createCipheriv, createDecipheriv, randomBytes, createHash, timingSafeEqual } from 'crypto';

const ALGORITHM = 'aes-256-ctr';

function getEncryptionKey() {
  const key = process.env['ENCRYPTION_KEY'];
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  // Ensure key is 32 bytes
  return createHash('sha256').update(key).digest();
}

export function encrypt(text: string): string {
  if (!text) return '';
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(hash: string): string {
  if (!hash) return '';
  
  // If the hash doesn't contain a colon, it's likely not encrypted (legacy data)
  if (!hash.includes(':')) {
    console.warn('[Encryption] Attempted to decrypt a string that is not in the expected format. Returning raw string.');
    return hash;
  }

  const key = getEncryptionKey();
  const [ivHex, encryptedHex] = hash.split(':');
  
  if (!ivHex || !encryptedHex) {
    console.warn('[Encryption] Invalid hash format. Returning raw string.');
    return hash;
  }
  
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('[Encryption] Decryption failed:', error);
    return hash;
  }
}

/**
 * Generates a secure random secret for callback verification.
 */
export function generateCallbackSecret(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Hashes a secret for secure storage.
 */
export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

/**
 * Securely compares a secret with its stored hash.
 */
export function verifySecret(secret: string, hash: string): boolean {
  if (!secret || !hash) return false;
  const secretHash = hashSecret(secret);
  return timingSafeEqual(Buffer.from(secretHash), Buffer.from(hash));
}

