import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { v4 as uuidv4 } from 'uuid';
import { ormconfig } from 'ormconfig';
import { lockScope } from '@ee/ai/services/credit-limits';

/** Real connections outside the suite transaction: the per-scope lock must serialize saves. */
/** @group ai */
describe('AI credit limits: per-scope save lock (real Postgres)', () => {
  let db: DataSource;

  beforeAll(async () => {
    db = await new DataSource({
      ...(ormconfig as PostgresConnectionOptions),
      name: `limits-lock-${uuidv4()}`,
      poolSize: 4,
      entities: [],
      migrations: [],
      migrationsRun: false,
    }).initialize();
  });

  afterAll(async () => {
    if (db?.isInitialized) await db.destroy();
  });

  it('a second save on the same scope waits for the first; another scope does not', async () => {
    const scope = uuidv4();
    const other = uuidv4();
    let release: () => void;
    const held = new Promise<void>((r) => (release = r));
    let firstLocked: () => void;
    const locked = new Promise<void>((r) => (firstLocked = r));
    const order: string[] = [];

    const first = db.transaction(async (m) => {
      await lockScope(m, scope);
      firstLocked();
      await held;
      order.push('first done');
    });
    await locked;
    const second = db.transaction(async (m) => {
      await lockScope(m, scope);
      order.push('second locked');
    });
    await db.transaction(async (m) => {
      await lockScope(m, other);
      order.push('other scope locked');
    });
    await new Promise((r) => setTimeout(r, 200));
    expect(order).toEqual(['other scope locked']);

    release();
    await Promise.all([first, second]);
    expect(order).toEqual(['other scope locked', 'first done', 'second locked']);
  });
});
