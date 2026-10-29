/** @group working */
import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  GoneException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { DataSource, getMetadataArgsStorage, QueryFailedError } from 'typeorm';
import { AiAttachment } from '@entities/ai_attachment.entity';
import { AiAttachmentService, MAX_AI_ATTACHMENT_BYTES } from '@modules/ai/services/ai-attachment.service';
import { CreateAiAttachments1789689600000 } from '../../../../migrations/1789689600000-CreateAiAttachments';

const ids = Array.from({ length: 6 }, (_, i) => `02bf02ad-e9fd-4b70-8061-${String(i).padStart(12, '0')}`);
const digest = (data: Buffer) => createHash('sha256').update(data).digest('hex');

describe('Agent-backed attachment metadata', () => {
  const owner = {
    id: '8c5fcb13-d44e-461d-8af2-027704920291',
    organizationId: '090fd9de-804e-4268-b887-458095f911a1',
  };
  const file = (buffer = Buffer.from('station,visits\nCedar,31')) => ({
    buffer,
    size: buffer.length,
    originalname: 'visits.csv',
    mimetype: 'text/csv',
  });
  let service: AiAttachmentService;
  let repository: any;
  let manager: any;
  let env: Record<string, string>;
  let query: jest.Mock;
  let records: Map<string, any>;
  let originals: Map<string, Buffer>;
  let agent: any;

  beforeEach(() => {
    jest.clearAllMocks();
    records = new Map();
    originals = new Map();
    agent = {
      attachmentRequest: jest.fn(async (_owner, method, id, uploaded) => {
        if (method === 'POST') {
          const id = uploaded.id;
          originals.set(id, uploaded.buffer);
          return { id, size: uploaded.size, sha256: digest(uploaded.buffer), expiresAt: Date.now() / 1000 + 86400 };
        }
        if (method === 'GET') return originals.get(id);
        originals.delete(id);
      }),
    };

    env = {};
    const matches = (record, where) =>
      Object.entries(where).every(([key, value]: [string, any]) =>
        value?._type === 'in'
          ? value._value.includes(record[key])
          : value?._type === 'isNull'
            ? record[key] == null
            : record[key] === value
      );
    repository = {
      create: jest.fn((record) => record),
      save: jest.fn(async (record) => {
        const saved = { ...record, createdAt: new Date('2026-04-15') };
        records.set(saved.id, saved);
        return saved;
      }),
      update: jest.fn(async (where, values) => {
        const selected = [...records.values()].filter((record) => matches(record, where));
        for (const record of selected) Object.assign(record, values);
        return { affected: selected.length };
      }),
      delete: jest.fn(async ({ id }) => records.delete(id)),
      find: jest.fn(async ({ where }) =>
        [...records.values()]
          .filter((record) => matches(record, where))
          .map((record) => {
            const metadata = { ...record };
            delete metadata.data;
            return metadata;
          })
      ),
      findOne: jest.fn(async ({ where, select }) => {
        const record = [...records.values()].find((record) => matches(record, where));
        if (!record) return null;
        if (select) return Object.fromEntries(select.map((key) => [key, record[key]]));
        const metadata = { ...record };
        delete metadata.data;
        return metadata;
      }),
    };
    query = jest
      .fn()
      .mockImplementation(async (sql) => (sql.includes('SUM(size)') ? [{ bytes: '0', count: '0' }] : []));
    manager = { getRepository: () => repository, query };
    service = new AiAttachmentService(
      {
        ...manager,
        transaction: (callback) => callback(manager),
      } as unknown as DataSource,
      { get: (key) => env[key] } as ConfigService,
      agent
    );
  });

  it('stores only verified metadata in PostgreSQL and proxies exact original bytes', async () => {
    const upload = file();
    const result = await service.upload(owner, upload);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save.mock.calls[0][0]).not.toHaveProperty('data');
    expect(repository.save.mock.calls[0][0].sha256).toBe(digest(upload.buffer));
    expect(query.mock.calls.some(([sql]) => sql.includes('pg_advisory_xact_lock'))).toBe(true);
    expect(query.mock.calls.some(([sql]) => sql.includes('DELETE'))).toBe(false);
    expect(Object.keys(result).sort()).toEqual(['createdAt', 'expiresAt', 'id', 'name', 'size', 'type']);
    expect(digest((await service.download(owner, result.id)).body)).toBe(digest(upload.buffer));
  });

  it('accepts five exact 10 MiB originals and a 50 MiB message, with earlier files outside that limit', async () => {
    const bytes = Buffer.alloc(MAX_AI_ATTACHMENT_BYTES, 0xab);
    const uploads = [];
    for (let i = 0; i < 6; i++) uploads.push(await service.upload(owner, file(bytes)));
    const prepared = await service.prepare(
      owner,
      uploads.slice(1).map((record) => record.id),
      [uploads[0].id]
    );
    expect(prepared.attachments).toHaveLength(5);
    expect(prepared.manifest).toHaveLength(6);
    expect(prepared.attachments.reduce((sum, record) => sum + record.size, 0)).toBe(50 * 1024 * 1024);
    expect(JSON.stringify(prepared).length).toBeLessThan(4000);
    for (const upload of uploads) expect(digest((await service.download(owner, upload.id)).body)).toBe(digest(bytes));
  });

  it('allows arbitrary file types, zero-byte files, long conversations, and metadata-only preparation', async () => {
    const uploaded = await service.upload(owner, {
      ...file(Buffer.alloc(0)),
      originalname: 'archive.custom',
      mimetype: 'invalid',
    });
    expect(uploaded.type).toBe('application/octet-stream');
    const result = await service.prepare(owner, [uploaded.id], [uploaded.id]);
    expect(result.manifest).toEqual([uploaded]);
    expect(repository.find).toHaveBeenCalledTimes(1);
    expect(repository.find.mock.calls.every(([options]) => !options.select)).toBe(true);
    expect(result).not.toHaveProperty('content');
  });

  it('has no binary ORM column and keeps database failures free of byte parameters', async () => {
    const columns = getMetadataArgsStorage().columns.filter((entry) => entry.target === AiAttachment);
    expect(columns.some((entry) => entry.options.type === 'bytea' || entry.propertyName === 'data')).toBe(false);
    repository.save.mockRejectedValue(new Error('private binary parameters'));
    await expect(service.upload(owner, file())).rejects.toThrow('File upload failed. Please retry.');
  });

  it.each(['42P01', '42703'])(
    'explains incomplete database setup without exposing SQL or file data (%s)',
    async (code) => {
      repository.save.mockRejectedValue(
        new QueryFailedError(
          'INSERT INTO attachment_receipt VALUES ($1)',
          ['synthetic private file bytes'],
          Object.assign(new Error('internal schema detail'), { code })
        )
      );
      await expect(service.upload(owner, file())).rejects.toThrow(
        'File uploads are unavailable because attachment setup is incomplete. Ask your administrator to apply the latest database updates.'
      );
      expect(agent.attachmentRequest).not.toHaveBeenCalled();
    }
  );

  it.each([null, 'not-an-array', ids, ['not-a-uuid']])(
    'rejects invalid or excessive message IDs: %p',
    async (value) => {
      await expect(service.prepare(owner, value)).rejects.toBeInstanceOf(BadRequestException);
      expect(repository.find).not.toHaveBeenCalled();
    }
  );

  it('rejects oversized originals and invalid byte counts before saving', async () => {
    await expect(service.upload(owner, file(Buffer.alloc(MAX_AI_ATTACHMENT_BYTES + 1)))).rejects.toBeInstanceOf(
      BadRequestException
    );
    await expect(service.upload(owner, { ...file(), size: 1 })).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('enforces both quota limits and rejects invalid configuration', async () => {
    query.mockImplementation(async (sql) => (sql.includes('SUM(size)') ? [{ bytes: '1073741824', count: '1' }] : []));
    await expect(service.upload(owner, file())).rejects.toBeInstanceOf(BadRequestException);
    query.mockImplementation(async (sql) => (sql.includes('SUM(size)') ? [{ bytes: '0', count: '10000' }] : []));
    await expect(service.upload(owner, file())).rejects.toBeInstanceOf(BadRequestException);
    env.AI_ATTACHMENTS_MAX_WORKSPACE_BYTES = 'invalid';
    await expect(service.upload(owner, file())).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('rejects cross-user and cross-workspace access before reading content', async () => {
    const uploaded = await service.upload(owner, file());
    for (const outsider of [
      { ...owner, id: 'other-user' },
      { ...owner, organizationId: 'other-workspace' },
    ]) {
      await expect(service.prepare(outsider, [uploaded.id])).rejects.toBeInstanceOf(NotFoundException);
      await expect(service.download(outsider, uploaded.id)).rejects.toBeInstanceOf(NotFoundException);
      await service.removeDraft(outsider, uploaded.id);
    }
    expect(records.has(uploaded.id)).toBe(true);
  });

  it('retains submitted originals using the same lock as draft cleanup, leaving preflight files removable', async () => {
    const first = await service.upload(owner, file());
    const second = await service.upload(owner, file());
    await service.prepare(owner, [first.id, second.id]);
    await service.removeDraft(owner, second.id);
    await service.retain(owner, [first.id], manager, 'synthetic-thread');
    expect(records.get(first.id).attachedAt).toBeInstanceOf(Date);
    await expect(service.removeDraft(owner, first.id)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.retain(owner, [second.id], manager, 'synthetic-thread')).rejects.toBeInstanceOf(GoneException);
    expect(await service.removeDraft(owner, second.id)).toEqual({
      deleted: true,
    });
    expect(records.has(first.id)).toBe(true);
  });

  it('app deletion only schedules cleanup, without a remote call', async () => {
    await service.cleanupDeletedConversations(owner.organizationId);
    expect(agent.attachmentRequest).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledWith(expect.stringContaining('next_cleanup_at'), [owner.organizationId]);
  });

  it('checks the owner again when retaining files', async () => {
    const uploaded = await service.upload(owner, file());
    await expect(
      service.retain({ ...owner, id: 'other-user' }, [uploaded.id], manager, 'synthetic-thread')
    ).rejects.toBeInstanceOf(GoneException);
    expect(records.get(uploaded.id).attachedAt).toBeUndefined();
  });

  it('preserves already-retained originals after a failed dispatch', async () => {
    const uploaded = await service.upload(owner, file());
    await service.retain(owner, [uploaded.id], manager, 'failed-chat');
    await service.discardFailedSubmission(owner, [uploaded.id], 'failed-chat');
    expect(originals.has(uploaded.id)).toBe(true);
    expect(records.get(uploaded.id).state).toBe('attached');
  });

  it('failed-submission cleanup cannot delete another user or conversation originals', async () => {
    const uploaded = await service.upload(owner, file());
    await service.retain(owner, [uploaded.id], manager, 'different-chat');
    await service.discardFailedSubmission(owner, [uploaded.id], 'failed-chat');
    await service.discardFailedSubmission({ ...owner, id: 'other-user' }, [uploaded.id], 'different-chat');
    expect(originals.has(uploaded.id)).toBe(true);
    expect(records.has(uploaded.id)).toBe(true);
  });

  it('rejects corrupted stored byte counts', async () => {
    const uploaded = await service.upload(owner, file());
    originals.set(uploaded.id, Buffer.alloc(1));
    await expect(service.download(owner, uploaded.id)).rejects.toBeInstanceOf(BadGatewayException);
  });
});

describe('attachment storage migration', () => {
  it('creates metadata with retention, digest, conversation ownership and indexes', async () => {
    const query = jest.fn();
    await new CreateAiAttachments1789689600000().up({ query } as any);
    const sql = query.mock.calls.flat().join('\n');
    expect(sql).not.toContain('bytea');
    expect(sql).toContain('"sha256" varchar(64) NOT NULL');
    expect(sql).toContain('"expires_at" timestamptz NOT NULL');
    expect(sql).toContain('REFERENCES "ai_conversations"');
    expect(sql).toContain('"attached_at" timestamptz');
    expect(sql).toContain('"size" BETWEEN 0 AND 10485760');
    expect(sql).not.toContain('"status"');
    expect(sql).toContain('REFERENCES "organizations"("id") ON DELETE SET NULL');
    expect(sql).toContain('REFERENCES "users"("id") ON DELETE SET NULL');
    expect(sql).toContain('"idx_ai_attachments_owner"');
    expect(sql).toContain('"idx_ai_attachments_user"');
  });
});
