import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

export const REFRESH_RETRY_SECONDS = 5;
// Store only an authenticated ciphertext in the consumed artifact. The database alone
// must not be enough to recover credentials, even inside the short retry window.
const key = (secret: string) => createHash('sha256').update('mcp-oauth-refresh-retry\0').update(secret).digest();
export function sealRefreshRetry(secret: string, artifactId: string, response: object): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(secret), iv);
  cipher.setAAD(Buffer.from(artifactId));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(response)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
}
export function openRefreshRetry(secret: string, artifactId: string, sealed: string): Record<string, any> | undefined {
  try {
    const bytes = Buffer.from(sealed, 'base64url');
    if (bytes.length < 28) return undefined;
    const decipher = createDecipheriv('aes-256-gcm', key(secret), bytes.subarray(0, 12), { authTagLength: 16 });
    decipher.setAAD(Buffer.from(artifactId));
    decipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString());
  } catch {
    return undefined;
  }
}
