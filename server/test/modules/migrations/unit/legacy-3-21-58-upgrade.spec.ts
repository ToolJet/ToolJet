/**
 * Covers: migration-helpers/legacy-3-21-58-upgrade.ts
 * @group database
 */
import { readdirSync } from 'fs';
import { join } from 'path';
import { LEGACY_VARIANTS, loosenStep, restoreSteps } from 'src/migration-helpers/legacy-3-21-58-upgrade';

describe('migration-helpers/legacy-3-21-58-upgrade', () => {
  it.each([
    ['check', 'ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS chk'],
    ['index', 'DROP INDEX IF EXISTS chk'],
  ] as const)('should save a copy of a %s before dropping it, and keep the first copy when run again', (kind, drop) => {
    const [save, dropSql] = loosenStep({ name: 'chk', kind, table: 'app_versions' });
    expect(save).toMatch(/^INSERT INTO legacy_upgrade_dropped_rules .* ON CONFLICT \(name\) DO NOTHING$/s);
    expect(dropSql).toBe(drop);
  });

  it('should add a dropped check back without checking old rows, then check them in a second step', () => {
    const steps = restoreSteps({
      name: 'chk',
      kind: 'check',
      table_name: 'app_versions',
      definition: 'CHECK ((branch_id IS NULL)) NOT VALID',
    });
    expect(steps).toEqual([
      [
        'ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS chk, ADD CONSTRAINT chk CHECK ((branch_id IS NULL)) NOT VALID',
      ],
      ['ALTER TABLE app_versions VALIDATE CONSTRAINT chk'],
    ]);
  });

  it('should rebuild an index only if it is missing', () => {
    const definition = 'CREATE UNIQUE INDEX idx ON public.app_versions USING btree (app_id)';
    expect(restoreSteps({ name: 'idx', kind: 'index', table_name: 'app_versions', definition })).toEqual([
      ['CREATE UNIQUE INDEX IF NOT EXISTS idx ON public.app_versions USING btree (app_id)'],
    ]);
  });

  it('should find the original data migration file for every stand-in', () => {
    const files = readdirSync(join(__dirname, '../../../../migrations/data')).map((file) =>
      file.replace(/^(\d+)-(\w+)\.ts$/, '$2$1')
    );

    expect(files).toEqual(expect.arrayContaining([...LEGACY_VARIANTS.keys()]));
  });
});
