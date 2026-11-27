import { listviewFallbackRowHeight, listviewHeight, listviewRowCount, listviewRowHeight } from '../listviewHeight';

const ROWS = [{ n: 1 }, { n: 2 }, { n: 3 }];

// Values match the native List view on main (pinned by the old engine's List view spec until it was deleted in B4).
describe('dynamic height: List view', () => {
  describe('rows a page shows', () => {
    it('[DynamicHeight-LIST-001] counts every row of its data without pagination', () => {
      expect(listviewRowCount({ dataSourceSelector: 'rawJson', data: ROWS })).toBe(3);
      // Bound data: the selector holds the resolved rows themselves.
      expect(listviewRowCount({ dataSourceSelector: ROWS })).toBe(3);
    });

    it('[DynamicHeight-LIST-002] counts at most a page of rows with pagination', () => {
      const paged = (rowsPerPage) => ({
        dataSourceSelector: 'rawJson',
        data: ROWS,
        enablePagination: true,
        rowsPerPage,
      });
      expect(listviewRowCount(paged(2))).toBe(2);
      expect(listviewRowCount(paged(5))).toBe(3);
      // An unset or unreadable page size is 10.
      const many = Array.from({ length: 25 }, (_, n) => ({ n }));
      expect(listviewRowCount({ dataSourceSelector: many, enablePagination: true, rowsPerPage: 'x' })).toBe(10);
    });

    it('[DynamicHeight-LIST-003] counts no rows when its data is not a list', () => {
      expect(listviewRowCount({ dataSourceSelector: 'rawJson', data: { n: 1 } })).toBe(0);
      expect(listviewRowCount({})).toBe(0);
      expect(listviewRowCount()).toBe(0);
    });
  });

  describe('a row', () => {
    it('[DynamicHeight-LIST-004] is as tall as its content', () => {
      expect(listviewRowHeight({ contentBottom: 90, properties: { rowHeight: 250 }, savedHeight: 400 })).toBe(90);
      expect(listviewRowHeight({ contentBottom: 310, properties: { rowHeight: 100 }, savedHeight: 400 })).toBe(310);
    });

    it('[DynamicHeight-LIST-005] takes the row height only when it has no content', () => {
      expect(listviewRowHeight({ contentBottom: 0, properties: { rowHeight: 100 }, savedHeight: 400 })).toBe(100);
      // No row height set either: the height the list was drawn at.
      expect(listviewRowHeight({ contentBottom: 0, properties: {}, savedHeight: 400 })).toBe(400);
    });

    it('[DynamicHeight-LIST-006] follows its content with Dynamic height off too', () => {
      const properties = { rowHeight: 100, dynamicHeight: false };
      expect(listviewRowHeight({ contentBottom: 310, properties, savedHeight: 400 })).toBe(310);
    });
  });

  describe('the widget', () => {
    it('[DynamicHeight-LIST-007] stacks its rows in list mode, plus 18px of outer chrome', () => {
      expect(listviewHeight({ properties: {}, rowHeights: [150, 90, 320], fallbackRowHeight: 0 })).toBe(578);
    });

    it('[DynamicHeight-LIST-008] gives a row not measured yet the fallback height', () => {
      expect(listviewHeight({ properties: {}, rowHeights: [150, undefined, 320], fallbackRowHeight: 90 })).toBe(578);
    });

    it('[DynamicHeight-LIST-009] adds a pixel per row for row borders in list mode, and the pagination bar', () => {
      const properties = { showBorder: true, enablePagination: true };
      // rows 300 + 90, 2px of borders, 61px pagination bar, 18px chrome
      expect(listviewHeight({ properties, rowHeights: [300, 90], fallbackRowHeight: 0 })).toBe(471);
    });

    it('[DynamicHeight-LIST-010] takes the tallest row of each band in grid mode, without row borders', () => {
      const properties = { mode: 'grid', columns: 2, showBorder: true };
      // bands [300, 120] and [200]
      expect(listviewHeight({ properties, rowHeights: [300, 120, 200], fallbackRowHeight: 0 })).toBe(518);
      // A missing or broken column count is one column.
      expect(
        listviewHeight({ properties: { mode: 'grid', columns: 'x' }, rowHeights: [300, 120], fallbackRowHeight: 0 })
      ).toBe(438);
    });

    it('[DynamicHeight-LIST-011] is its chrome alone with no rows', () => {
      // 61px pagination bar and 18px chrome; the fallback row height is never used.
      const properties = { enablePagination: true };
      expect(listviewHeight({ properties, rowHeights: [], fallbackRowHeight: 90 })).toBe(79);
    });
  });

  it('[DynamicHeight-LIST-012] sizes a row not measured yet like the row its components fill, else its row height', () => {
    const properties = { rowHeight: 100 };
    expect(listviewFallbackRowHeight({ templateBottom: 90, properties, savedHeight: 400 })).toBe(90);
    expect(listviewFallbackRowHeight({ templateBottom: 0, properties, savedHeight: 400 })).toBe(100);
    expect(listviewFallbackRowHeight({ templateBottom: 0, properties: {}, savedHeight: 400 })).toBe(400);
    expect(listviewFallbackRowHeight({ templateBottom: 0, properties: {} })).toBe(0);
  });
});
