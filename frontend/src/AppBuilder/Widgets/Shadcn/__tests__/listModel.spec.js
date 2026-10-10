import { itemKey, listLook, pageOf } from '../listModel';

const rows = Array.from({ length: 23 }, (_, i) => ({ id: i + 1 }));

describe('pageOf', () => {
  it('returns everything without pagination', () => {
    expect(pageOf(rows, { enablePagination: false, page: 3 })).toMatchObject({ items: rows, pageCount: 1, page: 1 });
  });
  it('slices a client-side page and clamps the page into range', () => {
    const p2 = pageOf(rows, { enablePagination: true, rowsPerPage: 10, page: 2 });
    expect(p2.items.map((r) => r.id)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(p2.pageCount).toBe(3);
    expect(pageOf(rows, { enablePagination: true, rowsPerPage: 10, page: 9 }).page).toBe(3);
    expect(pageOf(rows, { enablePagination: true, rowsPerPage: 10, page: 0 }).page).toBe(1);
  });
  it('treats server-side data as the page and counts pages from totalRecords', () => {
    const p = pageOf(rows.slice(0, 10), {
      enablePagination: true,
      serverSidePagination: true,
      rowsPerPage: 10,
      totalRecords: 95,
      page: 4,
    });
    expect(p.items).toHaveLength(10);
    expect(p.pageCount).toBe(10);
    expect(p.page).toBe(4);
    // Unknown total: next is allowed while a full page came back.
    const open = pageOf(rows.slice(0, 10), {
      enablePagination: true,
      serverSidePagination: true,
      rowsPerPage: 10,
      totalRecords: 0,
      page: 2,
    });
    expect(open.pageCount).toBeNull();
    expect(open.hasNext).toBe(true);
  });
  it('survives junk', () => {
    expect(pageOf(null, { enablePagination: true, rowsPerPage: 'x', page: 'y' })).toMatchObject({
      items: [],
      pageCount: 1,
      page: 1,
    });
    expect(pageOf('abc', {}).items).toEqual([]);
  });
});

describe('itemKey', () => {
  it('uses the id field, else the position', () => {
    expect(itemKey({ id: 7 }, 'id', 0)).toBe('7');
    expect(itemKey({ name: 'a' }, 'id', 3)).toBe('#3');
    expect(itemKey('plain', 'id', 1)).toBe('#1');
  });
});

describe('listLook', () => {
  it('maps styles to variables and inline item styles, theme by default', () => {
    expect(listLook({}).vars).toEqual({});
    const look = listLook({
      accentColor: '#0f766e',
      itemBackgroundColor: '#fff',
      itemBorderRadius: 10,
      itemShadow: 'md',
      padding: 12,
    });
    expect(look.vars['--sc-primary']).toBe('#0f766e');
    expect(look.item).toMatchObject({ background: '#fff', borderRadius: '10px' });
    expect(look.item.boxShadow).toMatch(/rgb/);
    expect(look.padding).toBe('12px');
  });
});
