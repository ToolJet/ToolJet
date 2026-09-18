import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { isUUID } from 'class-validator';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { AiAttachment } from '@entities/ai_attachment.entity';

export const MAX_AI_ATTACHMENT_BYTES = 10 * 1024 * 1024;
type AttachmentOwner = { id: string; organizationId: string };
export type AiAttachmentUpload = { buffer: Buffer; originalname: string; mimetype: string; size: number };

@Injectable()
export class AiAttachmentService implements OnModuleDestroy {
  private client: S3Client;

  constructor(
    private readonly dataSource: DataSource,
    private readonly config: ConfigService
  ) {}

  private get storage() {
    const bucket = this.config.get<string>('AI_ATTACHMENTS_S3_BUCKET');
    const region = this.config.get<string>('AI_ATTACHMENTS_S3_REGION');
    const accessKeyId = this.config.get<string>('AI_ATTACHMENTS_S3_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('AI_ATTACHMENTS_S3_SECRET_ACCESS_KEY');
    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new ServiceUnavailableException('Attachment storage is not configured. Contact your administrator.');
    }
    this.client ||= new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        sessionToken: this.config.get<string>('AI_ATTACHMENTS_S3_SESSION_TOKEN') || undefined,
      },
      maxAttempts: 2,
      requestHandler: { connectionTimeout: 5000, requestTimeout: 60000 },
    });
    return { client: this.client, bucket };
  }

  private get repository() {
    return this.dataSource.getRepository(AiAttachment);
  }

  private assertOwner(user: AttachmentOwner) {
    if (!user.id || !user.organizationId) throw new BadRequestException('A user and workspace are required.');
  }

  private descriptor(file: AiAttachment) {
    const { id, name, type, size, status, createdAt } = file;
    return { id, name, type, size, status, createdAt };
  }

  async upload(user: AttachmentOwner, file: AiAttachmentUpload) {
    this.assertOwner(user);
    if (!file?.buffer || file.size !== file.buffer.length || file.size > MAX_AI_ATTACHMENT_BYTES) {
      throw new BadRequestException('Choose a file of up to 10 MB.');
    }
    // Strip path segments and control characters before persisting a display name.
    const name = file.originalname
      // eslint-disable-next-line no-control-regex
      ?.replace(/[\u0000-\u001f\u007f]/g, '')
      .split(/[\\/]/)
      .pop()
      ?.trim();
    if (!name || name.length > 255) throw new BadRequestException('File names must contain 1–255 characters.');
    const type = /^[\w.+-]+\/[\w.+-]+$/.test(file.mimetype) ? file.mimetype : 'application/octet-stream';
    if (type.length > 255) throw new BadRequestException('Invalid file type.');
    const { client, bucket } = this.storage;
    const id = randomUUID();
    const attachment = await this.repository.save(
      this.repository.create({
        id,
        organizationId: user.organizationId,
        userId: user.id,
        name,
        type,
        size: file.size,
        s3Bucket: bucket,
        s3Key: `ai-attachments/${user.organizationId}/${user.id}/${id}`,
        status: 'pending',
      })
    );
    try {
      await client.send(
        new PutObjectCommand({
          Bucket: attachment.s3Bucket,
          Key: attachment.s3Key,
          Body: file.buffer,
          ContentType: 'application/octet-stream',
          ContentDisposition: 'attachment',
          IfNoneMatch: '*',
        })
      );
    } catch {
      await this.repository.update(id, { status: 'failed' });
      throw new BadGatewayException('File upload failed. Please retry.');
    }
    // If this update fails, retain the object and pending record. Never delete from S3.
    await this.repository.update(id, { status: 'ready' });
    return this.descriptor({ ...attachment, status: 'ready' });
  }

  private async findOwned(user: AttachmentOwner, id: string) {
    this.assertOwner(user);
    const file = await this.repository.findOne({
      where: { id, organizationId: user.organizationId, userId: user.id, status: 'ready' },
    });
    if (!file) throw new NotFoundException('Attachment not found.');
    return file;
  }

  async get(user: AttachmentOwner, id: string) {
    return this.descriptor(await this.findOwned(user, id));
  }

  async prepare(user: AttachmentOwner, ids: unknown = [], previousIds: string[] = [], provider = 'openai') {
    if (!Array.isArray(ids) || ids.length > 5 || ids.some((id) => typeof id !== 'string' || !isUUID(id))) {
      throw new BadRequestException('Choose up to 5 uploaded files per message.');
    }
    const allIds = [...new Set([...previousIds, ...ids])];
    if (allIds.length > 20 || allIds.some((id) => !isUUID(id))) {
      throw new BadRequestException('Start a new chat to attach more files (20 files per chat).');
    }
    const files = await Promise.all(allIds.map((id) => this.findOwned(user, id)));
    if (files.reduce((size, file) => size + file.size, 0) >= 50 * 1024 * 1024) {
      throw new BadRequestException('Files in one chat must total less than 50 MB. Start a new chat.');
    }
    const content = await Promise.all(
      files.map(async (file) => {
        const extension = file.name.split('.').pop().toLowerCase();
        const imageType = {
          png: 'image/png',
          jpg: 'image/jpeg',
          jpeg: 'image/jpeg',
          webp: 'image/webp',
        }[extension];
        if (!imageType && !/^(pdf|csv|tsv|txt|md|json)$/.test(extension)) {
          throw new BadRequestException(
            `“${file.name}” is not supported. Use PNG, JPEG, WebP, PDF, CSV, TSV, TXT, Markdown or JSON.`
          );
        }
        const label = `${ids.includes(file.id) ? 'Attached' : 'Previously attached'} file: ${file.name}`;
        if (['anthropic', 'gemini'].includes(provider) && !imageType && extension !== 'pdf') {
          const { body } = await this.download(user, file.id);
          return [{ type: 'text', text: `${label}\n${await body.transformToString('utf-8')}` }];
        }
        const url = await getSignedUrl(
          this.storage.client,
          new GetObjectCommand({
            Bucket: file.s3Bucket,
            Key: file.s3Key,
            ResponseContentType: imageType || (extension === 'pdf' ? 'application/pdf' : 'text/plain'),
            ResponseContentDisposition: `attachment; filename*=UTF-8''${encodeURIComponent(file.name).replace(/'/g, '%27')}`,
          }),
          { expiresIn: 4 * 60 * 60 }
        );
        if (provider === 'gemini') {
          return [
            { type: 'text', text: label },
            { type: 'image_url', image_url: { url } },
          ];
        }
        if (provider === 'anthropic') {
          return [
            { type: 'text', text: label },
            { type: imageType ? 'image' : 'document', source: { type: 'url', url } },
          ];
        }
        return [
          {
            type: 'input_text',
            text: label,
          },
          imageType ? { type: 'input_image', image_url: url } : { type: 'input_file', file_url: url },
        ];
      })
    );
    return {
      attachments: files.filter((file) => ids.includes(file.id)).map((file) => this.descriptor(file)),
      content: content.flat(),
    };
  }

  async download(user: AttachmentOwner, id: string) {
    const file = await this.findOwned(user, id);
    try {
      const result = await this.storage.client.send(new GetObjectCommand({ Bucket: file.s3Bucket, Key: file.s3Key }));
      if (!result.Body) throw new Error('Missing attachment body');
      return { body: result.Body, name: file.name, size: file.size };
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new BadGatewayException('Unable to retrieve this file. Please retry.');
    }
  }

  onModuleDestroy() {
    this.client?.destroy();
  }
}
