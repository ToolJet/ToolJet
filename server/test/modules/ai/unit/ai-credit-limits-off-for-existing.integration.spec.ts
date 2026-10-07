/** @group working */
// Opt in only with a disposable PostgreSQL database; tables live in a private random schema.
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { CreateAiCreditLimits1791392215686 } from '../../../../migrations/1791392215686-CreateAiCreditLimits';
import { AddOffLimitsForExistingScopes1791565015686 } from '../../../../migrations/1791565015686-AddOffLimitsForExistingScopes';

const integration = process.env.AI_CREDIT_TEST_DATABASE_URL ? describe : describe.skip;
integration('AI credit limits: existing scopes keep limits off', () => {
  const schema = `ai_credit_test_${randomUUID().replace(/-/g, '')}`;
  let db: DataSource;

  const run = async (migration: { up(runner: unknown): Promise<void> }) => {
    const runner = db.createQueryRunner();
    await migration.up(runner);
    await runner.release();
  };
  const migrate = () => run(new AddOffLimitsForExistingScopes1791565015686());

  const rows = () =>
    db.query(
      `SELECT organization_id AS "organizationId", user_id AS "userId", pool, mode, value, enabled
         FROM ai_credit_limits ORDER BY organization_id NULLS FIRST, user_id NULLS FIRST, pool`
    );

  beforeAll(async () => {
    db = await new DataSource({
      type: 'postgres',
      url: process.env.AI_CREDIT_TEST_DATABASE_URL,
      extra: { options: `-c search_path=${schema}` },
    }).initialize();
    await db.query(`CREATE SCHEMA "${schema}"`);
    await db.query(`CREATE TABLE organizations (id uuid PRIMARY KEY)`);
    await run(new CreateAiCreditLimits1791392215686());
  });

  afterAll(async () => {
    await db.query(`DROP SCHEMA "${schema}" CASCADE`);
    await db.destroy();
  });

  afterEach(async () => {
    await db.query('DELETE FROM ai_credit_limits');
    await db.query('DELETE FROM organizations');
  });

  it('a fresh install (no workspaces yet) gets no rows, so new scopes start on', async () => {
    await migrate();
    expect(await rows()).toEqual([]);
  });

  it('every existing scope without default rows gets them off; scopes with rows are untouched; re-run is a no-op', async () => {
    const [plain, configured, customOnly] = ['10', '20', '30'].map((n) => `00000000-0000-0000-0000-0000000000${n}`);
    const builder = '00000000-0000-0000-0000-0000000000b1';
    await db.query(`INSERT INTO organizations (id) VALUES ($1), ($2), ($3)`, [plain, configured, customOnly]);
    await db.query(
      `INSERT INTO ai_credit_limits (organization_id, user_id, pool, mode, value, enabled) VALUES
         ($1, NULL, 'monthly', 'custom', 100, true), ($1, NULL, 'addon', 'equal_share', NULL, true),
         ($2, $3, 'monthly', 'custom', 40, true)`,
      [configured, customOnly, builder]
    );

    await migrate();
    const after = await rows();
    await migrate();

    const off = (organizationId: string | null) =>
      ['addon', 'monthly'].map((pool) => ({
        organizationId,
        userId: null,
        pool,
        mode: 'equal_share',
        value: null,
        enabled: false,
      }));
    expect(after).toEqual([
      ...off(null),
      ...off(plain),
      { organizationId: configured, userId: null, pool: 'addon', mode: 'equal_share', value: null, enabled: true },
      { organizationId: configured, userId: null, pool: 'monthly', mode: 'custom', value: 100, enabled: true },
      ...off(customOnly),
      { organizationId: customOnly, userId: builder, pool: 'monthly', mode: 'custom', value: 40, enabled: true },
    ]);
    expect(await rows()).toEqual(after);
  });

  it('puts the previous lock_timeout back, so later migrations in the transaction keep theirs', async () => {
    const runner = db.createQueryRunner();
    await runner.startTransaction();
    await runner.query(`SET LOCAL lock_timeout = '7s'`);
    await new AddOffLimitsForExistingScopes1791565015686().up(runner);
    const [{ lock_timeout }] = await runner.query('SHOW lock_timeout');
    await runner.rollbackTransaction();
    await runner.release();
    expect(lock_timeout).toBe('7s');
  });
});
