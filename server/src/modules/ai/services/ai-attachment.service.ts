import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isUUID } from 'class-validator';
import { randomUUID } from 'crypto';
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
    private readonly config: ConfigService
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
        // Bounded, opportunistic cleanup of abandoned uploads. Saved messages retain their originals.
        await manager.query(
          `DELETE FROM ai_attachments WHERE id IN (
          SELECT id FROM ai_attachments WHERE organization_id = $1 AND attached_at IS NULL
            AND created_at < NOW() - INTERVAL '24 hours'
          ORDER BY created_at LIMIT 100
        )`,
          [user.organizationId]
        );
        const [usage] = await manager.query(
          'SELECT COALESCE(SUM(size), 0) AS bytes, COUNT(*) AS count FROM ai_attachments WHERE organization_id = $1',
          [user.organizationId]
        );
        // Commit expired-draft cleanup even if the remaining quota cannot fit this upload.
        if (Number(usage.bytes) + file.size > budget || Number(usage.count) >= 10000) return null;
        const repository = manager.getRepository(AiAttachment);
        return repository.save(
          repository.create({
            id: randomUUID(),
            organizationId: user.organizationId,
            userId: user.id,
            name,
            type,
            size: file.size,
            data: file.buffer,
          })
        );
      })
      .catch(() => {
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

  private async findOwned(user: AttachmentOwner, id: string, includeData = false) {
    this.assertOwner(user);
    const file = await this.repository.findOne({
      where: {
        id,
        organizationId: user.organizationId,
        userId: user.id,
      },
      ...(includeData && {
        select: ['id', 'name', 'type', 'size', 'createdAt', 'data'] as (keyof AiAttachment)[],
      }),
    });
    if (!file) throw new NotFoundException('Attachment not found.');
    return file;
  }

  async get(user: AttachmentOwner, id: string) {
    return this.descriptor(await this.findOwned(user, id));
  }

  async prepare(user: AttachmentOwner, ids: unknown = [], previousIds: string[] = []) {
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
    if (current.some((file) => file.size > MAX_AI_ATTACHMENT_BYTES)) {
      throw new BadRequestException('Choose files of up to 10 MB each.');
    }
    return {
      attachments: current.map((file) => this.descriptor(file)),
      manifest: files.map((file) => this.descriptor(file)),
    };
  }

  // Call inside the message-save transaction. The lock also serializes draft deletion and expiry.
  async retain(user: AttachmentOwner, ids: string[], manager: EntityManager) {
    if (!ids.length) return;
    await this.lockWorkspace(manager, user);
    const uniqueIds = [...new Set(ids)];
    const result = await manager.getRepository(AiAttachment).update(
      {
        id: In(uniqueIds),
        organizationId: user.organizationId,
        userId: user.id,
      },
      { attachedAt: new Date() }
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
      await repository.delete({
        id,
        organizationId: user.organizationId,
        userId: user.id,
      });
    });
    return { deleted: true };
  }

  async download(user: AttachmentOwner, id: string) {
    const file = await this.findOwned(user, id, true);
    const body = file.data;
    if (!Buffer.isBuffer(body) || body.length !== file.size || body.length > MAX_AI_ATTACHMENT_BYTES) {
      throw new BadGatewayException('Unable to retrieve this file. Please retry.');
    }
    return { body, name: file.name, type: file.type, size: file.size };
  }
}
