import { BadRequestException } from '@nestjs/common';
import {
  STRUCTURED_TYPE_CHANGES,
  isStructuredTypeChangeAllowed,
  normalizeRequestedType,
  assertStructuredTypeChangeAllowed,
} from '@modules/tooljet-db/helpers/column-type-change';

describe('column-type-change allowlist', () => {
  it('allows exactly the three lossless widening casts', () => {
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

  it('maps the serial label onto its physical type, leaving others untouched', () => {
    expect(normalizeRequestedType('serial')).toBe('integer');
    expect(normalizeRequestedType('bigint')).toBe('bigint');
    expect(normalizeRequestedType('character varying')).toBe('character varying');
  });

  describe('assertStructuredTypeChangeAllowed', () => {
    it('is a no-op when the type is unchanged', () => {
      expect(() => assertStructuredTypeChangeAllowed('qty', 'integer', 'integer', null)).not.toThrow();
    });

    it('is a no-op for an allowed widening cast', () => {
      expect(() => assertStructuredTypeChangeAllowed('qty', 'integer', 'bigint', null)).not.toThrow();
    });

    it('rejects a row-dependent cast and names the SQL escape hatch', () => {
      expect(() => assertStructuredTypeChangeAllowed('amount', 'character varying', 'integer', null)).toThrow(
        BadRequestException
      );
      expect(() => assertStructuredTypeChangeAllowed('amount', 'character varying', 'integer', null)).toThrow(
        /USING clause/
      );
    });

    it('rejects a silently lossy cast', () => {
      expect(() => assertStructuredTypeChangeAllowed('price', 'double precision', 'integer', null)).toThrow(
        BadRequestException
      );
    });

    it('rejects any type change on a serial column, even an otherwise-allowed pair', () => {
      expect(() =>
        assertStructuredTypeChangeAllowed('id', 'integer', 'bigint', `nextval('"ws_1"."rel_1_id_seq"'::regclass)`)
      ).toThrow(/auto-incrementing/);
    });

    it('leaves a serial column alone when nothing changed', () => {
      expect(() =>
        assertStructuredTypeChangeAllowed('id', 'integer', 'integer', `nextval('"ws_1"."rel_1_id_seq"'::regclass)`)
      ).not.toThrow();
    });
  });
});
