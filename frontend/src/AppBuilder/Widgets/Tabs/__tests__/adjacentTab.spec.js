/** @jest-environment node */
import { resolveAdjacentTab } from '../adjacentTab';

// Semantics chosen deliberately, since nothing in the widget implied them and
// Retool has no equivalent action to copy (its Tabs exposes only setValue):
//
//   - hidden (`visible === false`) and disabled (`disable` is truthy) tabs are
//     skipped, so an action can never land the user somewhere they cannot see
//     or reach. Note `setTab` does NOT check `disable`, so this is stricter.
//   - the ends CLAMP rather than wrap. The dominant use is a wizard's Next/Back
//     button, where wrapping from the last step to the first is a bug. Adding an
//     opt-in `wrap` later stays backwards compatible; removing it would not.
//   - a clamped move returns null so the caller can skip firing onTabSwitch.
const tabs = (...specs) => specs.map(({ id, ...rest }) => ({ id, title: `Tab ${id}`, ...rest }));

describe('resolveAdjacentTab', () => {
  const three = tabs({ id: 't0' }, { id: 't1' }, { id: 't2' });

  it('moves to the following tab', () => {
    expect(resolveAdjacentTab(three, 't0', 'next')).toBe('t1');
    expect(resolveAdjacentTab(three, 't1', 'next')).toBe('t2');
  });

  it('moves to the preceding tab', () => {
    expect(resolveAdjacentTab(three, 't2', 'previous')).toBe('t1');
    expect(resolveAdjacentTab(three, 't1', 'previous')).toBe('t0');
  });

  it('clamps at both ends instead of wrapping', () => {
    expect(resolveAdjacentTab(three, 't2', 'next')).toBeNull();
    expect(resolveAdjacentTab(three, 't0', 'previous')).toBeNull();
  });

  it('skips hidden tabs', () => {
    const withHidden = tabs({ id: 't0' }, { id: 't1', visible: false }, { id: 't2' });

    expect(resolveAdjacentTab(withHidden, 't0', 'next')).toBe('t2');
    expect(resolveAdjacentTab(withHidden, 't2', 'previous')).toBe('t0');
  });

  it('skips disabled tabs', () => {
    const withDisabled = tabs({ id: 't0' }, { id: 't1', disable: true }, { id: 't2' });

    expect(resolveAdjacentTab(withDisabled, 't0', 'next')).toBe('t2');
    expect(resolveAdjacentTab(withDisabled, 't2', 'previous')).toBe('t0');
  });

  it('matches the UI by skipping any tab with a truthy disable value', () => {
    const withDynamicDisable = tabs({ id: 't0' }, { id: 't1', disable: 'dynamic-value' }, { id: 't2' });

    expect(resolveAdjacentTab(withDynamicDisable, 't0', 'next')).toBe('t2');
  });

  it('clamps when every remaining tab is skippable', () => {
    const trailingHidden = tabs({ id: 't0' }, { id: 't1', visible: false }, { id: 't2', disable: true });

    expect(resolveAdjacentTab(trailingHidden, 't0', 'next')).toBeNull();
  });

  it('matches ids loosely, because a dynamic tab list yields numeric ids', () => {
    // Tabs.jsx assigns `id: parsedTab.id ? parsedTab.id : index`, so a tab list
    // built from code can carry numbers while the configured list carries
    // strings, and the widget compares with == nearly everywhere.
    const numeric = tabs({ id: 0 }, { id: 1 }, { id: 2 });

    expect(resolveAdjacentTab(numeric, '0', 'next')).toBe(1);
    expect(resolveAdjacentTab(numeric, 1, 'next')).toBe(2);
  });

  it('moves on from a tab that has since been hidden', () => {
    // setTabVisibility can hide the tab the user is currently on.
    const currentHidden = tabs({ id: 't0', visible: false }, { id: 't1' }, { id: 't2' });

    expect(resolveAdjacentTab(currentHidden, 't0', 'next')).toBe('t1');
  });

  it('falls back to the first or last navigable tab when the current id is unknown', () => {
    // setTab does no validation, so currentTab can hold an id that is not in the list.
    expect(resolveAdjacentTab(three, 'nope', 'next')).toBe('t0');
    expect(resolveAdjacentTab(three, 'nope', 'previous')).toBe('t2');
  });

  it('returns null for an empty or unusable tab list', () => {
    expect(resolveAdjacentTab([], 't0', 'next')).toBeNull();
    expect(resolveAdjacentTab(undefined, 't0', 'next')).toBeNull();
    expect(resolveAdjacentTab(tabs({ id: 't0', visible: false }), 't0', 'next')).toBeNull();
  });
});
