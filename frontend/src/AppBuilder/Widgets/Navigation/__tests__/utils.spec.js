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
 * No store import, zero mocks.
 */
import { isGroupVisible, isMenuItemVisible } from '../utils';

const visibleChild = (id) => ({ id, isGroup: false, visible: false, disable: false });
const hiddenChild = (id) => ({ id, isGroup: false, visible: true, disable: false });
const disabledChild = (id) => ({ id, isGroup: false, visible: false, disable: true });

describe('isGroupVisible', () => {
  test('a group whose own visible flag marks it hidden is not visible, regardless of children', () => {
    const group = { id: 'g1', isGroup: true, visible: true, disable: false, children: [visibleChild('c1')] };
    expect(isGroupVisible(group)).toBe(false);
  });

  test('a group with an empty children array is not visible', () => {
    const group = { id: 'g1', isGroup: true, visible: false, disable: false, children: [] };
    expect(isGroupVisible(group)).toBe(false);
  });

  test('a group with children where ALL are hidden is not visible', () => {
    const group = {
      id: 'g1',
      isGroup: true,
      visible: false,
      disable: false,
      children: [hiddenChild('c1'), hiddenChild('c2')],
    };
    expect(isGroupVisible(group)).toBe(false);
  });

  test('a group with children where ALL are disabled (but not hidden) is not visible', () => {
    const group = {
      id: 'g1',
      isGroup: true,
      visible: false,
      disable: false,
      children: [disabledChild('c1'), disabledChild('c2')],
    };
    expect(isGroupVisible(group)).toBe(false);
  });

  test('a group with at least one child that is both visible and enabled is visible', () => {
    const group = {
      id: 'g1',
      isGroup: true,
      visible: false,
      disable: false,
      children: [hiddenChild('c1'), disabledChild('c2'), visibleChild('c3')],
    };
    expect(isGroupVisible(group)).toBe(true);
  });
});

describe('isMenuItemVisible', () => {
  test('dispatches to isGroupVisible for a group item', () => {
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

  test('dispatches to isItemVisible for a non-group item', () => {
    const visibleItem = { id: 'i1', isGroup: false, visible: false, disable: false };
    expect(isMenuItemVisible(visibleItem)).toBe(true);

    const hiddenItem = { id: 'i2', isGroup: false, visible: true, disable: false };
    expect(isMenuItemVisible(hiddenItem)).toBe(false);
  });
});
