import { buildDeleteQuery, getDeleteBlockedReason } from '../deleteRows';
import type { GridColumn } from '../useTableGrid';

const filter = (query: string, name: string) => new URLSearchParams(query).get(name);

describe('buildDeleteQuery | one key column', () => {
  it.each([
    ['a plain value', 'abc', 'in.(abc)'],
    ['a number', 7, 'in.(7)'],
    ['a comma', 'a,b', 'in.("a,b")'],
    ['an opening parenthesis', '(x', 'in.("(x")'],
    ['a closing parenthesis', 'x)', 'in.("x)")'],
    ['a double quote', 'a"b', 'in.("a\\"b")'],
    ['a backslash', 'a\\b', 'in.("a\\\\b")'],
    ['a space', 'a b', 'in.("a b")'],
    ['an empty string', '', 'in.("")'],
    ['an ISO timestamp', '2024-05-01T10:00:00.123456+00:00', 'in.(2024-05-01T10:00:00.123456+00:00)'],
  ])('writes %s', (_name, value, expected) => {
    expect(filter(buildDeleteQuery(['id'], [{ id: value }]), 'id')).toBe(expected);
  });

  it('lists every selected row', () => {
    expect(filter(buildDeleteQuery(['id'], [{ id: 1 }, { id: 'a,b' }, { id: 3 }]), 'id')).toBe('in.(1,"a,b",3)');
  });

  it('survives characters that end a query string value', () => {
    const query = buildDeleteQuery(['id'], [{ id: 'a&b=c#d+e' }]);

    expect(query.split('&')).toHaveLength(1);
    expect(filter(query, 'id')).toBe('in.(a&b=c#d+e)');
  });
});

describe('buildDeleteQuery | composite key', () => {
  it('matches whole tuples', () => {
    const query = buildDeleteQuery(
      ['a', 'b'],
      [
        { a: 1, b: 2 },
        { a: 3, b: 4 },
      ]
    );

    expect(filter(query, 'or')).toBe('(and(a.eq.1,b.eq.2),and(a.eq.3,b.eq.4))');
  });

  it('quotes a key value that needs it', () => {
    const query = buildDeleteQuery(['a', 'b'], [{ a: 'x,y', b: 'say "hi"' }]);

    expect(filter(query, 'or')).toBe('(and(a.eq."x,y",b.eq."say \\"hi\\""))');
  });
});

describe('getDeleteBlockedReason', () => {
  const column = (accessor: string, dataType: string): GridColumn => ({
    Header: accessor,
    accessor,
    dataType,
    constraints_type: { is_primary_key: true },
  });

  it('allows safe key types', () => {
    const columns = [
      column('id', 'serial'),
      column('code', 'character varying'),
      column('at', 'timestamp with time zone'),
    ];

    expect(getDeleteBlockedReason(['id', 'code', 'at'], columns)).toBeUndefined();
  });

  it('refuses a table without a key', () => {
    expect(getDeleteBlockedReason([], [])).toMatch(/primary key/);
  });

  it.each(['bigint', 'jsonb'])('refuses a %s key, alone or in a composite key', (dataType) => {
    const columns = [column('id', 'integer'), column('big', dataType)];

    expect(getDeleteBlockedReason(['big'], columns)).toContain(dataType);
    expect(getDeleteBlockedReason(['id', 'big'], columns)).toContain(dataType);
  });
});
