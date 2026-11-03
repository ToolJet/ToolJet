/** @group working */
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { reserveAttachmentUpload, MAX_OWNER_UPLOADS } from '@modules/ai/services/ai-attachment-admission';

const integration = process.env.ATTACHMENT_TEST_DATABASE_URL ? describe : describe.skip;
integration('ToolJet-owned attachment admission with PostgreSQL', () => {
  let db: DataSource;
  const schema = `admission_test_${randomUUID().replace(/-/g, '')}`;
  const user = randomUUID();
  const reserve = (owner: string, userId?: string, purpose: 'original' | 'provider' = 'original') =>
    reserveAttachmentUpload((operation) => db.transaction(operation), owner, userId, purpose);
  beforeAll(async () => {
    db = await new DataSource({
      type: 'postgres',
      url: process.env.ATTACHMENT_TEST_DATABASE_URL,
      extra: { options: `-c search_path=${schema}`, max: 8 },
    }).initialize();
    await db.query(`CREATE SCHEMA "${schema}"`);
    await db.query(`CREATE TABLE ai_attachment_admissions (id uuid PRIMARY KEY, owner varchar(160) NOT NULL,
      user_id uuid, purpose varchar(16) NOT NULL CHECK (purpose IN ('original','provider')),
      created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL);
      CREATE INDEX idx_admissions_owner ON ai_attachment_admissions(owner,purpose,expires_at);
      CREATE INDEX idx_admissions_user ON ai_attachment_admissions(user_id,purpose,expires_at) WHERE user_id IS NOT NULL;
      CREATE INDEX idx_admissions_expiry ON ai_attachment_admissions(expires_at);`);
  });
  afterAll(async () => {
    if (db?.isInitialized) {
      await db.query(`DROP SCHEMA "${schema}" CASCADE`);
      await db.destroy();
    }
  });
  it('serializes cross-workspace user attempts, preserves independent budgets, and persists failed attempts', async () => {
    await db.query(
      `INSERT INTO ai_attachment_admissions
      SELECT md5(n::text)::uuid,'organization:greenhouse-'||n,$1,'original',now(),now()+interval '1 day'
      FROM generate_series(1,$2) n`,
      [user, MAX_OWNER_UPLOADS - 1]
    );
    const race = await Promise.allSettled(Array.from({ length: 8 }, (_, i) => reserve(`organization:race-${i}`, user)));
    expect(race.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    for (const result of race.filter((r) => r.status === 'rejected')) {
      expect((result as PromiseRejectedResult).reason.getStatus()).toBe(429);
    }
    await reserve('organization:greenhouse-1', user, 'provider');
    // A provider failure after admission cannot refund an attempt by deleting the original.
    const rows = await db.query('SELECT purpose,count(*) FROM ai_attachment_admissions GROUP BY purpose');
    expect(Object.fromEntries(rows.map((r) => [r.purpose, Number(r.count)]))).toEqual({
      original: MAX_OWNER_UPLOADS,
      provider: 1,
    });
  });
  it('rejects invalid identities and reclaims expired attempt allowance', async () => {
    await expect(reserve('arbitrary-owner', user)).rejects.toMatchObject({ status: 401 });
    await expect(reserve('organization:greenhouse', 'bad-user')).rejects.toMatchObject({ status: 400 });
    await db.query(`UPDATE ai_attachment_admissions SET expires_at=now()-interval '1 second'`);
    expect(await reserve('organization:greenhouse', user)).toBeGreaterThan(Date.now());
    expect((await db.query('SELECT count(*) FROM ai_attachment_admissions'))[0].count).toBe('2');
  });
});
