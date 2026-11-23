/** @group platform */
/**
 * Theme definition v2 data migration: every organization_themes row gets `version: 2` and `colors` beside its old
 * `<group>.colors` groups (kept until a cleanup migration). The column is json and the old theme loader depends on its
 * key order (border.radius before border.colors), so rows are rewritten as text with the old keys in place.
 */
import { AddThemeDefinitionV2Colors1795426099623 as Migration } from '../../../../migrations/data/1795426099623-AddThemeDefinitionV2Colors';
import { TJDefaultTheme } from '../../../../src/modules/organization-themes/constants';
import { shippedThemes } from '../../../../src/modules/organization-themes/constants/shipped-themes';
import { toV2 } from '@tooljet/widget-definitions';

type Row = { id: string; definition: string };

const rose = {
  brand: { colors: { primary: { light: '#BE123C', dark: '#E11D48' } } },
  text: {
    font: 'IBM Plex Sans',
    colors: {
      primary: { light: '#f8e71cff', dark: '#417505ff' },
      disabled: { light: '#aaaaaa', dark: '#555555' },
    },
  },
  border: {
    radius: { default: 6, small: 0, large: 0 },
    colors: { default: { light: '#CABAC3', dark: '#503E4B' }, weak: { light: '#E0D2DA', dark: '#3D2E38' } },
  },
  systemStatus: { colors: { success: { light: '#1E823B', dark: '#318344' } } },
  surface: { colors: { appBackground: { light: '#FAF6F7', dark: '#161012' } } },
};

const uuid = (i: number) => `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`;

function makeQueryRunner(rows: Row[]) {
  const sorted = [...rows].sort((a, b) => a.id.localeCompare(b.id));
  const updates: Array<{ id: string; original: string; definition: unknown }> = [];
  const query = jest.fn(async (sql: string, params: any[] = []) => {
    if (/SELECT COUNT\(\*\)/.test(sql)) return [{ count: String(rows.length) }];
    if (/SELECT id, definition::text/.test(sql)) {
      const [after, take] = params;
      return sorted.filter((row) => after === null || row.id > after).slice(0, take);
    }
    if (/UPDATE organization_themes/.test(sql)) {
      updates.push(...JSON.parse(params[0]));
      return [];
    }
    throw new Error(`unexpected query: ${sql}`);
  });
  return { queryRunner: { manager: { query } } as any, query, updates };
}

const run = async (rows: Row[]) => {
  const runner = makeQueryRunner(rows);
  await new Migration().up(runner.queryRunner);
  return runner;
};

describe('AddThemeDefinitionV2Colors data migration', () => {
  let logs: string[];
  beforeEach(() => {
    logs = [];
    jest.spyOn(console, 'log').mockImplementation((line: string) => void logs.push(line));
  });
  afterEach(() => jest.restoreAllMocks());

  it('adds version and colors, keeping the old groups, their key order and every value as stored', async () => {
    const original = JSON.stringify(rose);
    const { updates } = await run([{ id: uuid(1), definition: original }]);

    expect(updates).toHaveLength(1);
    const written = updates[0].definition as Record<string, any>;
    expect(Object.keys(written)).toEqual(['brand', 'text', 'border', 'systemStatus', 'surface', 'version', 'colors']);
    expect(Object.keys(written.border)).toEqual(['radius', 'colors']);
    expect(written.version).toBe(2);
    ['brand', 'text', 'border', 'systemStatus', 'surface'].forEach((group) =>
      expect(written[group]).toEqual((rose as Record<string, unknown>)[group])
    );
    expect(written.colors.text.primary).toEqual({ light: '#f8e71cff', dark: '#417505ff' });
    expect(written.colors.border.strong).toEqual({ light: '#CABAC3', dark: '#503E4B' });
  });

  it('converts exactly as the shared toV2 does today (its frozen copy has not drifted)', async () => {
    const definitions = [rose, TJDefaultTheme, ...shippedThemes.map((theme) => theme.definition)];
    const { updates } = await run(definitions.map((d, i) => ({ id: uuid(i), definition: JSON.stringify(d) })));
    expect(updates).toHaveLength(definitions.length);
    updates.forEach((update, i) =>
      expect((update.definition as Record<string, unknown>).colors).toEqual(toV2(definitions[i]).colors)
    );
  });

  it('leaves rows that are already v2 alone', async () => {
    const v2 = JSON.stringify({ ...rose, version: 2, colors: { brand: { primary: { light: '#000', dark: '#000' } } } });
    const { updates } = await run([{ id: uuid(1), definition: v2 }]);
    expect(updates).toEqual([]);
  });

  it('only overwrites a row still as it was read (a save during the migration wins)', async () => {
    const original = JSON.stringify(rose);
    const { updates, query } = await run([{ id: uuid(1), definition: original }]);
    expect(updates[0].original).toBe(original);
    const update = query.mock.calls.find(([sql]) => /UPDATE organization_themes/.test(sql))[0];
    expect(update).toMatch(/t\.definition::text = v\.original/);
    expect(update).not.toMatch(/updated_at/);
  });

  it('reads and writes in batches, logging progress', async () => {
    const total = Migration.BATCH_SIZE * 2 + 3;
    const rows = Array.from({ length: total }, (_, i) => ({ id: uuid(i), definition: JSON.stringify(rose) }));
    const { updates, query } = await run(rows);

    expect(updates).toHaveLength(total);
    const updateCalls = query.mock.calls.filter(([sql]) => /UPDATE organization_themes/.test(sql));
    expect(updateCalls).toHaveLength(3);
    expect(logs.some((line) => /\[START\].*: \d+/.test(line))).toBe(true);
    expect(logs.some((line) => new RegExp(`\\[PROGRESS\\] ${total}/${total} \\(100%\\)`).test(line))).toBe(true);
    expect(logs.some((line) => /\[SUCCESS\]/.test(line))).toBe(true);
  });
});
