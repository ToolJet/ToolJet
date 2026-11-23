import { BadRequestException } from '@nestjs/common';
import { assertCanSetDefault, buildSetDefaultQuery, quoteIdentifier } from '@modules/tooljet-db/helpers/row-default';

const columns = [
  { column_name: 'id', column_default: "nextval('seq'::regclass)" },
  { column_name: 'created_at', column_default: 'now()' },
  { column_name: 'title', column_default: null },
];

describe('assertCanSetDefault', () => {
  it('accepts a column with a default and the whole primary key', () => {
    expect(() => assertCanSetDefault('created_at', { id: 1 }, columns, ['id'])).not.toThrow();
  });

  it.each([
    ['an unknown column', 'nope', { id: 1 }, ['id']],
    ['a column without a default', 'title', { id: 1 }, ['id']],
    ['a table without a primary key', 'created_at', { id: 1 }, []],
    ['no key value', 'created_at', {}, ['id']],
    ['a null key value', 'created_at', { id: null }, ['id']],
    ['a partial composite key', 'created_at', { id: 1 }, ['id', 'tenant']],
    ['a filter on a non-key column', 'created_at', { title: 'x' }, ['id']],
    ['an extra filter column', 'created_at', { id: 1, title: 'x' }, ['id']],
  ])('refuses %s', (_name, column, where, primaryKeys) => {
    expect(() => assertCanSetDefault(column, where, columns, primaryKeys)).toThrow(BadRequestException);
  });
});

describe('buildSetDefaultQuery', () => {
  it('sets the column to DEFAULT for one key tuple, with values as parameters', () => {
    expect(
      buildSetDefaultQuery('workspace_1', 'rel-1', 'created_at', { id: 7, tenant: 'a' }, ['id', 'tenant'])
    ).toEqual({
      sql: 'UPDATE "workspace_1"."rel-1" SET "created_at" = DEFAULT WHERE "id" = $1 AND "tenant" = $2 RETURNING "created_at" AS value',
      params: [7, 'a'],
    });
  });

  it('escapes a double quote in an identifier', () => {
    expect(quoteIdentifier('a"b')).toBe('"a""b"');
  });
});
