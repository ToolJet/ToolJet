/** @group database */
import {
  legacyUpgradePending,
  loosenStep,
  restoreSteps,
  LEGACY_UPGRADE_MARKER,
} from 'src/migration-helpers/legacy-upgrade';

describe('migration-helpers/legacy-upgrade | async upgrade from 3.21.58', () => {
  it('should run only while the 3.21.58 backfill is pending', () => {
    expect(legacyUpgradePending(['Other1700000000000', LEGACY_UPGRADE_MARKER])).toBe(true);
    expect(legacyUpgradePending(['Other1700000000000'])).toBe(false);
  });

  it.each([
    ['check', 'ALTER TABLE app_versions DROP CONSTRAINT IF EXISTS chk'],
    ['index', 'DROP INDEX IF EXISTS chk'],
  ] as const)('should save a %s before dropping it, keeping the first saved copy', (kind, drop) => {
    const [save, dropSql] = loosenStep({ name: 'chk', kind, table: 'app_versions' });
    expect(save).toMatch(/^INSERT INTO legacy_upgrade_dropped_rules .* ON CONFLICT \(name\) DO NOTHING$/s);
    expect(dropSql).toBe(drop);
  });

  it('should add a check back NOT VALID first, then validate it', () => {
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
});
