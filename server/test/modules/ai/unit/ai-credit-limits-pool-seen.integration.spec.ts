/** @group working */
// Opt in only with a disposable PostgreSQL database; tables live in a private random schema.
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { AddPoolSeenToAiCreditLimits1791478615686 } from '../../../../migrations/1791478615686-AddPoolSeenToAiCreditLimits';

const integration = process.env.AI_CREDIT_TEST_DATABASE_URL ? describe : describe.skip;
integration('AI credit limits pool-seen columns', () => {
  const schema = `ai_credit_test_${randomUUID().replace(/-/g, '')}`;
  let db: DataSource;

  const columns = async () =>
    (
      await db.query(
        `SELECT column_name FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = 'ai_credit_limits' ORDER BY column_name`,
        [schema]
      )
    ).map((c: { column_name: string }) => c.column_name);

  /** Runs one direction in a transaction that already set lock_timeout to 7s; returns lock_timeout after it. */
  const lockTimeoutAfter = async (direction: 'up' | 'down') => {
    const runner = db.createQueryRunner();
    await runner.startTransaction();
    await runner.query(`SET LOCAL lock_timeout = '7s'`);
    await new AddPoolSeenToAiCreditLimits1791478615686()[direction](runner);
    const [{ lock_timeout }] = await runner.query('SHOW lock_timeout');
    await runner.rollbackTransaction();
    await runner.release();
    return lock_timeout;
  };

  const migrate = async (direction: 'up' | 'down') => {
    const runner = db.createQueryRunner();
    await new AddPoolSeenToAiCreditLimits1791478615686()[direction](runner);
    await runner.release();
  };

  beforeAll(async () => {
    db = await new DataSource({
      type: 'postgres',
      url: process.env.AI_CREDIT_TEST_DATABASE_URL,
      extra: { options: `-c search_path=${schema}` },
    }).initialize();
    await db.query(`CREATE SCHEMA "${schema}"`);
    await db.query(`CREATE TABLE ai_credit_limits (id uuid PRIMARY KEY)`);
  });

  afterAll(async () => {
    await db.query(`DROP SCHEMA "${schema}" CASCADE`);
    await db.destroy();
  });

  it('runs inside the global migration transaction', () => {
    expect((new AddPoolSeenToAiCreditLimits1791478615686() as { transaction?: boolean }).transaction).toBeUndefined();
  });

  it('gives up on the table lock after 5s', async () => {
    const holder = db.createQueryRunner();
    await holder.startTransaction();
    await holder.query(`LOCK TABLE ai_credit_limits IN ACCESS SHARE MODE`);
    const runner = db.createQueryRunner();
    await runner.startTransaction();
    try {
      const started = Date.now();
      await expect(new AddPoolSeenToAiCreditLimits1791478615686().up(runner)).rejects.toThrow(/lock timeout/);
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

  it('adds the nullable columns and is safe to re-run; down removes only them', async () => {
    await migrate('up');
    await migrate('up');
    expect(await columns()).toEqual(['id', 'notice', 'seen_ends_at', 'seen_plan']);
    await migrate('down');
    await migrate('down');
    expect(await columns()).toEqual(['id']);
  });
});
