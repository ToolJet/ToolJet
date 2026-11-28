import { readColumnWidths, writeColumnWidths } from '../columnWidths';

const KEY = 'tjdb-col-widths:ws-1:table-1';

beforeEach(() => window.localStorage.clear());
afterEach(() => jest.restoreAllMocks());

describe('column widths | read', () => {
  it('returns the saved widths of the table', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ title: 320, views: 90 }));

    expect(readColumnWidths('ws-1', 'table-1')).toEqual({ title: 320, views: 90 });
  });

  it('keeps tables and workspaces apart', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ title: 320 }));

    expect(readColumnWidths('ws-1', 'table-2')).toEqual({});
    expect(readColumnWidths('ws-2', 'table-1')).toEqual({});
  });

  it.each([['not json'], ['[1,2]'], ['"wide"'], ['null']])('ignores saved state that is %s', (saved) => {
    window.localStorage.setItem(KEY, saved);

    expect(readColumnWidths('ws-1', 'table-1')).toEqual({});
  });

  it('drops widths that are not positive numbers', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ title: 'wide', views: -5, id: 0, ok: 150 }));

    expect(readColumnWidths('ws-1', 'table-1')).toEqual({ ok: 150 });
  });

  it('returns no widths when storage throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(readColumnWidths('ws-1', 'table-1')).toEqual({});
  });
});

describe('column widths | write', () => {
  it('saves the widths of the columns on screen and ignores sizes of columns it was not given', () => {
    writeColumnWidths('ws-1', 'table-1', { title: 320, gone: 500 }, ['id', 'title']);

    expect(JSON.parse(window.localStorage.getItem(KEY) ?? 'null')).toEqual({ title: 320 });
  });

  it('keeps the stored width of a column that is not on screen, such as one only another environment has', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ title: 320, promoted_only: 180 }));

    writeColumnWidths('ws-1', 'table-1', { title: 400 }, ['id', 'title']);

    expect(JSON.parse(window.localStorage.getItem(KEY) ?? 'null')).toEqual({ title: 400, promoted_only: 180 });
  });

  it('forgets the width of a column on screen that was reset, keeping the others', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ title: 320, views: 90, promoted_only: 180 }));

    writeColumnWidths('ws-1', 'table-1', { views: 90 }, ['id', 'title', 'views']);

    expect(JSON.parse(window.localStorage.getItem(KEY) ?? 'null')).toEqual({ views: 90, promoted_only: 180 });
  });

  it('removes the entry when no saved width is left', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ title: 320 }));

    writeColumnWidths('ws-1', 'table-1', {}, ['title']);

    expect(window.localStorage.getItem(KEY)).toBeNull();
  });

  it('does not throw when storage is full or blocked', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => writeColumnWidths('ws-1', 'table-1', { title: 320 }, ['title'])).not.toThrow();
  });
});
