/** @group working */
// Opt in only with a disposable PostgreSQL database; tables live in a private random schema.
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { CreateAiCreditLimits1791392215686 } from '../../../../migrations/1791392215686-CreateAiCreditLimits';

const integration = process.env.AI_CREDIT_TEST_DATABASE_URL ? describe : describe.skip;
integration('AI credit limits table', () => {
  const schema = `ai_credit_test_${randomUUID().replace(/-/g, '')}`;
  let db: DataSource;

  const tableExists = async () =>
    (
      await db.query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'ai_credit_limits'`,
        [schema]
      )
    ).length === 1;

  /** Runs one direction in a transaction that already set lock_timeout to 7s; returns lock_timeout after it. */
  const lockTimeoutAfter = async (direction: 'up' | 'down') => {
    const runner = db.createQueryRunner();
    await runner.startTransaction();
    await runner.query(`SET LOCAL lock_timeout = '7s'`);
    await new CreateAiCreditLimits1791392215686()[direction](runner);
    const [{ lock_timeout }] = await runner.query('SHOW lock_timeout');
    await runner.rollbackTransaction();
    await runner.release();
    return lock_timeout;
  };

  const migrate = async (direction: 'up' | 'down') => {
    const runner = db.createQueryRunner();
    await new CreateAiCreditLimits1791392215686()[direction](runner);
    await runner.release();
  };

  beforeAll(async () => {
    db = await new DataSource({
      type: 'postgres',
      url: process.env.AI_CREDIT_TEST_DATABASE_URL,
      extra: { options: `-c search_path=${schema}` },
    }).initialize();
    await db.query(`CREATE SCHEMA "${schema}"`);
  });

  afterAll(async () => {
    await db.query(`DROP SCHEMA "${schema}" CASCADE`);
    await db.destroy();
  });

  it('runs inside the global migration transaction', () => {
    expect((new CreateAiCreditLimits1791392215686() as { transaction?: boolean }).transaction).toBeUndefined();
  });

  it('gives up on the table lock after 5s', async () => {
    await migrate('up');
    const holder = db.createQueryRunner();
    await holder.startTransaction();
    await holder.query(`LOCK TABLE ai_credit_limits IN ACCESS SHARE MODE`);
    const runner = db.createQueryRunner();
    await runner.startTransaction();
    try {
      const started = Date.now();
      await expect(new CreateAiCreditLimits1791392215686().down(runner)).rejects.toThrow(/lock timeout/);
      expect(Date.now() - started).toBeLessThan(6500);
    } finally {
      await runner.rollbackTransaction();
      await runner.release();
      await holder.rollbackTransaction();
      await holder.release();
      await migrate('down');
    }
  }, 15_000);

  it('puts the previous lock_timeout back, so later migrations in the transaction keep theirs', async () => {
    expect(await lockTimeoutAfter('up')).toBe('7s');
    expect(await lockTimeoutAfter('down')).toBe('7s');
  });

  it('creates the table and is safe to re-run; down drops it', async () => {
    await migrate('up');
    await migrate('up');
    expect(await tableExists()).toBe(true);
    await migrate('down');
    await migrate('down');
    expect(await tableExists()).toBe(false);
  });
});
