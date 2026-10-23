/** @group database */
import { QueryRunner } from 'typeorm';
import { MoveVisibilityDisabledStatesToPropertiesDaterangePicker1733771653728 } from '../../../../data-migrations/1733771653728-MoveVisibilityDisabledStatesToPropertiesDaterangePicker';
// Real `components` row captured from a v3.0.37-ee-lts database before the upgrade.
import * as daterangePickerV3_0Fixture from './__fixtures__/daterangepicker.v3.0.37-ee-lts.json';

type JsonObject = Record<string, unknown>;

interface ComponentRow {
  id: string;
  type: string;
  properties: JsonObject | null;
  styles: JsonObject | null;
  general_properties: JsonObject | null;
  general_styles: JsonObject | null;
  validation: JsonObject | null;
}

type UpdateParams = [string | null, string | null, string | null, string | null, string | null, string];

const daterangePickerV3_0 = structuredClone(daterangePickerV3_0Fixture) as unknown as ComponentRow;

// In-memory stand-in for the `components` table that answers the three statements the migration issues.
// Rows round-trip through clones so the transform never mutates the "stored" objects directly, as with pg.
function fakeComponentsTable(rows: ComponentRow[]) {
  const table = new Map(rows.map((row) => [row.id, structuredClone(row)]));
  const updates: UpdateParams[] = [];
  let selectCalls = 0;

  const query = jest.fn(async (sql: string, params: unknown[]) => {
    if (sql.startsWith('SELECT COUNT(*)')) {
      const [type] = params as [string];
      return [{ count: String([...table.values()].filter((r) => r.type === type).length) }];
    }
    if (sql.startsWith('SELECT id,')) {
      selectCalls++;
      const [type, lastId, limit] = params as [string, string, number];
      return [...table.values()]
        .filter((r) => r.type === type && r.id > lastId)
        .sort((a, b) => a.id.localeCompare(b.id))
        .slice(0, limit)
        .map((r) => structuredClone(r));
    }
    if (sql.startsWith('UPDATE components')) {
      const p = params as UpdateParams;
      updates.push(p);
      const parse = (v: string | null) => (v === null ? null : JSON.parse(v));
      Object.assign(table.get(p[5]), {
        properties: parse(p[0]),
        styles: parse(p[1]),
        general_properties: parse(p[2]),
        general_styles: parse(p[3]),
        validation: parse(p[4]),
      });
      return [];
    }
    throw new Error(`Unexpected SQL: ${sql}`);
  });

  return {
    queryRunner: { query } as unknown as QueryRunner,
    table,
    updates,
    selectCalls: () => selectCalls,
  };
}

const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;

function component(n: number, type: string, overrides: Partial<ComponentRow> = {}): ComponentRow {
  return {
    id: id(n),
    type,
    properties: {},
    styles: {},
    general_properties: null,
    general_styles: null,
    validation: null,
    ...overrides,
  };
}

const runMigration = (queryRunner: QueryRunner) =>
  new MoveVisibilityDisabledStatesToPropertiesDaterangePicker1733771653728().up(queryRunner);

describe('MoveVisibilityDisabledStatesToPropertiesDaterangePicker1733771653728', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('transform', () => {
    it('should migrate a DaterangePicker saved by v3.0.37-ee-lts to the current shape', async () => {
      const db = fakeComponentsTable([daterangePickerV3_0]);

      await runMigration(db.queryRunner);

      expect(db.table.get(daterangePickerV3_0.id)).toEqual({
        id: daterangePickerV3_0.id,
        type: 'DaterangePicker',
        properties: {
          defaultStartDate: { value: '01/04/2022' },
          defaultEndDate: { value: '10/04/2022' },
          format: { value: 'DD/MM/YYYY' },
          visibility: { value: '{{true}}' },
          disabledState: { value: '{{false}}' },
          tooltip: { value: 'Select a start and end date' },
          label: '',
        },
        styles: {
          borderRadius: { value: '4' },
          boxShadow: { value: '0px 0px 0px 0px #00000040' },
        },
        general_properties: {},
        general_styles: {},
        validation: {},
      });
    });

    it('should keep an existing label and leave other component types untouched', async () => {
      const db = fakeComponentsTable([
        component(2, 'DaterangePicker', { properties: { label: { value: 'Dates' } } }),
        component(3, 'DatePicker', { styles: { visibility: { value: '{{true}}' } } }),
      ]);

      await runMigration(db.queryRunner);

      expect(db.table.get(id(2)).properties).toEqual({ label: { value: 'Dates' } });
      expect(db.table.get(id(3)).styles).toEqual({ visibility: { value: '{{true}}' } });
    });

    it('should write SQL NULL for null columns and JSON text for objects', async () => {
      const db = fakeComponentsTable([component(1, 'DaterangePicker', { validation: { regex: { value: '' } } })]);

      await runMigration(db.queryRunner);

      expect(db.updates[0]).toEqual(['{"label":""}', '{}', null, null, '{"regex":{"value":""}}', id(1)]);
    });
  });

  describe('batching', () => {
    it('should transform every DaterangePicker exactly once across multiple batches', async () => {
      const db = fakeComponentsTable(Array.from({ length: 250 }, (_, i) => component(i + 1, 'DaterangePicker')));

      await runMigration(db.queryRunner);

      expect(db.updates.map((u) => u[5])).toEqual(Array.from({ length: 250 }, (_, i) => id(i + 1)));
    });

    it('should stop when the row count is an exact multiple of the batch size', async () => {
      const db = fakeComponentsTable(Array.from({ length: 200 }, (_, i) => component(i + 1, 'DaterangePicker')));

      await runMigration(db.queryRunner);

      expect(db.updates).toHaveLength(200);
      expect(db.selectCalls()).toBe(3);
    });
  });

  it('should log start, progress and success', async () => {
    const db = fakeComponentsTable([component(1, 'DaterangePicker')]);

    await runMigration(db.queryRunner);

    const name = 'MoveVisibilityDisabledStatesToPropertiesDaterangePicker1733771653728';
    expect(console.log).toHaveBeenCalledWith(`${name}: [START] Migrate DaterangePicker components: 1`);
    expect(console.log).toHaveBeenCalledWith(`${name}: [PROGRESS] 1/1 (100.0%)`);
    expect(console.log).toHaveBeenCalledWith(`${name}: [SUCCESS] Migrate DaterangePicker components finished.`);
  });
});
