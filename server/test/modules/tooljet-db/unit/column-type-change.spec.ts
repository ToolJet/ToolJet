import { BadRequestException } from '@nestjs/common';
import {
  STRUCTURED_TYPE_CHANGES,
  isStructuredTypeChangeAllowed,
  normalizeRequestedType,
  assertStructuredTypeChangeAllowed,
  unsupportedColumnTypes,
} from '@modules/tooljet-db/helpers/column-type-change';
import { TableSchemaSnapshotColumn } from '@modules/tooljet-db/helpers/table-schema-snapshot';

describe('column-type-change allowlist', () => {
  it('should allow exactly the three lossless widening casts', () => {
    expect([...STRUCTURED_TYPE_CHANGES]).toEqual([
      ['integer', 'bigint'],
      ['integer', 'double precision'],
      ['bigint', 'double precision'],
    ]);
  });

  it.each([
    ['integer', 'bigint'],
    ['integer', 'double precision'],
    ['bigint', 'double precision'],
  ])('permits %s -> %s', (from, to) => {
    expect(isStructuredTypeChangeAllowed(from, to)).toBe(true);
  });

  it.each([
    ['bigint', 'integer'],
    ['double precision', 'integer'],
    ['character varying', 'integer'],
    ['character varying', 'jsonb'],
    ['integer', 'character varying'],
    ['integer', 'boolean'],
    ['timestamp with time zone', 'character varying'],
  ])('refuses %s -> %s', (from, to) => {
    expect(isStructuredTypeChangeAllowed(from, to)).toBe(false);
  });

  it('should map the serial label onto its physical type, leaving others untouched', () => {
    expect(normalizeRequestedType('serial')).toBe('integer');
    expect(normalizeRequestedType('bigint')).toBe('bigint');
    expect(normalizeRequestedType('character varying')).toBe('character varying');
  });

  describe('assertStructuredTypeChangeAllowed', () => {
    it('should be a no-op when the type is unchanged', () => {
      expect(() => assertStructuredTypeChangeAllowed('qty', 'integer', 'integer', null)).not.toThrow();
    });

    it('should be a no-op for an allowed widening cast', () => {
      expect(() => assertStructuredTypeChangeAllowed('qty', 'integer', 'bigint', null)).not.toThrow();
    });

    it('should reject a row-dependent cast and name the SQL escape hatch', () => {
      expect(() => assertStructuredTypeChangeAllowed('amount', 'character varying', 'integer', null)).toThrow(
        BadRequestException
      );
      expect(() => assertStructuredTypeChangeAllowed('amount', 'character varying', 'integer', null)).toThrow(
        /USING clause/
      );
    });

    it('should reject a silently lossy cast', () => {
      expect(() => assertStructuredTypeChangeAllowed('price', 'double precision', 'integer', null)).toThrow(
        BadRequestException
      );
    });

    it('should reject any type change on a serial column, even an otherwise-allowed pair', () => {
      expect(() =>
        assertStructuredTypeChangeAllowed('id', 'integer', 'bigint', `nextval('"ws_1"."rel_1_id_seq"'::regclass)`)
      ).toThrow(/auto-incrementing/);
    });

    it('should leave a serial column alone when nothing changed', () => {
      expect(() =>
        assertStructuredTypeChangeAllowed('id', 'integer', 'integer', `nextval('"ws_1"."rel_1_id_seq"'::regclass)`)
      ).not.toThrow();
    });
  });
});

describe('unsupportedColumnTypes', () => {
  const column = (overrides: Partial<TableSchemaSnapshotColumn>): TableSchemaSnapshotColumn => ({
    name: 'col',
    uuid: 'uuid-1',
    data_type: 'integer',
    is_nullable: true,
    default: null,
    is_primary_key: false,
    ...overrides,
  });

  it('should not flag a new column with a supported type', () => {
    const after = [column({ uuid: 'u1', data_type: 'integer' })];
    expect(unsupportedColumnTypes([], after)).toEqual([]);
  });

  it('should flag a new column with an array type', () => {
    const after = [column({ name: 'tags', uuid: 'u1', data_type: 'text[]' })];
    expect(unsupportedColumnTypes([], after)).toEqual([{ name: 'tags', dataType: 'text[]' }]);
  });

  it('should flag a new column with numeric(10,2), keeping the modifier in the reported dataType', () => {
    const after = [column({ name: 'amount', uuid: 'u1', data_type: 'numeric(10,2)' })];
    expect(unsupportedColumnTypes([], after)).toEqual([{ name: 'amount', dataType: 'numeric(10,2)' }]);
  });

  it('should not flag a pre-existing unsupported column whose type never changed (grandfathering)', () => {
    const before = [column({ name: 'tags', uuid: 'u1', data_type: 'text[]' })];
    const after = [column({ name: 'tags', uuid: 'u1', data_type: 'text[]' })];
    expect(unsupportedColumnTypes(before, after)).toEqual([]);
  });

  it('should flag a pre-existing unsupported column whose type changed to another unsupported type', () => {
    const before = [column({ name: 'tags', uuid: 'u1', data_type: 'text[]' })];
    const after = [column({ name: 'tags', uuid: 'u1', data_type: 'numeric(10,2)' })];
    expect(unsupportedColumnTypes(before, after)).toEqual([{ name: 'tags', dataType: 'numeric(10,2)' }]);
  });

  it('should flag a supported column changed to an unsupported type', () => {
    const before = [column({ name: 'qty', uuid: 'u1', data_type: 'integer' })];
    const after = [column({ name: 'qty', uuid: 'u1', data_type: 'text[]' })];
    expect(unsupportedColumnTypes(before, after)).toEqual([{ name: 'qty', dataType: 'text[]' }]);
  });

  it('should not flag character varying(255) - modifier stripping', () => {
    const after = [column({ name: 'name', uuid: 'u1', data_type: 'character varying(255)' })];
    expect(unsupportedColumnTypes([], after)).toEqual([]);
  });

  it('should not flag timestamp(3) with time zone - mid-string modifier stripping', () => {
    const after = [column({ name: 'created_at', uuid: 'u1', data_type: 'timestamp(3) with time zone' })];
    expect(unsupportedColumnTypes([], after)).toEqual([]);
  });

  it('should not flag a renamed column with the same uuid and unchanged supported type', () => {
    const before = [column({ name: 'old_name', uuid: 'u1', data_type: 'integer' })];
    const after = [column({ name: 'new_name', uuid: 'u1', data_type: 'integer' })];
    expect(unsupportedColumnTypes(before, after)).toEqual([]);
  });

  it('should not return a dropped column that is absent from after', () => {
    const before = [
      column({ name: 'tags', uuid: 'u1', data_type: 'text[]' }),
      column({ name: 'qty', uuid: 'u2', data_type: 'integer' }),
    ];
    const after = [column({ name: 'qty', uuid: 'u2', data_type: 'integer' })];
    expect(unsupportedColumnTypes(before, after)).toEqual([]);
  });

  it('should treat a column with an undefined uuid as new, never matching another undefined-uuid column', () => {
    const before = [column({ name: 'legacy', uuid: undefined, data_type: 'text[]' })];
    const after = [column({ name: 'brand_new', uuid: undefined, data_type: 'text[]' })];
    expect(unsupportedColumnTypes(before, after)).toEqual([{ name: 'brand_new', dataType: 'text[]' }]);
  });
});
