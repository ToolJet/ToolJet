/** @group working */
// Opt in only with a disposable PostgreSQL database; all tables live in a private random schema.
import { randomUUID, createHash } from 'crypto';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { AiAttachment } from '@entities/ai_attachment.entity';
import { AiAttachmentService } from '@modules/ai/services/ai-attachment.service';
import { CreateAiAttachments1789689600000 } from '../../../../migrations/1789689600000-CreateAiAttachments';
import { HardenAiAttachmentLifecycle1790683200000 } from '../../../../migrations/1790683200000-HardenAiAttachmentLifecycle';
import { IndexAiAttachmentReconciliation1790683260000 } from '../../../../migrations/1790683260000-IndexAiAttachmentReconciliation';

const integration = process.env.ATTACHMENT_TEST_DATABASE_URL ? describe : describe.skip;
integration('attachment lifecycle with PostgreSQL', () => {
  const schema = `attachment_test_${randomUUID().replace(/-/g, '')}`;
  const owner = { id: randomUUID(), organizationId: randomUUID() };
  const app = randomUUID(),
    source = randomUUID(),
    destination = randomUUID();
  const inherited = randomUUID();
  let admin: DataSource, db: DataSource, service: AiAttachmentService;
  let agent: any, originals: Map<string, Buffer>;
  const file = () => {
    const buffer = Buffer.from('location,quantity\nGlasshouse,23');
    return {
      buffer,
      size: buffer.length,
      originalname: 'seedlings.csv',
      mimetype: 'text/csv',
    };
  };
  beforeAll(async () => {
    const url = process.env.ATTACHMENT_TEST_DATABASE_URL;
    admin = await new DataSource({ type: 'postgres', url }).initialize();
    await admin.query(`CREATE SCHEMA "${schema}"`);
    db = await new DataSource({
      type: 'postgres',
      url,
      entities: [AiAttachment],
      schema,
      extra: { options: `-c search_path=${schema}`, max: 8 },
    }).initialize();
    await db.query(`CREATE TABLE organizations (id uuid PRIMARY KEY);
      CREATE TABLE users (id uuid PRIMARY KEY);
      CREATE TABLE apps (id uuid PRIMARY KEY, organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE);
      CREATE TABLE ai_conversations (id uuid PRIMARY KEY, app_id uuid REFERENCES apps(id) ON DELETE CASCADE,
        user_id uuid REFERENCES users(id) ON DELETE CASCADE, metadata jsonb);`);
    await db.query('INSERT INTO organizations VALUES ($1)', [owner.organizationId]);
    await db.query('INSERT INTO users VALUES ($1)', [owner.id]);
    await db.query('INSERT INTO apps VALUES ($1,$2)', [app, owner.organizationId]);
    await db.query('INSERT INTO ai_conversations VALUES ($1,$3,$4,$5),($2,$3,$4,$5)', [
      source,
      destination,
      app,
      owner.id,
      JSON.stringify({ attachmentIds: [inherited] }),
    ]);
    const runner = db.createQueryRunner();
    await new CreateAiAttachments1789689600000().up(runner);
    await db.query(
      `INSERT INTO ai_attachments (id,organization_id,user_id,conversation_id,name,mime_type,size,sha256,state,expires_at)
      VALUES ($1,$2,$3,$4,'seedlings.csv','text/csv',1,$5,'attached',now()+interval '1 day')`,
      [inherited, owner.organizationId, owner.id, source, '0'.repeat(64)]
    );
    await new HardenAiAttachmentLifecycle1790683200000().up(runner);
    await runner.release();
    originals = new Map();
    agent = {
      attachmentRequest: jest.fn(async (_owner, method, id, uploaded) => {
        if (method === 'POST') {
          originals.set(uploaded.id, uploaded.buffer);
          return {
            id: uploaded.id,
            size: uploaded.size,
            sha256: createHash('sha256').update(uploaded.buffer).digest('hex'),
            expiresAt: Date.now() / 1000 + 86400,
          };
        }
        if (method === 'DELETE') originals.delete(id);
        else return originals.get(id);
      }),
    };
    service = new AiAttachmentService(db, { get: () => undefined } as unknown as ConfigService, agent);
  });
  afterAll(async () => {
    if (db?.isInitialized) await db.destroy();
    if (admin?.isInitialized) {
      await admin.query(`DROP SCHEMA "${schema}" CASCADE`);
      await admin.destroy();
    }
  });

  it('migrates existing handoff references and persists deletion scope', async () => {
    const refs = await db.query('SELECT * FROM ai_attachment_references WHERE attachment_id=$1', [inherited]);
    expect(refs).toHaveLength(2);
    const [row] = await db.query('SELECT * FROM ai_attachments WHERE id=$1', [inherited]);
    expect(row.storage_user_id).toBe(owner.id);
    expect(row.storage_organization_id).toBe(owner.organizationId);
  });

  it('adds the reconciliation index to an already migrated database and tolerates earlier copies', async () => {
    const runner = db.createQueryRunner();
    const migration = new IndexAiAttachmentReconciliation1790683260000();
    const indexes = () => db.query(
      'SELECT indexdef FROM pg_indexes WHERE schemaname=$1 AND indexname=$2',
      [schema, 'idx_ai_attachments_reconcile']
    );
    try {
      expect(await indexes()).toHaveLength(0);
      await migration.up(runner);
      await migration.up(runner); // A prior feature-branch lifecycle copy already created this index.
      const rows = await indexes();
      expect(rows).toHaveLength(1);
      expect(rows[0].indexdef).toContain('next_cleanup_at, id');
      await migration.down(runner);
      await migration.down(runner);
      expect(await indexes()).toHaveLength(0);
      await migration.up(runner);
    } finally {
      await runner.release();
    }
  });

  it('does not hold the workspace lock or a transaction while remote upload waits', async () => {
    let release: () => void;
    let started: () => void;
    const waiting = new Promise<void>((resolve) => {
      started = resolve;
    });
    const paused = new Promise<void>((resolve) => {
      release = resolve;
    });
    const real = agent.attachmentRequest.getMockImplementation();
    agent.attachmentRequest.mockImplementationOnce(async (...args) => {
      started();
      await paused;
      return real(...args);
    });
    const first = service.upload(owner, file());
    await waiting;
    try {
      const second = await service.upload(owner, file());
      expect(second.id).toBeTruthy();
      const [active] = await db.query(`SELECT count(*) FROM pg_stat_activity WHERE state='idle in transaction'
        AND query LIKE '%ai_attachments%' AND pid <> pg_backend_pid()`);
      expect(Number(active.count)).toBe(0);
    } finally {
      release();
      await first;
    }
  });

  it('keeps attached files after failed dispatch and source conversation deletion', async () => {
    const uploaded = await service.upload(owner, file());
    await db.transaction((manager) => service.retain(owner, [uploaded.id], manager, source));
    await db.transaction((manager) => service.retain(owner, [uploaded.id], manager, destination, true));
    await service.discardFailedSubmission(owner, [uploaded.id], source);
    await db.query('DELETE FROM ai_conversations WHERE id=$1', [source]);
    await service.cleanupDeletedConversations(owner.organizationId);
    await service.sweep();
    expect((await service.prepare(owner, [], [uploaded.id], destination)).manifest).toHaveLength(1);
    expect(originals.has(uploaded.id)).toBe(true);
  });

  it('restores the sole surviving handoff owner before migration rollback', async () => {
    const [before] = await db.query('SELECT conversation_id FROM ai_attachments WHERE id=$1', [inherited]);
    expect(before.conversation_id).toBeNull();
    const runner = db.createQueryRunner();
    try {
      await new IndexAiAttachmentReconciliation1790683260000().down(runner);
      await new HardenAiAttachmentLifecycle1790683200000().down(runner);
      const [after] = await db.query('SELECT conversation_id FROM ai_attachments WHERE id=$1', [inherited]);
      expect(after.conversation_id).toBe(destination);
      await new HardenAiAttachmentLifecycle1790683200000().up(runner);
      await new IndexAiAttachmentReconciliation1790683260000().up(runner);
    } finally {
      await runner.release();
    }
  });

  it('drops expired or missing history with a notice but rejects unavailable new selections', async () => {
    const uploaded = await service.upload(owner, file());
    await db.query("UPDATE ai_attachments SET expires_at=now()-interval '1 second' WHERE id=$1", [uploaded.id]);
    const prepared = await service.prepare(owner, [], [uploaded.id, randomUUID()], destination);
    expect(prepared.manifest).toEqual([]);
    expect(prepared.notices).toHaveLength(1);
    await expect(service.prepare(owner, [uploaded.id], [], destination)).rejects.toThrow('expired');
  });

  it('retains a cleanup receipt when remote storage succeeds and metadata finalization fails', async () => {
    const repository = db.getRepository(AiAttachment);
    const update = jest.spyOn(repository, 'update').mockRejectedValueOnce(new Error('Synthetic finalization failure'));
    await expect(service.upload(owner, file())).rejects.toThrow('File upload failed');
    update.mockRestore();
    const [receipt] = await db.query("SELECT * FROM ai_attachments WHERE state='deleting' AND next_cleanup_at > now()");
    expect(receipt.id).toBeTruthy();
    expect(originals.has(receipt.id)).toBe(true);
    await db.query('UPDATE ai_attachments SET next_cleanup_at=now() WHERE id=$1', [receipt.id]);
    await service.sweep();
    expect(originals.has(receipt.id)).toBe(false);
    expect(await repository.findOneBy({ id: receipt.id })).toBeNull();
  });

  it('retries deletion independently and retains ownership after user/workspace deletion', async () => {
    const uploaded = await service.upload(owner, file());
    await db.query('DELETE FROM organizations WHERE id=$1', [owner.organizationId]);
    await db.query('DELETE FROM users WHERE id=$1', [owner.id]);
    const real = agent.attachmentRequest.getMockImplementation();
    agent.attachmentRequest.mockRejectedValue(new Error('Synthetic storage outage'));
    await service.sweep();
    agent.attachmentRequest.mockImplementation(real);
    const [receipt] = await db.query('SELECT * FROM ai_attachments WHERE id=$1', [uploaded.id]);
    expect(receipt.organization_id).toBeNull();
    expect(receipt.storage_organization_id).toBe(owner.organizationId);
    await db.query('UPDATE ai_attachments SET next_cleanup_at=now() WHERE id=$1', [uploaded.id]);
    await service.sweep();
    expect(agent.attachmentRequest).toHaveBeenCalledWith(owner, 'DELETE', uploaded.id);
    expect(originals.has(uploaded.id)).toBe(false);
  });
  it('reconciles due metadata through an index without visiting unrelated future rows', async () => {
    await db.query(`INSERT INTO ai_attachments (id,name,mime_type,size,sha256,state,expires_at,next_cleanup_at)
      SELECT md5(('future-'||n)::text)::uuid,'future.csv','text/csv',1,repeat('0',64),'attached',
      now()+interval '1 day',now()+interval '1 hour' FROM generate_series(1,50000) n`);
    const due = randomUUID();
    await db.query(
      `INSERT INTO ai_attachments (id,name,mime_type,size,sha256,state,expires_at,next_cleanup_at)
      VALUES ($1,'due.csv','text/csv',1,repeat('0',64),'attached',now()+interval '1 day',now())`,
      [due]
    );
    await db.query('ANALYZE ai_attachments');
    const plan = await db.query(`EXPLAIN (FORMAT JSON) SELECT a.id FROM ai_attachments a
      WHERE state <> 'deleting' AND next_cleanup_at <= now() ORDER BY next_cleanup_at,id LIMIT 100 FOR UPDATE SKIP LOCKED`);
    expect(JSON.stringify(plan)).toMatch(/idx_ai_attachments_(reconcile|cleanup)/);
    expect(JSON.stringify(plan)).not.toContain('Seq Scan');
    await service.sweep();
    const [changed] = await db.query('SELECT state FROM ai_attachments WHERE id=$1', [due]);
    expect(changed.state).toBe('deleting');
    const [untouched] = await db.query(
      "SELECT count(*) FROM ai_attachments WHERE name='future.csv' AND state='attached'"
    );
    expect(Number(untouched.count)).toBe(50000);
  });
});
