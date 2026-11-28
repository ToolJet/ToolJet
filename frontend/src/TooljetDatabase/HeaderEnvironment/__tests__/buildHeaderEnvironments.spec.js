import { buildHeaderEnvironments } from '../buildHeaderEnvironments';
import { TABLE_ABSENT_TOOLTIP } from '../../constants';

const DEVELOPMENT = { id: 'env-dev', name: 'development', priority: 1, enabled: true };
const STAGING = { id: 'env-stg', name: 'staging', priority: 2, enabled: true };
const PRODUCTION = { id: 'env-prod', name: 'production', priority: 3, enabled: true };
const ENVIRONMENTS = [DEVELOPMENT, STAGING, PRODUCTION];

const MIGRATIONS = [
  { id: 'm-1', migration_number: 1 },
  { id: 'm-2', migration_number: 2 },
  { id: 'm-12', migration_number: 12 },
];

const TABLE = { id: 'table-1' };
const ALL_HAVE_RELATION = ENVIRONMENTS.map((env) => ({ environment_id: env.id, has_relation: true }));

const build = (overrides = {}) =>
  buildHeaderEnvironments({
    environments: ENVIRONMENTS,
    selectedEnvironment: DEVELOPMENT,
    tableId: TABLE.id,
    relationsByEnvironment: ALL_HAVE_RELATION,
    tableMigrations: {
      migrations: MIGRATIONS,
      environments: [
        { environment_id: DEVELOPMENT.id, applied_migration_ids: ['m-1', 'm-2', 'm-12'] },
        { environment_id: STAGING.id, applied_migration_ids: ['m-1', 'm-2'] },
        { environment_id: PRODUCTION.id, applied_migration_ids: [] },
      ],
    },
    multiEnvLocked: false,
    lockMessage: 'Upgrade to use more environments.',
    ...overrides,
  });

const byName = (rows, name) => rows.find((row) => row.name.toLowerCase() === name);

describe('buildHeaderEnvironments', () => {
  it('keeps every environment, in order, with its id and a capitalised name', () => {
    expect(build().map(({ id, name }) => ({ id, name }))).toEqual([
      { id: DEVELOPMENT.id, name: 'Development' },
      { id: STAGING.id, name: 'Staging' },
      { id: PRODUCTION.id, name: 'Production' },
    ]);
  });

  describe('meta: the number of the migration an environment is at', () => {
    it('is the zero-padded number of the latest migration the environment has applied', () => {
      const rows = build();
      expect(byName(rows, 'development').meta).toBe('0012');
      expect(byName(rows, 'staging').meta).toBe('0002');
    });

    it('is left out for an environment that has applied nothing', () => {
      expect(byName(build(), 'production').meta).toBeUndefined();
    });

    it('is left out for every environment while no table is open', () => {
      const rows = build({ tableId: undefined, relationsByEnvironment: [], tableMigrations: null });
      expect(rows.map((row) => row.meta)).toEqual([undefined, undefined, undefined]);
    });

    it('is left out until the migrations have loaded', () => {
      expect(build({ tableMigrations: null }).map((row) => row.meta)).toEqual([undefined, undefined, undefined]);
    });

    it('ignores an applied migration that is no longer in the chain', () => {
      const rows = build({
        tableMigrations: {
          migrations: MIGRATIONS,
          environments: [{ environment_id: STAGING.id, applied_migration_ids: ['m-2', 'dropped'] }],
        },
      });
      expect(byName(rows, 'staging').meta).toBe('0002');
    });
  });

  describe('disabled', () => {
    it('disables nothing when every environment is licensed and has the table', () => {
      expect(build().some((row) => row.disabled)).toBe(false);
    });

    it('disables an unlicensed environment and says why', () => {
      const rows = build({ environments: [DEVELOPMENT, { ...STAGING, enabled: false }, PRODUCTION] });
      expect(byName(rows, 'staging')).toMatchObject({
        disabled: true,
        disabledReason: 'Upgrade to use more environments.',
      });
    });

    it('locks every non-development environment when the live licence lapsed', () => {
      const rows = build({ multiEnvLocked: true });
      expect(rows.filter((row) => row.disabled).map((row) => row.name)).toEqual(['Staging', 'Production']);
    });

    it('marks a licence-locked environment as locked, so the select can show a lock', () => {
      const rows = build({ multiEnvLocked: true });
      expect(rows.filter((row) => row.locked).map((row) => row.name)).toEqual(['Staging', 'Production']);
    });

    it('does not mark an environment that only lacks the table as locked', () => {
      const rows = build({ relationsByEnvironment: [{ environment_id: DEVELOPMENT.id, has_relation: true }] });
      expect(rows.some((row) => row.locked)).toBe(false);
    });

    it('never locks development', () => {
      const rows = build({ multiEnvLocked: true, selectedEnvironment: STAGING });
      expect(byName(rows, 'development').disabled).toBeFalsy();
    });

    it('never disables the environment that is open, even if it is locked', () => {
      const lapsedStaging = { ...STAGING, enabled: false };
      const rows = build({ environments: [DEVELOPMENT, lapsedStaging], selectedEnvironment: lapsedStaging });
      expect(byName(rows, 'staging').disabled).toBeFalsy();
    });

    it('disables an environment that does not have the open table', () => {
      const rows = build({
        relationsByEnvironment: [
          { environment_id: DEVELOPMENT.id, has_relation: true },
          { environment_id: STAGING.id, has_relation: false },
        ],
      });
      expect(byName(rows, 'staging')).toMatchObject({ disabled: true, disabledReason: TABLE_ABSENT_TOOLTIP });
      expect(byName(rows, 'production')).toMatchObject({ disabled: true, disabledReason: TABLE_ABSENT_TOOLTIP });
    });

    it('does not disable for a missing table relation while no table is open', () => {
      const rows = build({ tableId: undefined, relationsByEnvironment: [], tableMigrations: null });
      expect(rows.some((row) => row.disabled)).toBe(false);
    });
  });
});
