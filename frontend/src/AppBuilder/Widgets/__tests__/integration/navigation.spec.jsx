/**
 * Behaviour spec for the real Navigation widget
 * (src/AppBuilder/Widgets/Navigation/Navigation.jsx), vertical orientation.
 *
 * Nothing is mocked: the real composed store resolves `menuItems`, and the
 * real Navigation component renders the accordion-style groups. Covers the
 * two behaviours added by the nav-enhancement change:
 *   1. isGroupVisible/isMenuItemVisible gate which groups render at all
 *      (RenderNavGroup returns null for a group with no visible+enabled child).
 *   2. applySelection's expandedGroups bookkeeping — selecting a leaf item
 *      expands its own parent group and collapses every other group;
 *      selecting a top-level item collapses all groups; manually toggling one
 *      group's header via onToggleExpand does not touch any other group.
 *
 * `item.visible`/`item.disable` here use the raw-boolean (non-object) form
 * of isItemVisible/isItemDisabled — `visible: true` means HIDDEN,
 * `disable: true` means DISABLED — see Navigation/utils.js.
 *
 * Lives in __tests__/integration/ because it imports @/AppBuilder/_stores/store
 * via ./widgetHarness (scripts/validate-test-layout.js). Setup shared across
 * widgets lives in ./widgetHarness.js.
 */
import { screen } from '@testing-library/react';
import { createWidgetHarness, binding } from './widgetHarness';

const NAV = 'nav1';

const child = (id, label, { hidden = false, disabled = false } = {}) => ({
  id,
  label,
  icon: { value: 'IconFile' },
  iconVisibility: true,
  visible: hidden,
  disable: disabled,
  isGroup: false,
});

const group = (id, label, children) => ({
  id,
  label,
  icon: { value: 'IconFolder' },
  iconVisibility: true,
  visible: false, // the group itself is not hidden
  disable: false,
  isGroup: true,
  children,
});

const menuItems = [
  { ...child('top1', 'Top Item') },
  group('groupA', 'Group A', [child('a1', 'A Child 1')]),
  group('groupB', 'Group B', [child('b1', 'B Child 1')]),
  // Every child is hidden, so the group itself must not render at all.
  group('groupHidden', 'Group Hidden', [child('h1', 'Hidden Child', { hidden: true })]),
];

const widget = createWidgetHarness({
  componentType: 'Navigation',
  handle: 'nav1',
  id: NAV,
  defaultProperties: {
    menuItems: { value: menuItems },
    visibility: binding('{{true}}'),
    disabledState: binding('{{false}}'),
  },
  defaultStyles: {
    orientation: binding('vertical'),
  },
});

const groupWrapper = (container, id) => container.querySelector(`[data-cy="nav-group-${id}"]`);
const groupHeader = (container, id) => groupWrapper(container, id)?.querySelector('button');
const groupBody = (container, id) => groupWrapper(container, id)?.querySelector('.accordion-body');
const itemButton = (container, id) => container.querySelector(`[data-cy="nav-item-${id}"]`);

const isExpanded = (container, id) => groupBody(container, id)?.classList.contains('expanded');

describe('Navigation widget (vertical orientation)', () => {
  beforeEach(widget.setup);
  afterEach(widget.teardown);

  test('a group whose every child is hidden does not render at all', async () => {
    const { container } = widget.render();

    expect(await screen.findByText('Group A')).toBeInTheDocument();
    expect(groupWrapper(container, 'groupHidden')).not.toBeInTheDocument();
    expect(screen.queryByText('Group Hidden')).not.toBeInTheDocument();
  });

  test('selecting an item inside Group A collapses a manually-expanded Group B and expands Group A', async () => {
    const { container } = widget.render();
    await screen.findByText('Group A');

    // Manually expand Group B via its own header.
    await widget.session.user.click(groupHeader(container, 'groupB'));
    expect(isExpanded(container, 'groupB')).toBe(true);
    expect(isExpanded(container, 'groupA')).toBe(false);

    // Now select a leaf item that lives inside Group A.
    await widget.session.user.click(itemButton(container, 'a1'));

    expect(isExpanded(container, 'groupA')).toBe(true);
    expect(isExpanded(container, 'groupB')).toBe(false);
  });

  test('selecting a top-level item collapses every previously-expanded group', async () => {
    const { container } = widget.render();
    await screen.findByText('Group A');

    await widget.session.user.click(groupHeader(container, 'groupA'));
    await widget.session.user.click(groupHeader(container, 'groupB'));
    expect(isExpanded(container, 'groupA')).toBe(true);
    expect(isExpanded(container, 'groupB')).toBe(true);

    await widget.session.user.click(itemButton(container, 'top1'));

    expect(isExpanded(container, 'groupA')).toBe(false);
    expect(isExpanded(container, 'groupB')).toBe(false);
  });

  test('manually clicking a group header toggles only that group, leaving others untouched', async () => {
    const { container } = widget.render();
    await screen.findByText('Group A');

    await widget.session.user.click(groupHeader(container, 'groupA'));
    await widget.session.user.click(groupHeader(container, 'groupB'));
    expect(isExpanded(container, 'groupA')).toBe(true);
    expect(isExpanded(container, 'groupB')).toBe(true);

    // Toggle Group A closed again — Group B's already-expanded state must not change.
    await widget.session.user.click(groupHeader(container, 'groupA'));

    expect(isExpanded(container, 'groupA')).toBe(false);
    expect(isExpanded(container, 'groupB')).toBe(true);
  });
});
