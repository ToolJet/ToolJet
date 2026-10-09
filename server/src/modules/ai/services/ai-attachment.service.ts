import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  GoneException,
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isUUID } from 'class-validator';
import { createHash, randomUUID } from 'crypto';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { DataSource, EntityManager, In, IsNull, QueryFailedError } from 'typeorm';
import { AiAttachment } from '@entities/ai_attachment.entity';

export const MAX_AI_ATTACHMENT_BYTES = 10 * 1024 * 1024;
type AttachmentOwner = { id: string; organizationId: string };
export type AiAttachmentUpload = {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
};

@Injectable()
export class AiAttachmentService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    @Inject('AI_ATTACHMENT_AGENT')
    private readonly agent: {
      attachmentRequest: (
        user: AttachmentOwner,
        method: string,
        id?: string,
        file?: any,
        signal?: AbortSignal
      ) => Promise<any>;
    }
  ) {}

  private get repository() {
    return this.dataSource.getRepository(AiAttachment);
  }

  private diagnostic(operation: string, error: any) {
    // Neither messages, bound parameters, filenames, remote bodies nor credentials belong in logs.
    const code = String(error?.code || error?.getStatus?.() || error?.name || 'unknown')
      .replace(/[^\w-]/g, '')
      .slice(0, 40);
    Logger.warn(`Attachment ${operation} failed (code=${code}); durable cleanup will retry.`, 'AiAttachmentService');
  }

  private assertOwner(user: AttachmentOwner) {
    if (!user?.id || !user.organizationId) throw new BadRequestException('A user and workspace are required.');
  }

  private descriptor(file: AiAttachment) {
    const { id, name, type, size, createdAt, expiresAt } = file;
    return { id, name, type, size, createdAt, expiresAt };
  }

  private async lockWorkspace(manager: EntityManager, user: AttachmentOwner) {
    this.assertOwner(user);
    await manager.query("SET LOCAL statement_timeout = '10s'");
    await manager.query("SET LOCAL lock_timeout = '3s'");
    if (getTooljetEdition() === TOOLJET_EDITIONS.Cloud) {
      await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`ai-attachment-user:${user.id}`]);
    }
    await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      `ai-attachments:${user.organizationId}`,
    ]);
  }

  /** Only database work runs under the quota lock. The ID exists durably before any remote write. */
  async upload(user: AttachmentOwner, file: AiAttachmentUpload, signal?: AbortSignal) {
    this.assertOwner(user);
    if (!Buffer.isBuffer(file?.buffer) || file.size !== file.buffer.length || file.size > MAX_AI_ATTACHMENT_BYTES) {
      throw new BadRequestException('Choose a file of up to 10 MB.');
    }
    const name = file.originalname
      // eslint-disable-next-line no-control-regex -- strip control chars from uploaded filenames
      ?.replace(/[\u0000-\u001f\u007f]/g, '')
      .split(/[\\/]/)
      .pop()
      ?.trim();
    if (!name || name.length > 255) throw new BadRequestException('File names must contain 1–255 characters.');
    const type = /^[\w.+-]+\/[\w.+-]+$/.test(file.mimetype) ? file.mimetype : 'application/octet-stream';
    if (type.length > 255) throw new BadRequestException('Invalid file type.');
    const budget = Number(this.config.get('AI_ATTACHMENTS_MAX_WORKSPACE_BYTES') ?? 1024 * 1024 * 1024);
    if (!Number.isSafeInteger(budget) || budget <= 0) {
      throw new ServiceUnavailableException(
        'Attachment storage limit is not configured correctly. Contact your administrator.'
      );
    }
    const id = randomUUID();
    const sha256 = createHash('sha256').update(file.buffer).digest('hex');
    let reserved = false;
    try {
      signal?.throwIfAborted();
      await this.dataSource.transaction(async (manager) => {
        await this.lockWorkspace(manager, user);
        const cloud = getTooljetEdition() === TOOLJET_EDITIONS.Cloud;
        const [usage] = await manager.query(
          `SELECT COALESCE(SUM(size) FILTER (WHERE organization_id = $1), 0) AS bytes,
            COUNT(*) FILTER (WHERE organization_id = $1) AS count,
            COALESCE(SUM(size) FILTER (WHERE user_id = $2), 0) AS user_bytes,
            COUNT(*) FILTER (WHERE user_id = $2) AS user_count
          FROM ai_attachments WHERE expires_at > NOW() AND (organization_id = $1 OR ($3 AND user_id = $2))`,
          [user.organizationId, user.id, cloud]
        );
        if (
          Number(usage.bytes) + file.size > budget ||
          Number(usage.count) >= 10000 ||
          (cloud && (Number(usage.user_bytes) + file.size > budget || Number(usage.user_count) >= 10000))
        ) {
          throw new BadRequestException(
            'This workspace has reached its attachment storage limit. Contact your administrator.'
          );
        }
        const repository = manager.getRepository(AiAttachment);
        await repository.save(
          repository.create({
            id,
            organizationId: user.organizationId,
            userId: user.id,
            storageOrganizationId: user.organizationId,
            storageUserId: user.id,
            name,
            type,
            size: file.size,
            sha256,
            // Includes a safety margin beyond the remote request deadline. Crashes leave a sweepable receipt.
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            nextCleanupAt: new Date(Date.now() + 10 * 60 * 1000),
            state: 'uploading',
          })
        );
      });
      reserved = true;
      signal?.throwIfAborted();
      const uploaded = await this.agent.attachmentRequest(
        user,
        'POST',
        '',
        { ...file, id, name, type, sha256 },
        signal
      );
      if (
        uploaded.id !== id ||
        uploaded.size !== file.size ||
        uploaded.sha256 !== sha256 ||
        !Number.isFinite(uploaded.expiresAt) ||
        uploaded.expiresAt * 1000 <= Date.now()
      ) {
        throw new BadGatewayException(
          'Attachment upload integrity verification failed. Update the AI agent and retry.'
        );
      }
      signal?.throwIfAborted();
      const result = await this.repository.update(
        {
          id,
          state: 'uploading',
        },
        {
          state: 'draft',
          expiresAt: new Date(uploaded.expiresAt * 1000),
          nextCleanupAt: new Date(),
        }
      );
      if (result.affected !== 1) throw new ConflictException('Attachment upload no longer active. Please retry.');
      return this.descriptor(await this.findOwned(user, id));
    } catch (error) {
      if (reserved) {
        // Delay deletion beyond an in-flight PUT's deadline. Never lose its ID on timeout or failed finalization.
        await this.repository
          .update(
            { id },
            {
              state: 'deleting',
              nextCleanupAt: new Date(Date.now() + 5 * 60 * 1000),
            }
          )
          .catch((cleanupError) => this.diagnostic('reservation cleanup', cleanupError));
      }
      this.diagnostic('upload', error);
      if (signal?.aborted) throw error;
      if (typeof error.getStatus === 'function') throw error;
      if (
        error instanceof QueryFailedError &&
        'code' in error.driverError &&
        ['42P01', '42703'].includes(String(error.driverError.code))
      ) {
        throw new ServiceUnavailableException(
          'File uploads are unavailable because attachment setup is incomplete. Ask your administrator to apply the latest database updates.'
        );
      }
      throw new ServiceUnavailableException('File upload failed. Please retry.');
    }
  }

  private async findOwned(user: AttachmentOwner, id: string) {
    this.assertOwner(user);
    const file = await this.repository.findOne({
      where: {
        id,
        organizationId: user.organizationId,
        userId: user.id,
      },
    });
    if (!file || file.state === 'deleting') throw new NotFoundException('Attachment not found.');
    return file;
  }

  async get(user: AttachmentOwner, id: string) {
    return this.descriptor(await this.findOwned(user, id));
  }

  async prepare(user: AttachmentOwner, ids: unknown = [], previousIds: string[] = [], conversationId?: string) {
    if (!Array.isArray(ids) || ids.length > 5 || ids.some((id) => typeof id !== 'string' || !isUUID(id))) {
      throw new BadRequestException('Choose up to 5 uploaded files per message.');
    }
    const allIds = [...new Set([...previousIds, ...ids])];
    if (allIds.some((id) => typeof id !== 'string' || !isUUID(id)))
      throw new BadRequestException('Invalid attachment reference.');
    this.assertOwner(user);
    const owned = allIds.length
      ? await this.repository.find({
          where: { id: In(allIds), organizationId: user.organizationId, userId: user.id },
        })
      : [];
    const byId = new Map(owned.map((file) => [file.id, file]));
    const ready = (file?: AiAttachment) =>
      !!file && ['draft', 'attached'].includes(file.state) && new Date(file.expiresAt).getTime() > Date.now();
    for (const id of ids) {
      const file = byId.get(id);
      if (!file) throw new NotFoundException('Attachment not found. Upload it again.');
      if (!ready(file))
        throw new GoneException('This attachment has expired or is unavailable. Please attach it again.');
      if (file.state === 'attached' && file.conversationId !== conversationId) {
        const refs = await this.dataSource.query(
          `SELECT 1 FROM ai_attachment_references WHERE attachment_id = $1 AND conversation_id = $2`,
          [id, conversationId]
        );
        if (!refs.length) throw new ConflictException('This file belongs to another conversation. Upload it again.');
      }
    }
    const files = allIds.map((id) => byId.get(id)).filter(ready);
    const unavailable = previousIds.filter((id) => !ready(byId.get(id)));
    return {
      attachments: files.filter((file) => ids.includes(file.id)).map((file) => this.descriptor(file)),
      manifest: files.map((file) => this.descriptor(file)),
      notices: unavailable.length
        ? [
            'Some earlier attachments expired or are unavailable. Attach them again if needed; you can continue this conversation.',
          ]
        : [],
    };
  }

  /** Call with the message-save transaction; sharing is allowed only by the validated handoff path. */
  async retain(user: AttachmentOwner, ids: string[], manager: EntityManager, conversationId: string, shared = false) {
    if (!ids.length) return;
    await this.lockWorkspace(manager, user);
    const uniqueIds = [...new Set(ids)].sort();
    // Cleanup and retain share row locks. A fresh statement after the lock sees committed references.
    await manager.query('SELECT id FROM ai_attachments WHERE id = ANY($1::uuid[]) ORDER BY id FOR UPDATE', [uniqueIds]);
    const repository = manager.getRepository(AiAttachment);
    const files = await repository.find({
      where: { id: In(uniqueIds), organizationId: user.organizationId, userId: user.id },
    });
    if (
      files.length !== uniqueIds.length ||
      files.some(
        (file) => !['draft', 'attached'].includes(file.state) || new Date(file.expiresAt).getTime() <= Date.now()
      )
    ) {
      throw new GoneException('An attachment is unavailable. Please attach it again.');
    }
    for (const file of files) {
      if (!shared && file.state === 'attached' && file.conversationId !== conversationId) {
        const refs = await manager.query(
          'SELECT 1 FROM ai_attachment_references WHERE attachment_id = $1 AND conversation_id = $2',
          [file.id, conversationId]
        );
        if (!refs.length) throw new ConflictException('This file belongs to another conversation. Upload it again.');
      }
      await manager.query(
        `INSERT INTO ai_attachment_references (attachment_id, conversation_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [file.id, conversationId]
      );
    }
    await repository.update({ id: In(uniqueIds) }, { attachedAt: new Date(), state: 'attached' });
    // Legacy ownership is informational only; the references table determines lifetime.
    await repository.update(
      {
        id: In(uniqueIds),
        conversationId: IsNull(),
      },
      { conversationId }
    );
  }

  async removeDraft(user: AttachmentOwner, id: string) {
    await this.dataSource.transaction(async (manager) => {
      await this.lockWorkspace(manager, user);
      const repository = manager.getRepository(AiAttachment);
      const file = await repository.findOne({
        where: { id, organizationId: user.organizationId, userId: user.id },
      });
      if (!file) return;
      if (file.state === 'attached')
        throw new ConflictException('Files already attached to a conversation are retained.');
      await repository.update(
        {
          id,
        },
        {
          state: 'deleting',
          nextCleanupAt: new Date(Date.now() + (file.state === 'uploading' ? 5 * 60 * 1000 : 0)),
        }
      );
    });
    return { deleted: true };
  }

  async discardFailedSubmission(user: AttachmentOwner, ids: string[], _conversationId: string) {
    if (!ids.length) return;
    // Saving the message is the ownership boundary. Attached files are never discarded on dispatch failure.
    await this.repository.update(
      { id: In(ids), organizationId: user.organizationId, userId: user.id, state: 'draft' },
      { state: 'deleting', nextCleanupAt: new Date() }
    );
  }

  /** App deletion only marks work; it never waits on the network. Shared references survive source deletion. */
  async cleanupDeletedConversations(organizationId?: string) {
    // The scheduled sweep performs the row-locked lifetime check; app deletion never does remote work.
    await this.dataSource.query(
      `UPDATE ai_attachments SET next_cleanup_at = LEAST(next_cleanup_at, now())
      WHERE ($1::uuid IS NULL OR organization_id = $1) AND state = 'attached'`,
      [organizationId || null]
    );
  }

  /** A bounded, leased outbox batch. Remote calls use no transaction/pool connection. */
  async sweep() {
    await this.dataSource.transaction(async (manager) => {
      await manager.query("SET LOCAL statement_timeout = '10s'");
      const eligible = `state <> 'deleting' AND (expires_at <= now() OR organization_id IS NULL OR user_id IS NULL OR
        (state = 'draft' AND created_at < now() - INTERVAL '24 hours') OR
        (state = 'attached' AND NOT EXISTS (SELECT 1 FROM ai_attachment_references r WHERE r.attachment_id = a.id)))`;
      // Reconcile a bounded indexed batch, rather than scan every live attachment each minute.
      // Deletion events bring shared rows forward; the periodic pass also catches direct FK changes.
      const candidates = await manager.query(`SELECT a.id FROM ai_attachments a
        WHERE state <> 'deleting' AND next_cleanup_at <= now()
        ORDER BY next_cleanup_at, id LIMIT 100 FOR UPDATE SKIP LOCKED`);
      if (candidates.length)
        await manager.query(
          `UPDATE ai_attachments a SET
            state = CASE WHEN ${eligible} THEN 'deleting' ELSE state END,
            next_cleanup_at = CASE WHEN ${eligible} THEN next_cleanup_at
              ELSE LEAST(expires_at, now() + INTERVAL '1 hour') END
          WHERE id = ANY($1::uuid[])`,
          [candidates.map((row) => row.id)]
        );
    });
    const rows = await this.dataSource
      .query(`WITH claimed AS (UPDATE ai_attachments SET next_cleanup_at = now() + INTERVAL '15 minutes',
      cleanup_attempts = cleanup_attempts + 1 WHERE id IN (
        SELECT id FROM ai_attachments WHERE state = 'deleting' AND next_cleanup_at <= now()
        ORDER BY next_cleanup_at LIMIT 20 FOR UPDATE SKIP LOCKED)
      RETURNING id, storage_user_id, storage_organization_id, expires_at, cleanup_attempts) SELECT * FROM claimed`);
    for (let start = 0; start < rows.length; start += 4) {
      await Promise.all(
        rows.slice(start, start + 4).map(async (row) => {
          if (!row.storage_user_id || !row.storage_organization_id) {
            // Pre-migration deletions lost their scope. Keep a receipt through the configured original lifecycle.
            if (new Date(row.expires_at).getTime() + 86400000 < Date.now()) await this.repository.delete(row.id);
            return;
          }
          try {
            await this.agent.attachmentRequest(
              {
                id: row.storage_user_id,
                organizationId: row.storage_organization_id,
              },
              'DELETE',
              row.id
            );
            await this.repository.delete(row.id);
          } catch (error) {
            this.diagnostic('deletion', error);
            if (row.cleanup_attempts === 3 || row.cleanup_attempts % 12 === 0) {
              Logger.error(
                `Attachment cleanup backlog: ${row.id} failed ${row.cleanup_attempts} attempts. Check storage permissions and availability.`,
                'AiAttachmentService'
              );
            }
          }
        })
      );
    }
  }

  async download(user: AttachmentOwner, id: string, thumbnail = false) {
    const file = await this.findOwned(user, id);
    if (new Date(file.expiresAt).getTime() <= Date.now())
      throw new GoneException('This attachment has expired. Please attach it again.');
    const body = await this.agent.attachmentRequest(user, 'GET', id, thumbnail ? { thumbnail: true } : undefined);
    if (
      !Buffer.isBuffer(body) ||
      (thumbnail
        ? body.length > 64 * 1024
        : body.length !== file.size ||
          body.length > MAX_AI_ATTACHMENT_BYTES ||
          createHash('sha256').update(body).digest('hex') !== file.sha256)
    ) {
      throw new BadGatewayException('Unable to retrieve this file. Please retry.');
    }
    return { body, name: file.name, type: thumbnail ? 'image/jpeg' : file.type, size: body.length };
  }
}
