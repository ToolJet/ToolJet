import { buildRowsQuery, isQueryableFilter } from '../rowsQuery';

const params = (query: string) => new URLSearchParams(query);

describe('buildRowsQuery', () => {
  it('pages by limit and offset from a 1-based page number', () => {
    const query = params(buildRowsQuery({ filters: {}, sort: {}, page: 3, pageSize: 50 }));

    expect(query.get('limit')).toBe('50');
    expect(query.get('offset')).toBe('100');
  });

  it('turns every complete filter into a PostgREST condition', () => {
    const query = params(
      buildRowsQuery({
        filters: { 0: { column: 'tag', operator: 'eq', value: 'v1' }, 3: { column: 'id', operator: 'gt', value: '7' } },
        sort: {},
        page: 1,
        pageSize: 50,
      })
    );

    expect(query.get('tag')).toBe('eq.v1');
    expect(query.get('id')).toBe('gt.7');
  });

  it('leaves out a filter the server would refuse, so a draft never reaches PostgREST', () => {
    const query = params(
      buildRowsQuery({
        filters: {
          0: { column: 'tag', operator: 'eq', value: '' },
          1: { column: 'title', operator: 'eq', value: 'null' },
        },
        sort: {},
        page: 1,
        pageSize: 50,
      })
    );

    expect(query.has('tag')).toBe(false);
    expect(query.has('title')).toBe(false);
  });

  it('orders by every complete sort rule in the order the rules were added', () => {
    const query = params(
      buildRowsQuery({
        filters: {},
        // Key 1 was deleted in the popover; priority follows key order, not the key values.
        sort: { 0: { column: 'tag', order: 'asc' }, 2: { column: 'title', order: 'desc' }, 3: { column: '' } },
        page: 1,
        pageSize: 50,
      })
    );

    expect(query.get('order')).toBe('tag.asc,title.desc');
  });

  it('gives the same string for the same view, so it can key the cache', () => {
    const view = { filters: { 0: { column: 'tag', operator: 'eq', value: 'v1' } }, sort: {}, page: 2, pageSize: 100 };

    expect(buildRowsQuery(view)).toBe(buildRowsQuery({ ...view }));
  });
});

describe('isQueryableFilter', () => {
  it('accepts "null" only with the is operator', () => {
    expect(isQueryableFilter({ column: 'tag', operator: 'is', value: 'null' })).toBe(true);
    expect(isQueryableFilter({ column: 'tag', operator: 'eq', value: 'NULL' })).toBe(false);
  });
});
