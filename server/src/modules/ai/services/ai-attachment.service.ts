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
import { MAX_AI_ATTACHMENT_CONTENT_BYTES, renderAttachmentPdf } from './ai-attachment-pdf';
import { openAiAttachmentText, prepareOpenAiImage } from './ai-attachment-openai';

export const MAX_AI_ATTACHMENT_BYTES = 10 * 1024 * 1024;
type AttachmentOwner = { id: string; organizationId: string };
export type AiAttachmentUpload = { buffer: Buffer; originalname: string; mimetype: string; size: number };

@Injectable()
export class AiAttachmentService implements OnModuleDestroy {
  private client: S3Client;
  private readonly inlineCache = new Map<string, { parts: any[]; bytes: number; expires: number }>();

  // Files are immutable. Ownership is checked before every lookup; cache only transient content.
  private async cachedInline(id: string, load: () => Promise<any[]>) {
    const now = Date.now();
    for (const [key, value] of this.inlineCache) {
      if (value.expires <= now) this.inlineCache.delete(key);
    }
    const cached = this.inlineCache.get(id);
    if (cached) {
      this.inlineCache.delete(id);
      this.inlineCache.set(id, cached);
      return cached.parts;
    }
    const parts = await load();
    const bytes = Buffer.byteLength(JSON.stringify(parts));
    if (bytes <= MAX_AI_ATTACHMENT_CONTENT_BYTES) {
      let used = [...this.inlineCache.values()].reduce((sum, entry) => sum + entry.bytes, 0);
      for (const [key, entry] of this.inlineCache) {
        if (used + bytes <= 64 * 1024 * 1024) break;
        used -= entry.bytes;
        this.inlineCache.delete(key);
      }
      this.inlineCache.set(id, { parts, bytes, expires: Date.now() + 5 * 60 * 1000 });
    }
    return parts;
  }

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
    const budget = Number(this.config.get('AI_ATTACHMENTS_MAX_WORKSPACE_BYTES') ?? 1024 * 1024 * 1024);
    if (!Number.isSafeInteger(budget) || budget <= 0) {
      throw new ServiceUnavailableException(
        'Attachment storage limit is not configured correctly. Contact your administrator.'
      );
    }
    const attachment = await this.dataSource.transaction(async (manager) => {
      // Reserve quota with the pending row, serializing concurrent uploads in this workspace.
      await manager.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [
        `ai-attachments:${user.organizationId}`,
      ]);
      const [usage] = await manager.query(
        'SELECT COALESCE(SUM(size), 0) AS bytes, COUNT(*) AS count FROM ai_attachments WHERE organization_id = $1',
        [user.organizationId]
      );
      // Failed/pending uploads count too: their S3 objects may still exist and are never deleted.
      if (Number(usage.bytes) + file.size > budget || Number(usage.count) >= 10000) {
        throw new BadRequestException(
          'This workspace has reached its attachment storage limit. Contact your administrator.'
        );
      }
      return manager.getRepository(AiAttachment).save(
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
    });
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

  async prepare(
    user: AttachmentOwner,
    ids: unknown = [],
    previousIds: string[] = [],
    provider = 'openai',
    model?: { name: string; inputModalities: string[] }
  ) {
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
    if (
      provider === 'openrouter' &&
      !model?.inputModalities.includes('image') &&
      files.some((file) => /\.(png|jpe?g|webp)$/i.test(file.name))
    ) {
      throw new BadRequestException(
        `${model?.name || 'This OpenRouter model'} does not support image attachments. Choose an OpenRouter vision model or remove the image.`
      );
    }
    let pdfPages = 0;
    let contentBytes = 0;
    const prepareFile = async (file: AiAttachment) => {
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
      if (provider === 'grok' && extension === 'webp') {
        throw new BadRequestException('Grok supports PNG and JPEG images. Convert WebP files before sending.');
      }
      const label = `${ids.includes(file.id) ? 'Attached' : 'Previously attached'} file: ${file.name}`;
      const textType = provider === 'openai' ? 'input_text' : 'text';
      if (
        ['openai', 'anthropic', 'gemini', 'deepseek', 'openrouter'].includes(provider) &&
        !imageType &&
        extension !== 'pdf'
      ) {
        const parts = await this.cachedInline(file.id, async () => {
          const { body } = await this.download(user, file.id);
          return [{ type: 'text', text: await body.transformToString('utf-8') }];
        });
        const text = `${label}\n${parts[0].text}`;
        return provider === 'openai' ? openAiAttachmentText(text) : [{ type: textType, text }];
      }
      // OpenAI's hosted Agents input accepts text and images, unlike Responses' input_file.
      // Prepare content that both routes can read; route selection stays in the agent.
      if (['openai', 'deepseek', 'gemini'].includes(provider) && extension === 'pdf') {
        const pages = await this.cachedInline(provider === 'openai' ? `openai:${file.id}` : file.id, async () => {
          const { body } = await this.download(user, file.id);
          return renderAttachmentPdf(
            await body.transformToByteArray(),
            20 - pdfPages,
            MAX_AI_ATTACHMENT_CONTENT_BYTES - contentBytes,
            ...(provider === 'openai' ? [{ openai: true }] : [])
          );
        });
        pdfPages += pages.length;
        if (pdfPages > 20) {
          throw new BadRequestException(
            'Up to 20 PDF pages are supported per chat. Split the PDF or start a new chat.'
          );
        }
        return [
          { type: textType, text: label },
          ...(provider === 'openai'
            ? pages.map((page) => ({ type: 'input_image', image_url: page.image_url.url }))
            : pages),
        ];
      }
      if (provider === 'openai' && imageType) {
        const parts = await this.cachedInline(`openai:${file.id}`, async () => {
          const { body } = await this.download(user, file.id);
          return [{ type: 'input_image', image_url: await prepareOpenAiImage(await body.transformToByteArray()) }];
        });
        return [{ type: 'input_text', text: label }, ...parts];
      }
      if (provider === 'gemini' && imageType) {
        const parts = await this.cachedInline(file.id, async () => {
          const { body } = await this.download(user, file.id);
          const data = Buffer.from(await body.transformToByteArray()).toString('base64');
          return [{ type: 'image_url', image_url: { url: `data:${imageType};base64,${data}` } }];
        });
        return [{ type: 'text', text: label }, ...parts];
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
      if (provider === 'openrouter' && extension === 'pdf') {
        // OpenRouter parses PDFs for models without native file input, including text-only models.
        return [
          { type: 'text', text: label },
          { type: 'file', file: { filename: file.name, file_data: url } },
        ];
      }
      if (['gemini', 'deepseek', 'openrouter'].includes(provider)) {
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
    };
    const content = [];
    if (['openai', 'anthropic', 'gemini', 'deepseek', 'openrouter'].includes(provider)) {
      // Bound rendering memory and the serialized gateway request across current and saved files.
      for (const file of files) {
        const parts = await prepareFile(file);
        contentBytes += Buffer.byteLength(JSON.stringify(parts));
        if (contentBytes > MAX_AI_ATTACHMENT_CONTENT_BYTES) {
          throw new BadRequestException('Attachment content exceeds 20 MB. Use smaller files or start a new chat.');
        }
        content.push(...parts);
      }
    } else {
      content.push(...(await Promise.all(files.map(prepareFile))).flat());
    }
    return {
      attachments: files.filter((file) => ids.includes(file.id)).map((file) => this.descriptor(file)),
      content,
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
    this.inlineCache.clear();
    this.client?.destroy();
  }
}
