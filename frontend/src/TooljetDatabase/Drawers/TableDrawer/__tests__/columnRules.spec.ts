/** @jest-environment node */
import {
  applyPrimaryKey,
  applyTypeChange,
  canBePrimaryKey,
  canBeUnique,
  canHaveRelation,
  createColumn,
  createDefaultColumns,
  isPinnedPrimaryKey,
  isPrimaryKeyLocked,
  toColumnPayload,
} from '../columnRules';

const col = (overrides = {}) => createColumn({ column_name: 'c', data_type: 'character varying', ...overrides });

describe('columnRules', () => {
  describe('defaults', () => {
    it('starts with one id column: serial, primary key, not null (unique comes from the key itself)', () => {
      const [id, ...rest] = createDefaultColumns();
      expect(rest).toEqual([]);
      expect(id).toMatchObject({
        column_name: 'id',
        data_type: 'serial',
        column_default: null,
        constraints_type: { is_primary_key: true, is_not_null: true, is_unique: false },
      });
    });

    it('gives every column a distinct stable id', () => {
      expect(createColumn().id).not.toBe(createColumn().id);
    });
  });

  describe('type support', () => {
    it.each(['boolean', 'timestamp with time zone', 'jsonb'])('%s cannot be a primary key', (type) => {
      expect(canBePrimaryKey(type)).toBe(false);
    });
    it.each(['character varying', 'integer', 'bigint', 'double precision', 'serial'])('%s can be one', (type) => {
      expect(canBePrimaryKey(type)).toBe(true);
    });
    it.each(['boolean', 'jsonb', 'timestamp with time zone'])('%s cannot be unique', (type) => {
      expect(canBeUnique(type)).toBe(false);
    });
    it.each(['character varying', 'integer', 'bigint', 'double precision', 'serial'])('%s can be unique', (type) => {
      expect(canBeUnique(type)).toBe(true);
    });
    it.each(['boolean', 'serial', 'jsonb', 'timestamp with time zone'])('%s cannot have a relation', (type) => {
      expect(canHaveRelation(type)).toBe(false);
    });
    it.each(['character varying', 'integer', 'bigint', 'double precision'])('%s can have a relation', (type) => {
      expect(canHaveRelation(type)).toBe(true);
    });
  });

  describe('applyTypeChange', () => {
    it('serial forces not null and drops any default', () => {
      const next = applyTypeChange(col({ column_default: 'abc' }), 'serial');
      expect(next.data_type).toBe('serial');
      expect(next.column_default).toBeNull();
      expect(next.constraints_type.is_not_null).toBe(true);
    });

    it('resets default, not null and unique on a plain column', () => {
      const next = applyTypeChange(
        col({ column_default: '5', constraints_type: { is_not_null: true, is_unique: true, is_primary_key: false } }),
        'integer'
      );
      expect(next.column_default).toBeNull();
      expect(next.constraints_type).toEqual({ is_not_null: false, is_unique: false, is_primary_key: false });
    });

    it('keeps the primary key (not null and unique) when the new type allows it', () => {
      const next = applyTypeChange(createDefaultColumns()[0], 'integer');
      expect(next.constraints_type).toEqual({ is_not_null: true, is_unique: true, is_primary_key: true });
    });

    it.each(['boolean', 'timestamp with time zone', 'jsonb'])('drops the primary key when the type is %s', (type) => {
      const next = applyTypeChange(createDefaultColumns()[0], type);
      expect(next.constraints_type).toEqual({ is_not_null: false, is_unique: false, is_primary_key: false });
    });

    it('does not mutate its input', () => {
      const before = col();
      const snapshot = JSON.parse(JSON.stringify(before));
      applyTypeChange(before, 'integer');
      expect(before).toEqual(snapshot);
    });
  });

  describe('applyPrimaryKey', () => {
    it('on: not null and unique become true', () => {
      const next = applyPrimaryKey(col(), true);
      expect(next.constraints_type).toEqual({ is_not_null: true, is_unique: true, is_primary_key: true });
    });

    it('off: leaves not null and unique as they were', () => {
      const next = applyPrimaryKey(createDefaultColumns()[0], false);
      expect(next.constraints_type).toEqual({ is_not_null: true, is_unique: false, is_primary_key: false });
    });
  });

  describe('locks', () => {
    it('the sole primary key is locked and pinned', () => {
      const [id] = createDefaultColumns();
      const other = col();
      expect(isPrimaryKeyLocked(id, [id, other])).toBe(true);
      expect(isPinnedPrimaryKey(id, [id, other])).toBe(true);
    });

    it('with two primary keys neither is locked or pinned', () => {
      const [id] = createDefaultColumns();
      const second = applyPrimaryKey(col(), true);
      expect(isPrimaryKeyLocked(id, [id, second])).toBe(false);
      expect(isPinnedPrimaryKey(id, [id, second])).toBe(false);
    });

    it('a column whose type cannot be a primary key is locked, but not pinned', () => {
      const [id] = createDefaultColumns();
      const flag = col({ data_type: 'boolean' });
      expect(isPrimaryKeyLocked(flag, [id, flag])).toBe(true);
      expect(isPinnedPrimaryKey(flag, [id, flag])).toBe(false);
    });
  });

  describe('toColumnPayload', () => {
    // The server sanitises a present `column_default: null` into '' and then rejects it as not matching the type.
    it('leaves out an empty default, and keeps a set one', () => {
      expect(toColumnPayload(col({ column_default: null }))).not.toHaveProperty('column_default');
      expect(toColumnPayload(col({ column_default: '5' }))).toHaveProperty('column_default', '5');
    });

    it('drops the draft id and keeps what the create_table call takes', () => {
      const payload = toColumnPayload(col({ column_name: 'email', configurations: { timezone: 'UTC' } }));
      expect(payload).not.toHaveProperty('id');
      expect(payload).toEqual({
        column_name: 'email',
        data_type: 'character varying',
        constraints_type: { is_not_null: false, is_unique: false, is_primary_key: false },
        configurations: { timezone: 'UTC' },
      });
    });
  });
});
