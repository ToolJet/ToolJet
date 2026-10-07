/** @group working */
// Opt in only with a disposable PostgreSQL database; tables live in a private random schema.
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { AddUserIdToAiCreditHistory1791305815686 } from '../../../../migrations/1791305815686-AddUserIdToAiCreditHistory';

const integration = process.env.AI_CREDIT_TEST_DATABASE_URL ? describe : describe.skip;
integration('AI credit history attribution columns', () => {
  const schema = `ai_credit_test_${randomUUID().replace(/-/g, '')}`;
  let db: DataSource;

  const columns = async (table: string) =>
    (
      await db.query(
        `SELECT column_name, is_nullable FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = $2 AND column_name IN ('user_id', 'organization_id')
         ORDER BY column_name`,
        [schema, table]
      )
    ).map((c: { column_name: string; is_nullable: string }) => `${c.column_name}:${c.is_nullable}`);

  /** Runs one direction in a transaction that already set lock_timeout to 7s; returns lock_timeout after it. */
  const lockTimeoutAfter = async (direction: 'up' | 'down') => {
    const runner = db.createQueryRunner();
    await runner.startTransaction();
    await runner.query(`SET LOCAL lock_timeout = '7s'`);
    await new AddUserIdToAiCreditHistory1791305815686()[direction](runner);
    const [{ lock_timeout }] = await runner.query('SHOW lock_timeout');
    await runner.rollbackTransaction();
    await runner.release();
    return lock_timeout;
  };

  const migrate = async (direction: 'up' | 'down') => {
    const runner = db.createQueryRunner();
    await new AddUserIdToAiCreditHistory1791305815686()[direction](runner);
    await runner.release();
  };

  beforeAll(async () => {
    db = await new DataSource({
      type: 'postgres',
      url: process.env.AI_CREDIT_TEST_DATABASE_URL,
      extra: { options: `-c search_path=${schema}` },
    }).initialize();
    await db.query(`CREATE SCHEMA "${schema}"`);
    await db.query(`CREATE TABLE organization_ai_credit_history (id uuid PRIMARY KEY, organization_id uuid NOT NULL);
      CREATE TABLE selfhost_customers_ai_credit_history (id uuid PRIMARY KEY, selfhost_customer_id uuid NOT NULL);`);
  });

  afterAll(async () => {
    await db.query(`DROP SCHEMA "${schema}" CASCADE`);
    await db.destroy();
  });

  it('runs inside the global migration transaction', () => {
    expect((new AddUserIdToAiCreditHistory1791305815686() as { transaction?: boolean }).transaction).toBeUndefined();
  });

  it('gives up on its table locks after 5s instead of queueing charges', async () => {
    const holder = db.createQueryRunner();
    await holder.startTransaction();
    await holder.query(`LOCK TABLE organization_ai_credit_history IN ACCESS SHARE MODE`);
    const runner = db.createQueryRunner();
    await runner.startTransaction();
    try {
      const started = Date.now();
      await expect(new AddUserIdToAiCreditHistory1791305815686().up(runner)).rejects.toThrow(/lock timeout/);
      expect(Date.now() - started).toBeLessThan(6500);
    } finally {
      await runner.rollbackTransaction();
      await runner.release();
      await holder.rollbackTransaction();
      await holder.release();
    }
  }, 15_000);

  it('puts the previous lock_timeout back, so later migrations in the transaction keep theirs', async () => {
    expect(await lockTimeoutAfter('up')).toBe('7s');
    expect(await lockTimeoutAfter('down')).toBe('7s');
  });

  it('adds nullable attribution columns and is safe to re-run', async () => {
    await migrate('up');
    await migrate('up');
    expect(await columns('organization_ai_credit_history')).toEqual(['organization_id:NO', 'user_id:YES']);
    expect(await columns('selfhost_customers_ai_credit_history')).toEqual(['organization_id:YES', 'user_id:YES']);
  });

  it('down removes only the added columns', async () => {
    await migrate('up');
    await migrate('down');
    expect(await columns('organization_ai_credit_history')).toEqual(['organization_id:NO']);
    expect(await columns('selfhost_customers_ai_credit_history')).toEqual([]);
  });
});
