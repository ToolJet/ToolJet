/** @group database */
import { DataSource, QueryRunner } from 'typeorm';
import { notNullSteps, setNotNull, SHORT_LOCK_TIMEOUT_MS, withShortLock } from 'src/migration-helpers/with-short-lock';
import { createScratchDatabase, dropScratchDatabase, postgres } from '../fixtures/concurrent-pods/harness';

describe('migration-helpers/with-short-lock', () => {
  const database = `tooljet_short_lock_${process.pid}`;
  let db: DataSource;
  let runner: QueryRunner;

  beforeAll(async () => {
    await createScratchDatabase(database);
    db = await new DataSource({ type: 'postgres', ...postgres, database }).initialize();
  }, 60_000);

  beforeEach(async () => {
    await db.query('DROP TABLE IF EXISTS widgets; CREATE TABLE widgets (id int, name text)');
    runner = db.createQueryRunner();
    await runner.connect();
  });

  afterEach(async () => {
    await runner.release();
  });

  afterAll(async () => {
    await db?.destroy().catch(() => undefined);
    await dropScratchDatabase(database);
  }, 60_000);

  /** Another session reads the table inside an open transaction, as a long report query would. */
  async function holdReadLock(): Promise<QueryRunner> {
    const reader = db.createQueryRunner();
    await reader.connect();
    await reader.startTransaction();
    await reader.query('SELECT * FROM widgets');
    return reader;
  }

  async function columnIsNullable(): Promise<boolean> {
    const [{ is_nullable }] = await db.query(
      `SELECT is_nullable FROM information_schema.columns WHERE table_name = 'widgets' AND column_name = 'name'`
    );
    return is_nullable === 'YES';
  }

  describe('withShortLock | one short transaction per step', () => {
    it('should wait at most the short lock timeout per attempt, then give up', async () => {
      const reader = await holdReadLock();
      const startedAt = Date.now();

      await expect(
        withShortLock(runner, ['ALTER TABLE widgets DROP COLUMN IF EXISTS name'], { attempts: 2, retryDelayMs: 0 })
      ).rejects.toMatchObject({ driverError: { code: '55P03' } });

      expect(Date.now() - startedAt).toBeLessThan(2 * SHORT_LOCK_TIMEOUT_MS + 1500);
      await reader.rollbackTransaction();
      await reader.release();
    }, 30_000);

    it('should succeed on a retry once the reader lets go', async () => {
      const reader = await holdReadLock();
      setTimeout(() => void reader.rollbackTransaction().then(() => reader.release()), SHORT_LOCK_TIMEOUT_MS / 2);

      await withShortLock(runner, ['ALTER TABLE widgets DROP COLUMN IF EXISTS name'], { lockTimeoutMs: 200 });

      const columns = await db.query(
        `SELECT 1 FROM information_schema.columns WHERE table_name = 'widgets' AND column_name = 'name'`
      );
      expect(columns).toEqual([]);
    }, 30_000);

    it('should run inline, without its own commit, inside a transaction the caller opened', async () => {
      await runner.startTransaction();
      await withShortLock(runner, ['ALTER TABLE widgets DROP COLUMN IF EXISTS name']);
      await runner.rollbackTransaction();

      expect(await columnIsNullable()).toBe(true);
    });
  });

  describe('setNotNull | NOT NULL without a long ACCESS EXCLUSIVE scan', () => {
    it('should build the check, validate, set, drop sequence', () => {
      expect(notNullSteps('widgets', 'name')).toEqual([
        [
          'ALTER TABLE "widgets" DROP CONSTRAINT IF EXISTS "widgets_name_not_null", ' +
            'ADD CONSTRAINT "widgets_name_not_null" CHECK ("name" IS NOT NULL) NOT VALID',
        ],
        ['ALTER TABLE "widgets" VALIDATE CONSTRAINT "widgets_name_not_null"'],
        [
          'ALTER TABLE "widgets" ALTER COLUMN "name" SET NOT NULL',
          'ALTER TABLE "widgets" DROP CONSTRAINT IF EXISTS "widgets_name_not_null"',
        ],
      ]);
    });

    it('should make the column NOT NULL and leave no helper check behind', async () => {
      await db.query(`INSERT INTO widgets VALUES (1, 'a')`);

      await setNotNull(runner, 'widgets', 'name');

      expect(await columnIsNullable()).toBe(false);
      expect(await db.query(`SELECT conname FROM pg_constraint WHERE conrelid = 'widgets'::regclass`)).toEqual([]);
    });

    it('should fail on a NULL and leave no check that would refuse NULL writes', async () => {
      await db.query('INSERT INTO widgets VALUES (1, NULL)');

      await expect(setNotNull(runner, 'widgets', 'name')).rejects.toMatchObject({ driverError: { code: '23514' } });

      expect(await columnIsNullable()).toBe(true);
      await expect(db.query('INSERT INTO widgets VALUES (2, NULL)')).resolves.toBeDefined();
    });
  });
});
