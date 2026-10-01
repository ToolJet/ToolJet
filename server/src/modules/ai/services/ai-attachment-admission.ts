import { randomUUID } from 'node:crypto';
import { EntityManager } from 'typeorm';
import { HttpException } from '@nestjs/common';

export const ATTACHMENT_UPLOAD_TIMEOUT_MS = 120_000;
function positiveLimit(name: string, fallback: number) {
  const value = Number(process.env[name] || fallback);
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive integer`);
  return value;
}
export const MAX_OWNER_UPLOADS = positiveLimit('AI_ATTACHMENTS_MAX_UPLOADS', 100);
export const MAX_PROVIDER_UPLOADS = positiveLimit('AI_ATTACHMENTS_MAX_PROVIDER_UPLOADS', 1000);
export const ATTACHMENT_UPLOAD_WINDOW_SECONDS = 48 * 60 * 60 + ATTACHMENT_UPLOAD_TIMEOUT_MS / 1000;
export type AttachmentUploadPurpose = 'original' | 'provider';

/** Per-ToolJet-deployment, independent indexed attempt budgets. Admission never writes a wallet or credit-history row. */
export async function reserveAttachmentUpload(
  transaction: (operation: (manager: EntityManager) => Promise<number>) => Promise<number>,
  owner: string,
  cloudUserId?: string,
  purpose: AttachmentUploadPurpose = 'original'
): Promise<number> {
  if (!/^(organization|selfhost):[\w-]{1,128}$/.test(owner)) {
    throw new HttpException('Invalid attachment owner', 401);
  }
  if (cloudUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cloudUserId)) {
    throw new HttpException('Invalid attachment user', 400);
  }
  if (!['original', 'provider'].includes(purpose))
    throw new HttpException('Invalid attachment purpose', 400);
  const user = owner.startsWith('organization:') ? cloudUserId || null : null;
  const limit = purpose === 'original' ? MAX_OWNER_UPLOADS : MAX_PROVIDER_UPLOADS;
  const startedAt = Date.now();
  return transaction(async (client: EntityManager) => {
    await client.query("SET LOCAL statement_timeout = '10s'");
    await client.query("SET LOCAL lock_timeout = '3s'");
    // A stable lock order also serializes the same cloud user's cross-workspace requests.
    for (const key of [user && `attachment-user:${purpose}:${user}`, `attachment-owner:${purpose}:${owner}`].filter(
      Boolean
    )) {
      await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [key]);
    }
    for (const [column, value] of [['owner', owner], ...(user ? [['user_id', user]] : [])]) {
      const recent = await client.query(
        `SELECT COUNT(*) AS count FROM (
        SELECT 1 FROM ai_attachment_admissions WHERE ${column} = $1 AND purpose = $2 AND expires_at > now() LIMIT $3
      ) recent`,
        [value, purpose, limit]
      );
      if (Number(recent[0].count) >= limit) {
        throw new HttpException(`Attachment ${purpose === 'original' ? 'upload' : 'provider-copy'} limit reached. Try again later.`, 429);
      }
    }
    await client.query(
      `INSERT INTO ai_attachment_admissions (id, owner, user_id, purpose, expires_at)
      VALUES ($1, $2, $3, $4, now() + ($5 * INTERVAL '1 second'))`,
      [randomUUID(), owner, user, purpose, ATTACHMENT_UPLOAD_WINDOW_SECONDS]
    );
    // Bounded pruning is safe across ToolJet replicas and uses the expiry index.
    await client.query(`DELETE FROM ai_attachment_admissions WHERE id IN (
      SELECT id FROM ai_attachment_admissions WHERE expires_at <= now() ORDER BY expires_at LIMIT 100 FOR UPDATE SKIP LOCKED
    )`);
    return startedAt + ATTACHMENT_UPLOAD_TIMEOUT_MS;
  });
}
