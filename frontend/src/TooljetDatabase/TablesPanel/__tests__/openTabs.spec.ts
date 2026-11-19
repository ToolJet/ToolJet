// Open-table tabs: which tabs are open and which one is active. Pure, so every rule is checked without rendering.
import {
  closeAllTabs,
  closeOtherTabs,
  closeTab,
  openTab,
  parseStoredTabs,
  reconcileTabs,
  type TabsState,
} from '../openTabs';

const tabs = (ids: string[], activeId: string | null): TabsState => ({ ids, activeId });

describe('openTab', () => {
  it('appends a new table and makes it active', () => {
    expect(openTab(tabs(['a', 'b'], 'a'), 'c')).toEqual(tabs(['a', 'b', 'c'], 'c'));
  });

  it('activates a table that is already open without moving or duplicating it', () => {
    expect(openTab(tabs(['a', 'b', 'c'], 'c'), 'a')).toEqual(tabs(['a', 'b', 'c'], 'a'));
  });
});

describe('closeTab', () => {
  it('activates the right neighbour when the active tab closes', () => {
    expect(closeTab(tabs(['a', 'b', 'c'], 'b'), 'b')).toEqual(tabs(['a', 'c'], 'c'));
  });

  it('activates the left neighbour when the active tab was last', () => {
    expect(closeTab(tabs(['a', 'b', 'c'], 'c'), 'c')).toEqual(tabs(['a', 'b'], 'b'));
  });

  it('leaves no active tab when the last tab closes', () => {
    expect(closeTab(tabs(['a'], 'a'), 'a')).toEqual(tabs([], null));
  });

  it('keeps the active tab when another tab closes', () => {
    expect(closeTab(tabs(['a', 'b', 'c'], 'c'), 'a')).toEqual(tabs(['b', 'c'], 'c'));
  });

  it('ignores a tab that is not open', () => {
    const state = tabs(['a', 'b'], 'a');
    expect(closeTab(state, 'zzz')).toEqual(state);
  });
});

describe('closeOtherTabs', () => {
  it('keeps only the given tab and makes it active', () => {
    expect(closeOtherTabs(tabs(['a', 'b', 'c'], 'a'), 'b')).toEqual(tabs(['b'], 'b'));
  });

  it('does nothing for a tab that is not open', () => {
    const state = tabs(['a', 'b'], 'a');
    expect(closeOtherTabs(state, 'zzz')).toEqual(state);
  });
});

describe('closeAllTabs', () => {
  it('leaves nothing open', () => {
    expect(closeAllTabs()).toEqual(tabs([], null));
  });
});

describe('reconcileTabs', () => {
  it('drops tabs whose table no longer exists', () => {
    expect(reconcileTabs(tabs(['a', 'gone', 'c'], 'a'), ['a', 'c'])).toEqual(tabs(['a', 'c'], 'a'));
  });

  it('moves to a neighbour when the active table is gone', () => {
    expect(reconcileTabs(tabs(['a', 'gone', 'c'], 'gone'), ['a', 'c'])).toEqual(tabs(['a', 'c'], 'c'));
  });

  it('leaves no active tab when every table is gone', () => {
    expect(reconcileTabs(tabs(['x', 'y'], 'x'), [])).toEqual(tabs([], null));
  });

  it('removes duplicate ids', () => {
    expect(reconcileTabs(tabs(['a', 'a', 'b'], 'a'), ['a', 'b'])).toEqual(tabs(['a', 'b'], 'a'));
  });
});

describe('parseStoredTabs', () => {
  it('reads what was stored', () => {
    expect(parseStoredTabs(JSON.stringify({ ids: ['a', 'b'], activeId: 'b' }))).toEqual(tabs(['a', 'b'], 'b'));
  });

  it.each([null, '', 'not json', '{"ids":"a"}', '[]', '{"ids":[1,2]}'])('falls back to nothing open for %p', (raw) => {
    expect(parseStoredTabs(raw)).toEqual(tabs([], null));
  });

  it('drops an active id that is not among the open tabs', () => {
    expect(parseStoredTabs(JSON.stringify({ ids: ['a'], activeId: 'zzz' }))).toEqual(tabs(['a'], 'a'));
  });
});
