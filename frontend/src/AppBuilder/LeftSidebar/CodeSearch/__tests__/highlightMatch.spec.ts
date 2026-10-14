/**
 * Which element a result lands on once its panel or popover is open: the field's own wrapper,
 * tagged `data-param="<key>"`. Geometry is the only thing controlled: jsdom has no layout, so an
 * element counts as on screen unless it sits inside `[data-offscreen]` (an inactive tab pane).
 */
import { highlightMatch } from '../highlightMatch';
import type { RevealStep, SearchRecord } from '../buildSearchRecords';

const FLASH = 'tj-code-search-flash';

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (this: Element) {
    return (this.closest('[data-offscreen]') ? [] : [{}]) as unknown as DOMRectList;
  });
  Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  document.body.innerHTML = '';
});

const mount = (html: string) => {
  document.body.innerHTML = html;
};

// Fixtures carry only the fields highlightMatch reads.
const land = (record: Partial<SearchRecord>, opened: RevealStep[] = []) => {
  highlightMatch({ record: record as SearchRecord, start: 0, end: record.text?.length ?? 0, occurrence: 0 }, opened);
  jest.advanceTimersByTime(200);
  return document.querySelector<HTMLElement>(`.${FLASH}`);
};

describe('highlightMatch: landing on the field', () => {
  test('a field without a code editor flashes its own row, not the whole panel', () => {
    mount(`
      <div class="editor-sidebar"><div class="inspector">
        <div data-param="name"><input type="text" value="table1" /></div>
      </div></div>`);
    const flashed = land({
      entityType: 'component',
      entityId: 't1',
      fieldPath: ['name'],
      text: 'table1',
    });
    expect(flashed?.dataset.param).toBe('name');
    expect((document.activeElement as HTMLInputElement).value).toBe('table1');
  });

  test('two fields holding the same text: each lands on its own key, skipping an off-screen tab', () => {
    mount(`
      <div class="editor-sidebar"><div class="inspector">
        <div data-offscreen><div data-param="textColor">var(--text)</div></div>
        <div data-param="color">var(--text)</div>
        <div data-param="textColor">var(--text)</div>
      </div></div>`);
    const flashed = land({
      entityType: 'component',
      entityId: 't1',
      fieldPath: ['styles', 'textColor'],
      text: 'var(--text)',
    });
    expect(flashed?.dataset.param).toBe('textColor');
    expect(flashed?.closest('[data-offscreen]')).toBeNull();
  });

  test('a value inside a popover flashes that popover row', () => {
    mount(`
      <div class="editor-sidebar"><div class="inspector"></div></div>
      <div data-list-item-id="col-1">email</div>`);
    const flashed = land({
      entityType: 'component',
      entityId: 't1',
      fieldPath: ['properties', 'columns', 'value', '0', 'name'],
      text: 'email',
      reveal: [{ kind: 'listItem', ownerId: 't1', itemId: 'col-1' }],
    });
    expect(flashed?.dataset.listItemId).toBe('col-1');
  });

  test('a page field flashes the page row, not a field inside a closed details popover', () => {
    mount(`
      <div data-page-id="p1">Home</div>
      <div id="add-new-page-popup">
        <div data-param="pageFooter"><div data-param="showOnDesktop">footer</div></div>
      </div>`);
    const flashed = land({
      entityType: 'page',
      entityId: 'p1',
      fieldPath: ['pageFooter', 'showOnDesktop'],
      text: 'false',
      reveal: [{ kind: 'page', ownerId: null, itemId: 'p1' }],
    });
    expect(flashed?.dataset.pageId).toBe('p1');
  });

  test('in a whole panel, an inner key alone never lands on another field with that key', () => {
    mount(`
      <div class="editor-sidebar"><div class="inspector">
        <div data-param="name">table1</div>
      </div></div>`);
    land({
      entityType: 'component',
      entityId: 't1',
      fieldPath: ['properties', 'columns', 'value', '0', 'name'],
      text: 'email',
    });
    expect(document.querySelector('[data-param="name"]')?.classList.contains(FLASH)).toBe(false);
  });
});
