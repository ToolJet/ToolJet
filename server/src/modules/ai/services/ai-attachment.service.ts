import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  Inject,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isUUID } from 'class-validator';
import { createHash } from 'crypto';
import { getTooljetEdition } from '@helpers/utils.helper';
import { TOOLJET_EDITIONS } from '@modules/app/constants';
import { DataSource, EntityManager, In } from 'typeorm';
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
    @Inject('AI_ATTACHMENT_AGENT') private readonly agent: { attachmentRequest: (user: AttachmentOwner, method: string, id?: string, file?: any) => Promise<any> }
  ) {}

  private get repository() {
    return this.dataSource.getRepository(AiAttachment);
  }

  private assertOwner(user: AttachmentOwner) {
    if (!user?.id || !user.organizationId) throw new BadRequestException('A user and workspace are required.');
  }

  private descriptor(file: AiAttachment) {
    const { id, name, type, size, createdAt } = file;
    return { id, name, type, size, createdAt };
  }

  private async lockWorkspace(manager: EntityManager, user: AttachmentOwner) {
    this.assertOwner(user);
    if (getTooljetEdition() === TOOLJET_EDITIONS.Cloud) {
      await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [`ai-attachment-user:${user.id}`]);
    }
    await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
      `ai-attachments:${user.organizationId}`,
    ]);
  }

  async upload(user: AttachmentOwner, file: AiAttachmentUpload) {
    this.assertOwner(user);
    if (!Buffer.isBuffer(file?.buffer) || file.size !== file.buffer.length || file.size > MAX_AI_ATTACHMENT_BYTES) {
      throw new BadRequestException('Choose a file of up to 10 MB.');
    }
    const name = file.originalname
      // eslint-disable-next-line no-control-regex
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
    const attachment = await this.dataSource
      .transaction(async (manager) => {
        await this.lockWorkspace(manager, user);
        // Bounded cleanup; keep metadata if remote deletion fails so the next sweep can retry.
        const stale = await manager.query(
          `SELECT id, user_id FROM ai_attachments WHERE organization_id = $1 AND (
            (state = 'draft' AND created_at < NOW() - INTERVAL '24 hours') OR
            (state = 'attached' AND conversation_id IS NULL)) ORDER BY created_at LIMIT 100`, [user.organizationId]
        );
        for (const row of stale) {
          await this.agent.attachmentRequest({ ...user, id: row.user_id }, 'DELETE', row.id);
          await manager.getRepository(AiAttachment).delete(row.id);
        }
        const cloud = getTooljetEdition() === TOOLJET_EDITIONS.Cloud;
        const [usage] = await manager.query(
          `SELECT COALESCE(SUM(size) FILTER (WHERE organization_id = $1), 0) AS bytes,
            COUNT(*) FILTER (WHERE organization_id = $1) AS count,
            COALESCE(SUM(size) FILTER (WHERE user_id = $2), 0) AS user_bytes,
            COUNT(*) FILTER (WHERE user_id = $2) AS user_count
          FROM ai_attachments WHERE expires_at > NOW() AND (organization_id = $1 OR ($3 AND user_id = $2))`,
          [user.organizationId, user.id, cloud]
        );
        if (Number(usage.bytes) + file.size > budget || Number(usage.count) >= 10000 ||
            (cloud && (Number(usage.user_bytes) + file.size > budget || Number(usage.user_count) >= 10000))) return null;
        const sha256 = createHash('sha256').update(file.buffer).digest('hex');
        const uploaded = await this.agent.attachmentRequest(user, 'POST', '', { ...file, name, type, sha256 });
        if (!isUUID(uploaded.id) || uploaded.size !== file.size || uploaded.sha256 !== sha256 ||
            !Number.isFinite(uploaded.expiresAt) || uploaded.expiresAt * 1000 <= Date.now()) {
          throw new BadGatewayException('Attachment upload integrity verification failed.');
        }
        const repository = manager.getRepository(AiAttachment);
        return repository.save(
          repository.create({
            id: uploaded.id,
            organizationId: user.organizationId,
            userId: user.id,
            name,
            type,
            size: file.size,
            sha256,
            expiresAt: new Date(uploaded.expiresAt * 1000),
            state: 'draft',
          })
        );
      })
      .catch((error) => {
        if (typeof error.getStatus === 'function') throw error;
        // QueryFailedError contains bound parameters and driver internals; keep them out of HTTP/error logs.
        throw new ServiceUnavailableException('File upload failed. Please retry.');
      });
    if (!attachment) {
      throw new BadRequestException(
        'This workspace has reached its attachment storage limit. Contact your administrator.'
      );
    }
    return this.descriptor(attachment);
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
    if (!file) throw new NotFoundException('Attachment not found.');
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
    if (allIds.some((id) => typeof id !== 'string' || !isUUID(id))) {
      throw new BadRequestException('Invalid attachment reference.');
    }
    this.assertOwner(user);
    // Fetch only metadata in one query, even for long conversations.
    const owned = allIds.length
      ? await this.repository.find({
          where: { id: In(allIds), organizationId: user.organizationId, userId: user.id },
        })
      : [];
    if (owned.length !== allIds.length) throw new NotFoundException('Attachment not found.');
    const byId = new Map(owned.map((file) => [file.id, file]));
    const files = allIds.map((id) => byId.get(id));
    const current = files.filter((file) => ids.includes(file.id));
    if (current.some((file) => file.state === 'attached' && file.conversationId !== conversationId && !previousIds.includes(file.id))) {
      throw new ConflictException('This file belongs to another conversation. Upload it again.');
    }
    if (current.some((file) => file.size > MAX_AI_ATTACHMENT_BYTES)) {
      throw new BadRequestException('Choose files of up to 10 MB each.');
    }
    return {
      attachments: current.map((file) => this.descriptor(file)),
      manifest: files.map((file) => this.descriptor(file)),
    };
  }

  // Call inside the message-save transaction. The lock also serializes draft deletion and expiry.
  async retain(user: AttachmentOwner, ids: string[], manager: EntityManager, conversationId: string) {
    if (!ids.length) return;
    await this.lockWorkspace(manager, user);
    const uniqueIds = [...new Set(ids)];
    const repository = manager.getRepository(AiAttachment);
    const files = await repository.find({ where: { id: In(uniqueIds), organizationId: user.organizationId, userId: user.id } });
    if (files.some((file) => file.state === 'attached' && file.conversationId !== conversationId)) {
      throw new ConflictException('This file belongs to another conversation. Upload it again.');
    }
    const result = await repository.update(
      {
        id: In(uniqueIds),
        organizationId: user.organizationId,
        userId: user.id,
      },
      { attachedAt: new Date(), state: 'attached', conversationId }
    );
    if (result.affected !== uniqueIds.length) throw new NotFoundException('Attachment not found. Upload it again.');
  }

  async removeDraft(user: AttachmentOwner, id: string) {
    await this.dataSource.transaction(async (manager) => {
      await this.lockWorkspace(manager, user);
      const repository = manager.getRepository(AiAttachment);
      const file = await repository.findOne({
        where: { id, organizationId: user.organizationId, userId: user.id },
      });
      if (!file) return;
      if (file.attachedAt) throw new ConflictException('Files already attached to a conversation are retained.');
      await this.agent.attachmentRequest(user, 'DELETE', id);
      await repository.delete({
        id,
        organizationId: user.organizationId,
        userId: user.id,
      });
    });
    return { deleted: true };
  }

  async download(user: AttachmentOwner, id: string) {
    const file = await this.findOwned(user, id);
    const body = await this.agent.attachmentRequest(user, 'GET', id);
    if (!Buffer.isBuffer(body) || body.length !== file.size || body.length > MAX_AI_ATTACHMENT_BYTES ||
        createHash('sha256').update(body).digest('hex') !== file.sha256) {
      throw new BadGatewayException('Unable to retrieve this file. Please retry.');
    }
    return { body, name: file.name, type: file.type, size: file.size };
  }
}
