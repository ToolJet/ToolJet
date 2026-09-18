/** @group working */
import {
  BadGatewayException,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AiAttachmentService, MAX_AI_ATTACHMENT_BYTES } from '@modules/ai/services/ai-attachment.service';

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn(),
  PutObjectCommand: jest.fn(function (input) {
    this.input = input;
  }),
  GetObjectCommand: jest.fn(function (input) {
    this.input = input;
  }),
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://files.example.test/signed'),
}));

describe('AI attachment storage', () => {
  const owner = { id: '770b5f73-5608-4dc7-83a9-9728278973ef', organizationId: '0a5bad0c-acb7-45cd-8bba-5ea083241bc8' };
  const file = () => {
    const buffer = Buffer.from('product,units\nnotebook,12');
    return { buffer, size: buffer.length, originalname: 'supplies.csv', mimetype: 'text/csv' };
  };
  let service: AiAttachmentService;
  let repository: any;
  let send: jest.Mock;
  let destroy: jest.Mock;
  let env: Record<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    env = {
      AI_ATTACHMENTS_S3_BUCKET: 'attachment-demo-fixture',
      AI_ATTACHMENTS_S3_REGION: 'us-east-1',
      AI_ATTACHMENTS_S3_ACCESS_KEY_ID: 'synthetic-access-id',
      AI_ATTACHMENTS_S3_SECRET_ACCESS_KEY: 'synthetic-secret',
    };
    send = jest.fn().mockResolvedValue({});
    destroy = jest.fn();
    (S3Client as unknown as jest.Mock).mockImplementation(() => ({ send, destroy }));
    repository = {
      create: jest.fn((record) => record),
      save: jest.fn(async (record) => ({ ...record, createdAt: new Date('2026-01-01') })),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
      findOne: jest.fn(),
    };
    service = new AiAttachmentService(
      { getRepository: () => repository } as unknown as DataSource,
      { get: (key) => env[key] } as ConfigService
    );
  });

  it('persists pending metadata before upload and marks ready only after S3 confirms', async () => {
    send.mockImplementation(async () => {
      expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
      expect(repository.update).not.toHaveBeenCalled();
      return {};
    });
    const result = await service.upload(owner, file());
    expect(result).toEqual({
      id: expect.any(String),
      name: 'supplies.csv',
      type: 'text/csv',
      size: file().size,
      status: 'ready',
      createdAt: new Date('2026-01-01'),
    });
    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: env.AI_ATTACHMENTS_S3_BUCKET,
      Key: `ai-attachments/${owner.organizationId}/${owner.id}/${result.id}`,
      Body: file().buffer,
      ContentType: 'application/octet-stream',
      ContentDisposition: 'attachment',
      IfNoneMatch: '*',
    });
    expect(repository.update).toHaveBeenCalledWith(result.id, { status: 'ready' });
    expect(result).not.toHaveProperty('s3Key');
  });

  it('prepares owned current and earlier files, with fresh URLs separate from saved metadata', async () => {
    const imageId = 'df0b465b-2345-4226-943f-81a6d6e2c497';
    const csvId = '0d3e3f9e-eb2c-4586-bc63-909d4bcb7aee';
    repository.findOne.mockImplementation(async ({ where }) => ({
      id: where.id,
      name: where.id === imageId ? 'layout.png' : 'stock.csv',
      size: 80,
      type: where.id === imageId ? 'image/png' : 'text/csv',
      status: 'ready',
      s3Bucket: 'private-fixture',
      s3Key: where.id,
    }));
    const result = await service.prepare(owner, [imageId], [csvId, imageId]);
    expect(result.attachments.map((file) => file.id)).toEqual([imageId]);
    expect(result.content).toEqual(
      expect.arrayContaining([
        { type: 'input_image', image_url: 'https://files.example.test/signed' },
        { type: 'input_file', file_url: 'https://files.example.test/signed' },
      ])
    );
    expect(JSON.stringify(result.attachments)).not.toMatch(/signed|s3Bucket|s3Key/);
    expect(repository.findOne).toHaveBeenCalledTimes(2);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: csvId, organizationId: owner.organizationId, userId: owner.id, status: 'ready' },
    });
    expect(getSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.any(GetObjectCommand), { expiresIn: 14400 });
    expect(send).not.toHaveBeenCalled();
  });

  it.each([null, 'file-id', ['not-a-uuid'], Array(6).fill('df0b465b-2345-4226-943f-81a6d6e2c497')])(
    'rejects invalid attachment lists before storage access: %p',
    async (ids) => {
      await expect(service.prepare(owner, ids)).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.findOne).not.toHaveBeenCalled();
    }
  );

  it('rejects missing or cross-owner files and unsupported types', async () => {
    const id = 'df0b465b-2345-4226-943f-81a6d6e2c497';
    repository.findOne.mockResolvedValue(null);
    await expect(service.prepare(owner, [id])).rejects.toBeInstanceOf(NotFoundException);
    repository.findOne.mockResolvedValue({ id, name: 'archive.zip', size: 20 });
    await expect(service.prepare(owner, [id])).rejects.toThrow('not supported');
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it('enforces the aggregate file budget and does no storage work for text-only chats', async () => {
    expect(await service.prepare(owner)).toEqual({ attachments: [], content: [] });
    repository.findOne.mockResolvedValue({ name: 'large.pdf', size: 50 * 1024 * 1024 });
    await expect(service.prepare(owner, ['df0b465b-2345-4226-943f-81a6d6e2c497'])).rejects.toThrow('less than 50 MB');
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it('fails before writing metadata when storage is not configured', async () => {
    delete env.AI_ATTACHMENTS_S3_SECRET_ACCESS_KEY;
    await expect(service.upload(owner, file())).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repository.save).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it.each(['missing file', 'oversized', 'mismatched size', 'invalid name', 'missing workspace'])(
    'rejects %s without touching storage',
    async (reason) => {
      const input = file();
      if (reason === 'oversized') {
        input.buffer = Buffer.alloc(MAX_AI_ATTACHMENT_BYTES + 1);
        input.size = input.buffer.length;
      }
      if (reason === 'mismatched size') input.size++;
      if (reason === 'invalid name') input.originalname = '/';
      await expect(
        service.upload(
          reason === 'missing workspace' ? { ...owner, organizationId: undefined } : owner,
          reason === 'missing file' ? undefined : input
        )
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(send).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    }
  );

  it('accepts the size boundary and unknown types without parsing file content', async () => {
    const result = await service.upload(owner, {
      buffer: Buffer.alloc(MAX_AI_ATTACHMENT_BYTES),
      size: MAX_AI_ATTACHMENT_BYTES,
      originalname: 'C:\\fakepath\\sample.unknown',
      mimetype: '',
    });
    expect(result.name).toBe('sample.unknown');
    expect(result.type).toBe('application/octet-stream');
  });

  it('retains a failed record and never deletes an object after an ambiguous S3 failure', async () => {
    send.mockRejectedValue(new Error('network timeout containing sensitive AWS details'));
    await expect(service.upload(owner, file())).rejects.toThrow('File upload failed. Please retry.');
    expect(repository.update).toHaveBeenCalledWith(expect.any(String), { status: 'failed' });
    expect(send).toHaveBeenCalledTimes(1);
    expect(PutObjectCommand).toHaveBeenCalledTimes(1);
  });

  it('retains S3 objects if the final metadata update fails', async () => {
    repository.update.mockRejectedValue(new Error('database unavailable'));
    await expect(service.upload(owner, file())).rejects.toThrow('database unavailable');
    expect(send).toHaveBeenCalledTimes(1);
    expect(PutObjectCommand).toHaveBeenCalledTimes(1);
  });

  it('scopes every read to the signed-in user, workspace and ready status before touching S3', async () => {
    repository.findOne.mockResolvedValue(null);
    await expect(service.get(owner, 'unknown-file')).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.download(owner, 'unknown-file')).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 'unknown-file', organizationId: owner.organizationId, userId: owner.id, status: 'ready' },
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('reads the stored bucket/key and hides storage details in metadata and errors', async () => {
    repository.findOne.mockResolvedValue({
      id: 'saved-file',
      name: 'supplies.csv',
      type: 'text/csv',
      size: 24,
      status: 'ready',
      s3Bucket: 'original-demo-bucket',
      s3Key: 'original-object-key',
    });
    expect(await service.get(owner, 'saved-file')).not.toHaveProperty('s3Bucket');
    send.mockResolvedValue({ Body: Buffer.from('demo') });
    expect((await service.download(owner, 'saved-file')).name).toBe('supplies.csv');
    expect(GetObjectCommand).toHaveBeenCalledWith({ Bucket: 'original-demo-bucket', Key: 'original-object-key' });
    send.mockRejectedValue(new Error('AWS internal detail'));
    await expect(service.download(owner, 'saved-file')).rejects.toBeInstanceOf(BadGatewayException);
  });

  it('supports temporary credentials and releases client connections on shutdown', async () => {
    env.AI_ATTACHMENTS_S3_SESSION_TOKEN = 'synthetic-session-token';
    await service.upload(owner, file());
    expect(S3Client).toHaveBeenCalledWith(
      expect.objectContaining({
        credentials: expect.objectContaining({ sessionToken: 'synthetic-session-token' }),
      })
    );
    service.onModuleDestroy();
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
