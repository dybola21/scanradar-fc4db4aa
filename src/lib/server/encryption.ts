import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

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
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(hash: string): string {
  const key = getEncryptionKey();
  const [ivHex, encryptedHex] = hash.split(':');
  if (!ivHex || !encryptedHex) {
    throw new Error('Formato de hash de criptografia inválido');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString();
}
