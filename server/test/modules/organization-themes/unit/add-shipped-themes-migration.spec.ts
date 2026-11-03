/**
 * The data migration that adds the shipped colour themes to existing workspaces reads workspaces in batches and adds
 * each batch's themes with one INSERT ... SELECT, so a cloud with many workspaces runs one statement per batch.
 */
import { AddShippedThemesToOrganizations1791950000000 as Migration } from '../../../../data-migrations/1791950000000-AddShippedThemesToOrganizations';
import { shippedThemes } from '../../../../src/modules/organization-themes/constants/shipped-themes';

function makeQueryRunner(organizationCount: number) {
  const ids = Array.from({ length: organizationCount }, (_, i) => `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`);
  const inserts: Array<{ organizationIds: string[]; themes: Array<{ name: string; definition: unknown }> }> = [];
  const query = jest.fn(async (sql: string, params: any[] = []) => {
    if (/SELECT COUNT\(\*\)/.test(sql)) return [{ count: organizationCount }];
    if (/SELECT id FROM organizations/.test(sql)) {
      const [take, skip] = params;
      return ids.slice(skip, skip + take).map((id) => ({ id }));
    }
    if (/INSERT INTO organization_themes/.test(sql)) {
      inserts.push({ organizationIds: params[0], themes: JSON.parse(params[1]) });
      return [];
    }
    throw new Error(`unexpected query: ${sql}`);
  });
  return { queryRunner: { manager: { query } } as any, query, inserts, ids };
}

describe('AddShippedThemesToOrganizations data migration', () => {
  beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('adds every workspace in batches, one insert per batch', async () => {
    const total = Migration.BATCH_SIZE * 2 + 7;
    const { queryRunner, inserts, ids } = makeQueryRunner(total);

    await new Migration().up(queryRunner);

    expect(inserts.map((insert) => insert.organizationIds.length)).toEqual([
      Migration.BATCH_SIZE,
      Migration.BATCH_SIZE,
      7,
    ]);
    expect(inserts.flatMap((insert) => insert.organizationIds)).toEqual(ids);
  });

  it('sends every shipped theme with its definition', async () => {
    const { queryRunner, inserts } = makeQueryRunner(3);

    await new Migration().up(queryRunner);

    expect(inserts).toHaveLength(1);
    expect(inserts[0].themes).toEqual(shippedThemes.map(({ name, definition }) => ({ name, definition })));
  });

  it('skips names a workspace already uses and stays safe to re-run', async () => {
    const { queryRunner, query } = makeQueryRunner(1);

    await new Migration().up(queryRunner);

    const insertSql = query.mock.calls.map(([sql]) => sql).find((sql) => /INSERT INTO organization_themes/.test(sql));
    expect(insertSql).toMatch(/NOT EXISTS[\s\S]*lower\(ot\.name\) = lower\(t\.name\)/);
    expect(insertSql).toMatch(/ON CONFLICT DO NOTHING/);
  });

  it('does nothing without workspaces', async () => {
    const { queryRunner, query, inserts } = makeQueryRunner(0);

    await new Migration().up(queryRunner);

    expect(query).toHaveBeenCalledTimes(1);
    expect(inserts).toHaveLength(0);
  });
});
