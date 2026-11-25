/** @group database */
import { randomUUID } from 'crypto';
import { DataSource, QueryRunner } from 'typeorm';
import { ReconcileCodeModeBuildMode1795497107000 } from '@migrations/data/1795497107000-ReconcileCodeModeBuildMode';
import { createScratchDatabase, dropScratchDatabase, postgres } from '../fixtures/harness';

describe('Code Mode build-mode reconcile', () => {
  const database = `tooljet_code_mode_reconcile_${process.pid}`;
  let db: DataSource;
  let runner: QueryRunner;
  const migration = new ReconcileCodeModeBuildMode1795497107000();

  beforeAll(async () => {
    await createScratchDatabase(database);
    db = await new DataSource({ type: 'postgres', ...postgres, database }).initialize();
  });

  beforeEach(async () => {
    runner = db.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    await runner.query(`
      CREATE TEMP TABLE apps (id uuid PRIMARY KEY, build_mode text DEFAULT 'visual',
        CONSTRAINT apps_build_mode_check CHECK (build_mode IN ('visual', 'code')));
      CREATE TEMP TABLE app_versions (id uuid PRIMARY KEY, app_id uuid);
      CREATE TEMP TABLE pages (id uuid PRIMARY KEY, app_version_id uuid);
      CREATE TEMP TABLE components (id uuid PRIMARY KEY, page_id uuid, type text, parent text, properties json);
      CREATE TEMP TABLE code_mode_sources (id uuid PRIMARY KEY, app_version_id uuid);
    `);
  });

  afterEach(async () => {
    await runner.rollbackTransaction();
    await runner.release();
  });

  afterAll(async () => {
    await db?.destroy();
    await dropScratchDatabase(database);
  });

  async function seedApp(mode = 'visual'): Promise<{ appId: string; versionId: string; pageId: string }> {
    const appId = randomUUID();
    const versionId = randomUUID();
    const pageId = randomUUID();
    await runner.query('INSERT INTO apps VALUES ($1, $2)', [appId, mode]);
    await runner.query('INSERT INTO app_versions VALUES ($1, $2)', [versionId, appId]);
    await runner.query('INSERT INTO pages VALUES ($1, $2)', [pageId, versionId]);
    return { appId, versionId, pageId };
  }

  async function withComponent(type: string, value?: unknown, parent: string | null = null): Promise<string> {
    const { appId, pageId } = await seedApp();
    // A NUL in unrelated code made JSON operators fail for the whole query.
    const properties = JSON.stringify({ code: { value: 'sheet\u0000REF' }, codePage: { value } });
    await runner.query('INSERT INTO components VALUES ($1, $2, $3, $4, $5::json)', [
      randomUUID(),
      pageId,
      type,
      parent,
      properties,
    ]);
    return appId;
  }

  async function modeOf(appId: string): Promise<string> {
    const [app] = await runner.query('SELECT build_mode FROM apps WHERE id = $1', [appId]);
    return app.build_mode;
  }

  it('should switch a visual app with a code page root to code, leaving its components as stored', async () => {
    const ids = [
      await withComponent('LibraryComponent', '{{true}}'),
      await withComponent('PackComponent', true),
      await withComponent('LibraryComponent', 'true', ''),
    ];
    const before = await runner.query('SELECT id, properties::text FROM components ORDER BY id');
    await migration.up(runner);
    expect(await Promise.all(ids.map(modeOf))).toEqual(['code', 'code', 'code']);
    expect(await runner.query('SELECT id, properties::text FROM components ORDER BY id')).toEqual(before);
  });

  it('should switch a visual app that has stored code', async () => {
    const { appId, versionId } = await seedApp();
    await runner.query('INSERT INTO code_mode_sources VALUES ($1, $2)', [randomUUID(), versionId]);
    await migration.up(runner);
    expect(await modeOf(appId)).toBe('code');
  });

  it('should leave visual apps without code alone: nested roots, other types, false or missing flags', async () => {
    const ids = [
      await withComponent('LibraryComponent', true, 'container'),
      await withComponent('CustomComponent', true),
      await withComponent('PackComponent', false),
      await withComponent('LibraryComponent'),
    ];
    await migration.up(runner);
    expect(await Promise.all(ids.map(modeOf))).toEqual(['visual', 'visual', 'visual', 'visual']);
  });

  it('should keep Code mode apps and be safe to rerun', async () => {
    const { appId: existing } = await seedApp('code');
    const switched = await withComponent('PackComponent', true);
    await migration.up(runner);
    await migration.up(runner);
    expect(await Promise.all([existing, switched].map(modeOf))).toEqual(['code', 'code']);
  });

  it('should find a code page root after a full batch of other candidates', async () => {
    const appId = await withComponent('LibraryComponent');
    await runner.query(`
      INSERT INTO components (id, page_id, type, properties)
      SELECT ('00000000-0000-0000-0000-' || lpad(to_hex(n), 12, '0'))::uuid,
             p.id, 'LibraryComponent',
             CASE WHEN n = 2001 THEN '{"codePage":{"value":true}}'::json ELSE '{}'::json END
      FROM pages p CROSS JOIN generate_series(1, 2001) n
    `);
    await migration.up(runner);
    expect(await modeOf(appId)).toBe('code');
  });
});
