/**
 * Pure unit tests for the group-visibility helpers in
 * src/AppBuilder/Widgets/Navigation/utils.js.
 *
 * `item.visible` stores a "hidden" flag (visible.value === '{{true}}', or the
 * raw boolean `true`, means the item IS HIDDEN — visible-by-default), while
 * `item.disable` stores a normal "disabled" flag (disable.value === '{{true}}',
 * or raw `true`, means disabled). See isItemVisible/isItemDisabled above these
 * helpers in the source file.
 *
 * A group only hides when EVERY child is hidden — a disabled-but-visible
 * child still keeps the group visible, since disabled just means
 * greyed-out/unclickable, not hidden.
 *
 * No store import, zero mocks.
 */
import { isGroupVisible, isMenuItemVisible, parseStyleDimension, findItemById, findParentGroup } from '../utils';

const visibleChild = (id) => ({ id, isGroup: false, visible: false, disable: false });
const hiddenChild = (id) => ({ id, isGroup: false, visible: true, disable: false });
const disabledChild = (id) => ({ id, isGroup: false, visible: false, disable: true });

describe('isGroupVisible', () => {
  test('[Navigation-GRP-001] a group whose own visible flag marks it hidden is not visible, regardless of children', () => {
    const group = { id: 'g1', isGroup: true, visible: true, disable: false, children: [visibleChild('c1')] };
    expect(isGroupVisible(group)).toBe(false);
  });

  test('[Navigation-GRP-001] a group with an empty children array is not visible', () => {
    const group = { id: 'g1', isGroup: true, visible: false, disable: false, children: [] };
    expect(isGroupVisible(group)).toBe(false);
  });

  test('[Navigation-GRP-001] a group with children where ALL are hidden is not visible', () => {
    const group = {
      id: 'g1',
      isGroup: true,
      visible: false,
      disable: false,
      children: [hiddenChild('c1'), hiddenChild('c2')],
    };
    expect(isGroupVisible(group)).toBe(false);
  });

  test('[Navigation-GRP-002] a group with children where ALL are disabled (but not hidden) is still visible — disabled is not hidden', () => {
    const group = {
      id: 'g1',
      isGroup: true,
      visible: false,
      disable: false,
      children: [disabledChild('c1'), disabledChild('c2')],
    };
    expect(isGroupVisible(group)).toBe(true);
  });

  test('[Navigation-GRP-002] a group with at least one visible child is visible, even if that child is disabled', () => {
    const group = {
      id: 'g1',
      isGroup: true,
      visible: false,
      disable: false,
      children: [hiddenChild('c1'), disabledChild('c2')],
    };
    expect(isGroupVisible(group)).toBe(true);
  });
});

describe('isMenuItemVisible', () => {
  test('[Navigation-GRP-001] dispatches to isGroupVisible for a group item', () => {
    const invisibleGroup = { id: 'g1', isGroup: true, visible: false, disable: false, children: [] };
    expect(isMenuItemVisible(invisibleGroup)).toBe(isGroupVisible(invisibleGroup));
    expect(isMenuItemVisible(invisibleGroup)).toBe(false);

    const visibleGroup = {
      id: 'g2',
      isGroup: true,
      visible: false,
      disable: false,
      children: [visibleChild('c1')],
    };
    expect(isMenuItemVisible(visibleGroup)).toBe(true);
  });

  test('[Navigation-VIS-001] dispatches to isItemVisible for a non-group item', () => {
    const visibleItem = { id: 'i1', isGroup: false, visible: false, disable: false };
    expect(isMenuItemVisible(visibleItem)).toBe(true);

    const hiddenItem = { id: 'i2', isGroup: false, visible: true, disable: false };
    expect(isMenuItemVisible(hiddenItem)).toBe(false);
  });
});

describe('parseStyleDimension', () => {
  test('[Navigation-STYLE-002] respects an explicit 0 instead of falling back to the default', () => {
    expect(parseStyleDimension('0', 8)).toBe(0);
    expect(parseStyleDimension(0, 2)).toBe(0);
  });

  test('falls back to the default for undefined, null, or non-numeric input', () => {
    expect(parseStyleDimension(undefined, 8)).toBe(8);
    expect(parseStyleDimension(null, 8)).toBe(8);
    expect(parseStyleDimension('not-a-number', 2)).toBe(2);
  });

  test('parses a positive numeric string', () => {
    expect(parseStyleDimension('12', 8)).toBe(12);
  });
});

// Per D-03: a duplicate id straddling two branches is not blocked by the runtime itself (only the
// Inspector's sibling-collision check does that) — this pins the resulting behavior as intended,
// not a crash or silent no-op. `findItemById` and `findParentGroup` are independent traversals with
// different "first match" criteria — `findItemById` returns the first NODE with a matching id
// (top-level items before descending into groups), while `findParentGroup` returns the first GROUP
// whose *children* contain a matching id, regardless of a same-id top-level item existing outside
// any group. `applySelection` (Navigation.jsx:393-419) calls both independently on the SAME clicked
// item's id, so clicking the top-level 'dup' item here would still resolve `findParentGroup` to
// groupA and misattribute the click's `groupId`/`groupLabel` to a group the clicked item is not
// actually in — a real (edge-case) inconsistency this test documents rather than fixes, per D-03.
describe('findItemById / findParentGroup with a cross-branch duplicate id', () => {
  test('[Navigation-SEL-002] a duplicate id across two branches resolves each helper independently, which can disagree', () => {
    const tree = [
      { id: 'dup', isGroup: false, label: 'First' },
      {
        id: 'groupA',
        isGroup: true,
        label: 'Group A',
        children: [{ id: 'dup', isGroup: false, label: 'Second' }],
      },
    ];

    // findItemById: top-level items are visited before descending — the top-level 'dup' wins.
    expect(findItemById(tree, 'dup')).toMatchObject({ label: 'First' });
    // findParentGroup: only ever looks at group children — it finds groupA's 'dup' child, even
    // though the id ALSO matches a top-level item outside any group.
    expect(findParentGroup(tree, 'dup')).toMatchObject({ id: 'groupA' });
  });
});
