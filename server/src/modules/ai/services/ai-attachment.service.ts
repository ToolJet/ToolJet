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
