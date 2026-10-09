/** @group database */
import { QueryRunner } from 'typeorm';
import { ComponentJsonRow, migrateComponentsByType } from '@helpers/component-migration.helper';
import { MoveVisibilityDisabledStatesToPropertiesDaterangePicker1733771653728 } from '../../../../data-migrations/1733771653728-MoveVisibilityDisabledStatesToPropertiesDaterangePicker';
// Real `components` row captured from a v3.0.37-ee-lts database before the upgrade.
import * as daterangePickerV3_0Fixture from './__fixtures__/daterangepicker.v3.0.37-ee-lts.json';

const daterangePickerV3_0 = structuredClone(daterangePickerV3_0Fixture) as unknown as ComponentJsonRow;

type UpdateParams = [string | null, string | null, string | null, string | null, string | null, string];

// In-memory stand-in for the `components` table that answers the three statements the helper issues.
// Rows round-trip through JSON so the transform never mutates the "stored" objects directly, as with pg.
function fakeComponentsTable(rows: ComponentJsonRow[]) {
  const table = new Map(rows.map((row) => [row.id, structuredClone(row)]));
  const updates: UpdateParams[] = [];
  let selectCalls = 0;

  const query = jest.fn(async (sql: string, params: unknown[]) => {
    if (sql.startsWith('SELECT COUNT(*)')) {
      const [types] = params as [string[]];
      return [{ count: String([...table.values()].filter((r) => types.includes(r.type)).length) }];
    }
    if (sql.startsWith('SELECT id, type')) {
      selectCalls++;
      const [types, lastId, limit] = params as [string[], string, number];
      return [...table.values()]
        .filter((r) => types.includes(r.type) && r.id > lastId)
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

function component(n: number, type: string, overrides: Partial<ComponentJsonRow> = {}): ComponentJsonRow {
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

describe('helpers/component-migration.helper', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('migrateComponentsByType', () => {
    it('should transform every matching component exactly once across multiple batches', async () => {
      const rows = [...Array.from({ length: 7 }, (_, i) => component(i + 1, 'Target')), component(100, 'Other')];
      const db = fakeComponentsTable(rows);
      const seen: string[] = [];

      await migrateComponentsByType(db.queryRunner, {
        migrationName: 'Test',
        componentTypes: ['Target'],
        batchSize: 3,
        transform: (row) => {
          seen.push(row.id);
          row.properties.migrated = true;
        },
      });

      expect(seen).toEqual(rows.filter((r) => r.type === 'Target').map((r) => r.id));
      expect(db.table.get(id(100)).properties).toEqual({});
      expect(db.table.get(id(1)).properties).toEqual({ migrated: true });
    });

    it('should stop when the matching row count is an exact multiple of the batch size', async () => {
      const db = fakeComponentsTable(Array.from({ length: 4 }, (_, i) => component(i + 1, 'Target')));

      await migrateComponentsByType(db.queryRunner, {
        migrationName: 'Test',
        componentTypes: ['Target'],
        batchSize: 2,
        transform: () => undefined,
      });

      expect(db.updates).toHaveLength(4);
      expect(db.selectCalls()).toBe(3);
    });

    it('should write SQL NULL for null columns and JSON text for objects', async () => {
      const db = fakeComponentsTable([component(1, 'Target', { validation: { regex: { value: '' } } })]);

      await migrateComponentsByType(db.queryRunner, {
        migrationName: 'Test',
        componentTypes: ['Target'],
        transform: () => undefined,
      });

      expect(db.updates[0]).toEqual(['{}', '{}', null, null, '{"regex":{"value":""}}', id(1)]);
    });

    it('should log start, progress and success', async () => {
      const db = fakeComponentsTable([component(1, 'Target')]);

      await migrateComponentsByType(db.queryRunner, {
        migrationName: 'Test',
        componentTypes: ['Target'],
        transform: () => undefined,
      });

      expect(console.log).toHaveBeenCalledWith('Test: [START] Migrate Target components: 1');
      expect(console.log).toHaveBeenCalledWith('Test: [PROGRESS] 1/1 (100.0%)');
      expect(console.log).toHaveBeenCalledWith('Test: [SUCCESS] Migrate Target components finished.');
    });
  });

  describe('MoveVisibilityDisabledStatesToPropertiesDaterangePicker1733771653728', () => {
    it('should migrate a DaterangePicker saved by v3.0.37-ee-lts to the current shape', async () => {
      const db = fakeComponentsTable([daterangePickerV3_0]);

      await new MoveVisibilityDisabledStatesToPropertiesDaterangePicker1733771653728().up(db.queryRunner);

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

      await new MoveVisibilityDisabledStatesToPropertiesDaterangePicker1733771653728().up(db.queryRunner);

      expect(db.table.get(id(2)).properties).toEqual({ label: { value: 'Dates' } });
      expect(db.table.get(id(3)).styles).toEqual({ visibility: { value: '{{true}}' } });
    });
  });
});
