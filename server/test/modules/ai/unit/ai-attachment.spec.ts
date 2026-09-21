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
import { MAX_AI_ATTACHMENT_CONTENT_BYTES, renderAttachmentPdf } from '@modules/ai/services/ai-attachment-pdf';

jest.mock('@modules/ai/services/ai-attachment-pdf', () => ({
  MAX_AI_ATTACHMENT_CONTENT_BYTES: 20 * 1024 * 1024,
  renderAttachmentPdf: jest.fn(),
}));

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
  let query: jest.Mock;

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
    query = jest.fn().mockResolvedValue([{ bytes: '0', count: '0' }]);
    const manager = { getRepository: () => repository, query };
    service = new AiAttachmentService(
      { ...manager, transaction: (callback) => callback(manager) } as unknown as DataSource,
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
    send.mockResolvedValue({ Body: { transformToString: async () => 'item,units\nfolder,19' } });
    const result = await service.prepare(owner, [imageId], [csvId, imageId]);
    expect(result.attachments.map((file) => file.id)).toEqual([imageId]);
    expect(result.content).toEqual(
      expect.arrayContaining([
        { type: 'input_image', image_url: 'https://files.example.test/signed' },
        { type: 'input_text', text: 'Previously attached file: stock.csv\nitem,units\nfolder,19' },
      ])
    );
    expect(JSON.stringify(result.attachments)).not.toMatch(/signed|s3Bucket|s3Key/);
    expect(repository.findOne).toHaveBeenCalledTimes(3);
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: csvId, organizationId: owner.organizationId, userId: owner.id, status: 'ready' },
    });
    expect(getSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.any(GetObjectCommand), { expiresIn: 14400 });
    expect(send).toHaveBeenCalledTimes(1);
  });

  it.each(['png', 'jpg', 'jpeg', 'pdf', 'csv', 'tsv', 'txt', 'md', 'json'])(
    'prepares fresh Grok URL blocks for owned %s files',
    async (extension) => {
      const id = '3204ab91-073a-4963-a469-bb3d029cb070';
      repository.findOne.mockResolvedValue({
        id,
        name: `inventory.${extension}`,
        size: 75,
        s3Bucket: 'fixture',
        s3Key: id,
      });
      (getSignedUrl as jest.Mock).mockResolvedValueOnce('https://files.example.test/current');
      (getSignedUrl as jest.Mock).mockResolvedValueOnce('https://files.example.test/renewed');
      const first = await service.prepare(owner, [id], [], 'grok');
      const followUp = await service.prepare(owner, [], [id], 'grok');
      const image = ['png', 'jpg', 'jpeg', 'webp'].includes(extension);
      expect(first.content).toEqual([
        { type: 'input_text', text: `Attached file: inventory.${extension}` },
        image
          ? { type: 'input_image', image_url: 'https://files.example.test/current' }
          : { type: 'input_file', file_url: 'https://files.example.test/current' },
      ]);
      expect(followUp.content[1]).toEqual(
        image
          ? { type: 'input_image', image_url: 'https://files.example.test/renewed' }
          : { type: 'input_file', file_url: 'https://files.example.test/renewed' }
      );
      expect(followUp.attachments).toEqual([]);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id, organizationId: owner.organizationId, userId: owner.id, status: 'ready' },
      });
      expect(send).not.toHaveBeenCalled();
    }
  );

  describe.each(['openai', 'anthropic', 'gemini', 'deepseek'])('%s file preparation', (provider) => {
    it.each(provider === 'anthropic' ? ['png', 'jpg', 'jpeg', 'webp', 'pdf'] : ['png', 'jpg', 'jpeg', 'webp'])(
      'prepares image and document content for %s files',
      async (extension) => {
        const id = 'c4a3bfb4-5b7e-4921-af15-a0af4ebc0063';
        repository.findOne.mockResolvedValue({
          id,
          name: `sample.${extension}`,
          size: 60,
          s3Bucket: 'fixture',
          s3Key: id,
        });
        const data = Buffer.from('synthetic-image');
        send.mockResolvedValue({ Body: { transformToByteArray: jest.fn().mockResolvedValue(data) } });
        if (provider !== 'gemini') {
          (getSignedUrl as jest.Mock).mockResolvedValueOnce('https://files.example.test/first');
          (getSignedUrl as jest.Mock).mockResolvedValueOnce('https://files.example.test/refreshed');
        }
        const first = await service.prepare(owner, [id], [], provider);
        const followUp = await service.prepare(owner, [], [id], provider);
        if (provider === 'gemini') {
          const mime = ['jpg', 'jpeg'].includes(extension) ? 'jpeg' : extension;
          expect(first.content[1]).toEqual({
            type: 'image_url',
            image_url: { url: `data:image/${mime};base64,${data.toString('base64')}` },
          });
          expect(followUp.content[1]).toEqual(first.content[1]);
          expect(send).toHaveBeenCalledTimes(1);
          expect(getSignedUrl).not.toHaveBeenCalled();
        } else {
          expect(first.content[1]).toEqual(
            provider === 'openai'
              ? { type: 'input_image', image_url: 'https://files.example.test/first' }
              : provider === 'deepseek'
                ? { type: 'image_url', image_url: { url: 'https://files.example.test/first' } }
                : {
                    type: extension === 'pdf' ? 'document' : 'image',
                    source: { type: 'url', url: 'https://files.example.test/first' },
                  }
          );
          expect(followUp.content[1]).toEqual(
            provider === 'openai'
              ? { type: 'input_image', image_url: 'https://files.example.test/refreshed' }
              : provider === 'deepseek'
                ? { type: 'image_url', image_url: { url: 'https://files.example.test/refreshed' } }
                : {
                    type: extension === 'pdf' ? 'document' : 'image',
                    source: { type: 'url', url: 'https://files.example.test/refreshed' },
                  }
          );
          expect(send).not.toHaveBeenCalled();
        }
        expect(followUp.attachments).toEqual([]);
      }
    );

    it.each(['csv', 'tsv', 'txt', 'md', 'json'])(
      'reads owned %s contents from S3 for the provider',
      async (extension) => {
        const id = 'c4a3bfb4-5b7e-4921-af15-a0af4ebc0063';
        repository.findOne.mockResolvedValue({
          id,
          name: `sample.${extension}`,
          size: 60,
          s3Bucket: 'fixture',
          s3Key: id,
        });
        send.mockResolvedValue({ Body: { transformToString: jest.fn().mockResolvedValue('aisle,boxes\nJuniper,27') } });
        const result = await service.prepare(owner, [id], [], provider);
        expect(result.content).toEqual([
          {
            type: provider === 'openai' ? 'input_text' : 'text',
            text: `Attached file: sample.${extension}\naisle,boxes\nJuniper,27`,
          },
        ]);
        expect(GetObjectCommand).toHaveBeenCalledWith({ Bucket: 'fixture', Key: id });
        expect(getSignedUrl).not.toHaveBeenCalled();
        expect(JSON.stringify(result.attachments)).not.toContain('Juniper');
      }
    );

    it('does not send a text attachment whose S3 download failed', async () => {
      const id = 'c4a3bfb4-5b7e-4921-af15-a0af4ebc0063';
      repository.findOne.mockResolvedValue({ id, name: 'sample.csv', size: 60 });
      send.mockRejectedValue(new Error('Storage unavailable'));
      await expect(service.prepare(owner, [id], [], provider)).rejects.toBeInstanceOf(BadGatewayException);
    });
  });

  it.each(['openai', 'gemini', 'deepseek'])(
    'caches owned %s PDF pages for follow-up, keeping images out of metadata',
    async (provider) => {
      const id = 'f7e10f4b-6861-4fe5-b4c4-5af5f5d9be11';
      repository.findOne.mockResolvedValue({ id, name: 'specimens.pdf', size: 90, s3Bucket: 'fixture', s3Key: id });
      const data = new Uint8Array([37, 80, 68, 70]);
      send.mockResolvedValue({ Body: { transformToByteArray: jest.fn().mockResolvedValue(data) } });
      const images = [{ type: 'image_url', image_url: { url: 'data:image/png;base64,c3ludGhldGlj' } }];
      (renderAttachmentPdf as jest.Mock).mockResolvedValue(images);
      const first = await service.prepare(owner, [id], [], provider);
      const followUp = await service.prepare(owner, [], [id], provider);
      const expectedImages =
        provider === 'openai' ? images.map((page) => ({ type: 'input_image', image_url: page.image_url.url })) : images;
      const type = provider === 'openai' ? 'input_text' : 'text';
      expect(first.content).toEqual([{ type, text: 'Attached file: specimens.pdf' }, ...expectedImages]);
      expect(followUp.content).toEqual([{ type, text: 'Previously attached file: specimens.pdf' }, ...expectedImages]);
      expect(renderAttachmentPdf).toHaveBeenCalledTimes(1);
      expect(renderAttachmentPdf).toHaveBeenCalledWith(data, 20, MAX_AI_ATTACHMENT_CONTENT_BYTES);
      expect(JSON.stringify(first.attachments)).not.toContain('base64');
      expect(followUp.attachments).toEqual([]);
      expect(getSignedUrl).not.toHaveBeenCalled();
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id, organizationId: owner.organizationId, userId: owner.id, status: 'ready' },
      });
      // Cached PDF pages must retain their provider-neutral shape when the user changes models.
      const switched = await service.prepare(owner, [], [id], 'deepseek');
      expect(switched.content.slice(1)).toEqual(images);
      expect(renderAttachmentPdf).toHaveBeenCalledTimes(1);
    }
  );

  it('shares the PDF page and content budgets across saved and new DeepSeek files', async () => {
    const ids = ['f7e10f4b-6861-4fe5-b4c4-5af5f5d9be11', '4d188f54-865f-47e6-b6e2-cbdf3c3fb274'];
    repository.findOne.mockImplementation(async ({ where }) => ({ id: where.id, name: 'specimens.pdf', size: 90 }));
    send.mockResolvedValue({ Body: { transformToByteArray: jest.fn().mockResolvedValue(new Uint8Array([1])) } });
    const images = Array(12).fill({ type: 'image_url', image_url: { url: 'data:image/png;base64,c3ludGhldGlj' } });
    (renderAttachmentPdf as jest.Mock)
      .mockResolvedValueOnce(images)
      .mockRejectedValueOnce(new BadRequestException('Page limit'));
    await expect(service.prepare(owner, [ids[1]], [ids[0]], 'deepseek')).rejects.toThrow('Page limit');
    const remaining = (renderAttachmentPdf as jest.Mock).mock.calls[1];
    expect(remaining[1]).toBe(8);
    expect(remaining[2]).toBeLessThan(MAX_AI_ATTACHMENT_CONTENT_BYTES);
  });

  it.each(['openai', 'anthropic', 'gemini', 'deepseek', 'openrouter'])(
    'counts JSON expansion of text in the %s request budget',
    async (provider) => {
      const ids = ['f7e10f4b-6861-4fe5-b4c4-5af5f5d9be11', '4d188f54-865f-47e6-b6e2-cbdf3c3fb274'];
      repository.findOne.mockImplementation(async ({ where }) => ({
        id: where.id,
        name: 'control.txt',
        size: 3 * 1024 * 1024,
      }));
      send.mockResolvedValue({
        Body: { transformToString: jest.fn().mockResolvedValue('\u0000'.repeat(3 * 1024 * 1024)) },
      });
      await expect(service.prepare(owner, ids, [], provider)).rejects.toThrow('exceeds 20 MB');
    }
  );

  it('rejects WebP on Grok before preparing a URL', async () => {
    const id = '48b2d150-3edf-44eb-afb7-26cbb1ac97c8';
    repository.findOne.mockResolvedValue({ id, name: 'diagram.webp', size: 10 });
    await expect(service.prepare(owner, [id], [], 'grok')).rejects.toThrow('Convert WebP');
    expect(getSignedUrl).not.toHaveBeenCalled();
  });

  it.each([
    { bytes: '1073741824', count: '1' },
    { bytes: '0', count: '10000' },
  ])('reserves workspace quota before any S3 write: %p', async (usage) => {
    query.mockResolvedValue([usage]);
    await expect(service.upload(owner, file())).rejects.toThrow('storage limit');
    expect(query.mock.calls[0]).toEqual([
      'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
      [`ai-attachments:${owner.organizationId}`],
    ]);
    expect(query.mock.calls[1][1]).toEqual([owner.organizationId]);
    expect(repository.save).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it('honors the configured workspace budget and rejects invalid configuration', async () => {
    env.AI_ATTACHMENTS_MAX_WORKSPACE_BYTES = String(file().size);
    await service.upload(owner, file());
    query.mockResolvedValue([{ bytes: String(file().size), count: '1' }]);
    await expect(service.upload(owner, file())).rejects.toThrow('storage limit');
    env.AI_ATTACHMENTS_MAX_WORKSPACE_BYTES = 'invalid';
    await expect(service.upload(owner, file())).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it.each(['csv', 'tsv', 'txt', 'md', 'json'])(
    'prepares OpenRouter %s files as text for text-only models',
    async (extension) => {
      const id = '239af413-5f27-40b8-a20a-c4f22a84280e';
      repository.findOne.mockResolvedValue({ id, name: `harvest.${extension}`, size: 40 });
      send.mockResolvedValue({ Body: { transformToString: jest.fn().mockResolvedValue('crop,crates\npea,17') } });
      const result = await service.prepare(owner, [id], [], 'openrouter', {
        name: 'Text Fixture',
        inputModalities: ['text'],
      });
      expect(result.content).toEqual([
        { type: 'text', text: `Attached file: harvest.${extension}\ncrop,crates\npea,17` },
      ]);
      expect(getSignedUrl).not.toHaveBeenCalled();
    }
  );

  it('prepares OpenRouter PDFs as file parts, including for text-only models and follow-ups', async () => {
    const id = '239af413-5f27-40b8-a20a-c4f22a84280e';
    repository.findOne.mockResolvedValue({ id, name: 'harvest.pdf', size: 80 });
    const model = { name: 'Text Fixture', inputModalities: ['text'] };
    for (const current of [true, false]) {
      const result = await service.prepare(owner, current ? [id] : [], current ? [] : [id], 'openrouter', model);
      expect(result.content).toEqual([
        { type: 'text', text: `${current ? 'Attached' : 'Previously attached'} file: harvest.pdf` },
        { type: 'file', file: { filename: 'harvest.pdf', file_data: 'https://files.example.test/signed' } },
      ]);
    }
    expect(renderAttachmentPdf).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
  });

  it.each(['png', 'jpg', 'jpeg', 'webp'])(
    'prepares OpenRouter %s images only when the selected model supports vision',
    async (extension) => {
      const id = '239af413-5f27-40b8-a20a-c4f22a84280e';
      repository.findOne.mockResolvedValue({ id, name: `harvest.${extension}`, size: 80 });
      const result = await service.prepare(owner, [id], [], 'openrouter', {
        name: 'Vision Fixture',
        inputModalities: ['text', 'image'],
      });
      expect(result.content[1]).toEqual({ type: 'image_url', image_url: { url: 'https://files.example.test/signed' } });
      expect(send).not.toHaveBeenCalled();
    }
  );

  it.each([undefined, { name: 'Text Fixture', inputModalities: ['text'] }])(
    'rejects current and saved images before storage access when OpenRouter vision is unavailable: %p',
    async (model) => {
      const id = '239af413-5f27-40b8-a20a-c4f22a84280e';
      repository.findOne.mockResolvedValue({ id, name: 'harvest.PNG', size: 80 });
      await expect(service.prepare(owner, [id], [], 'openrouter', model)).rejects.toThrow(
        'does not support image attachments'
      );
      await expect(service.prepare(owner, [], [id], 'openrouter', model)).rejects.toThrow(
        'does not support image attachments'
      );
      expect(getSignedUrl).not.toHaveBeenCalled();
      expect(send).not.toHaveBeenCalled();
    }
  );

  it('expires cached PDF pages and revalidates ownership even on cache hits', async () => {
    const id = '48b2d150-3edf-44eb-afb7-26cbb1ac97c8';
    repository.findOne.mockResolvedValue({ id, name: 'plots.pdf', size: 10 });
    send.mockResolvedValue({ Body: { transformToByteArray: async () => new Uint8Array([1]) } });
    (renderAttachmentPdf as jest.Mock).mockResolvedValue([
      { type: 'image_url', image_url: { url: 'data:image/png;base64,eA==' } },
    ]);
    const clock = jest.spyOn(Date, 'now').mockReturnValue(1000);
    try {
      await service.prepare(owner, [id], [], 'gemini');
      await service.prepare(owner, [], [id], 'deepseek');
      expect(renderAttachmentPdf).toHaveBeenCalledTimes(1);
      repository.findOne.mockResolvedValueOnce(null);
      await expect(service.prepare({ ...owner, id: 'another-user' }, [id], [], 'deepseek')).rejects.toBeInstanceOf(
        NotFoundException
      );
      clock.mockReturnValue(301001);
      await service.prepare(owner, [], [id], 'deepseek');
      expect(renderAttachmentPdf).toHaveBeenCalledTimes(2);
    } finally {
      clock.mockRestore();
    }
  });

  it('still enforces the page budget when every PDF is cached', async () => {
    const ids = ['f7e10f4b-6861-4fe5-b4c4-5af5f5d9be11', '4d188f54-865f-47e6-b6e2-cbdf3c3fb274'];
    repository.findOne.mockImplementation(async ({ where }) => ({ id: where.id, name: 'plots.pdf', size: 10 }));
    send.mockResolvedValue({ Body: { transformToByteArray: async () => new Uint8Array([1]) } });
    (renderAttachmentPdf as jest.Mock).mockResolvedValue(
      Array(12).fill({ type: 'image_url', image_url: { url: 'data:image/png;base64,eA==' } })
    );
    for (const id of ids) await service.prepare(owner, [id], [], 'gemini');
    for (const provider of ['openai', 'gemini', 'deepseek']) {
      await expect(service.prepare(owner, [], ids, provider)).rejects.toThrow('20 PDF pages');
    }
    expect(renderAttachmentPdf).toHaveBeenCalledTimes(2);
  });

  it('evicts older inline content when the cache exceeds its memory budget', async () => {
    const ids = Array.from({ length: 5 }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
    repository.findOne.mockImplementation(async ({ where }) => ({ id: where.id, name: 'plots.pdf', size: 10 }));
    send.mockResolvedValue({ Body: { transformToByteArray: async () => new Uint8Array([1]) } });
    (renderAttachmentPdf as jest.Mock).mockResolvedValue([
      { type: 'image_url', image_url: { url: 'data:image/png;base64,' + 'x'.repeat(17 * 1024 * 1024) } },
    ]);
    for (const id of ids) await service.prepare(owner, [id], [], 'deepseek');
    await service.prepare(owner, [], [ids[0]], 'deepseek');
    expect(renderAttachmentPdf).toHaveBeenCalledTimes(6);
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
