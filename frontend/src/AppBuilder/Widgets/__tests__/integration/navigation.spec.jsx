/**
 * Navigation — horizontal "More" overflow popover height behaviour.
 *
 * Bug: in horizontal mode, once items overflow into the kebab "More" popover
 * (Navigation.jsx, DropdownMenu.Content around line 617), expanding a group
 * inside that popover grows the popover's DOM height with nothing capping
 * it (`.page-menu-popup` has no `max-height`/`overflow` — see
 * navigation.scss). Radix's `DropdownMenu.Content` re-measures on that
 * growth and, if the popover no longer fits on the side it opened on,
 * flips it to the opposite side or shifts it abruptly.
 *
 * jsdom performs no real layout — every element measures 0x0 regardless of
 * CSS, so the flip itself (a real-viewport collision computed by Radix's
 * Popper from live `getBoundingClientRect`s) can't be observed here; that's
 * pixel-layout territory the project's own testing guide assigns to
 * Cypress. What CAN be verified in jsdom, and is the actual fix, is that
 * the popover's height is capped (so it never needs to grow past the space
 * it already has, which is what removes the flip trigger in a real
 * browser) with a scrollbar past the cap instead of unbounded growth.
 */
import { screen, within } from '@testing-library/react';
import { createWidgetHarness, binding } from './widgetHarness';

const ID = 'nav1';
const NAME = 'navigation1';

// isItemVisible (Navigation/utils.js) is inverted: `visible: {{true}}` hides the item,
// `{{false}}` (the widget's own default) shows it.
function item(id, label) {
  return {
    id,
    label,
    icon: { value: 'IconArchive' },
    iconVisibility: true,
    visible: { value: '{{false}}' },
    disable: { value: '{{false}}' },
    isGroup: false,
  };
}

function group(id, label, children) {
  return {
    id,
    label,
    icon: { value: 'IconFolder' },
    iconVisibility: true,
    visible: { value: '{{false}}' },
    disable: { value: '{{false}}' },
    isGroup: true,
    children,
  };
}

const widget = createWidgetHarness({
  componentType: 'Navigation',
  handle: NAME,
  id: ID,
  defaultProperties: {
    visibility: binding('{{true}}'),
    menuItems: {
      value: [
        item('item1', 'Option 1'),
        group('group1', 'Group 1', [item('item3', 'Option 3'), item('item4', 'Option 4')]),
      ],
    },
  },
  defaultStyles: {
    orientation: binding('horizontal'),
  },
});

/** `.page-menu-popup` is portaled to document.body, outside the render container. */
async function openMorePopover() {
  const moreButton = await screen.findByRole('button', { name: /more/i });
  await widget.session.user.click(moreButton);
  const el = await screen.findByRole('menu');
  await within(el).findByText('Option 1');
  return el;
}

describe('Navigation — "More" popover height cap', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('caps the popover height at 75vh and only scrolls past it, instead of growing unbounded', async () => {
    widget.render();
    const el = await openMorePopover();

    expect(el.style.maxHeight).toMatch(/75vh/);
    // `auto`, not `scroll`: a bar should appear only once content exceeds the cap.
    expect(el.style.overflowY).toBe('auto');
  });

  test('keeps the same height cap after expanding a group inside the popover', async () => {
    widget.render();
    const el = await openMorePopover();

    const groupTrigger = within(el).getByRole('button', { name: 'Group 1' });
    await widget.session.user.click(groupTrigger);
    await within(el).findByText('Option 3');

    expect(el.style.maxHeight).toMatch(/75vh/);
    expect(el.style.overflowY).toBe('auto');
  });
});

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
 */
const VERTICAL_NAV_ID = 'nav2';

const verticalChild = (id, label, { hidden = false, disabled = false } = {}) => ({
  id,
  label,
  icon: { value: 'IconFile' },
  iconVisibility: true,
  visible: hidden,
  disable: disabled,
  isGroup: false,
});

const verticalGroup = (id, label, children) => ({
  id,
  label,
  icon: { value: 'IconFolder' },
  iconVisibility: true,
  visible: false, // the group itself is not hidden
  disable: false,
  isGroup: true,
  children,
});

const verticalMenuItems = [
  { ...verticalChild('top1', 'Top Item') },
  verticalGroup('groupA', 'Group A', [verticalChild('a1', 'A Child 1')]),
  verticalGroup('groupB', 'Group B', [verticalChild('b1', 'B Child 1')]),
  // Every child is hidden, so the group itself must not render at all.
  verticalGroup('groupHidden', 'Group Hidden', [verticalChild('h1', 'Hidden Child', { hidden: true })]),
];

const verticalWidget = createWidgetHarness({
  componentType: 'Navigation',
  handle: 'nav2',
  id: VERTICAL_NAV_ID,
  defaultProperties: {
    menuItems: { value: verticalMenuItems },
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
  beforeEach(verticalWidget.setup);
  afterEach(verticalWidget.teardown);

  test('a group whose every child is hidden does not render at all', async () => {
    const { container } = verticalWidget.render();

    expect(await screen.findByText('Group A')).toBeInTheDocument();
    expect(groupWrapper(container, 'groupHidden')).not.toBeInTheDocument();
    expect(screen.queryByText('Group Hidden')).not.toBeInTheDocument();
  });

  test('selecting an item inside Group A collapses a manually-expanded Group B and expands Group A', async () => {
    const { container } = verticalWidget.render();
    await screen.findByText('Group A');

    // Manually expand Group B via its own header.
    await verticalWidget.session.user.click(groupHeader(container, 'groupB'));
    expect(isExpanded(container, 'groupB')).toBe(true);
    expect(isExpanded(container, 'groupA')).toBe(false);

    // Now select a leaf item that lives inside Group A.
    await verticalWidget.session.user.click(itemButton(container, 'a1'));

    expect(isExpanded(container, 'groupA')).toBe(true);
    expect(isExpanded(container, 'groupB')).toBe(false);
  });

  test('selecting a top-level item collapses every previously-expanded group', async () => {
    const { container } = verticalWidget.render();
    await screen.findByText('Group A');

    await verticalWidget.session.user.click(groupHeader(container, 'groupA'));
    await verticalWidget.session.user.click(groupHeader(container, 'groupB'));
    expect(isExpanded(container, 'groupA')).toBe(true);
    expect(isExpanded(container, 'groupB')).toBe(true);

    await verticalWidget.session.user.click(itemButton(container, 'top1'));

    expect(isExpanded(container, 'groupA')).toBe(false);
    expect(isExpanded(container, 'groupB')).toBe(false);
  });

  test('manually clicking a group header toggles only that group, leaving others untouched', async () => {
    const { container } = verticalWidget.render();
    await screen.findByText('Group A');

    await verticalWidget.session.user.click(groupHeader(container, 'groupA'));
    await verticalWidget.session.user.click(groupHeader(container, 'groupB'));
    expect(isExpanded(container, 'groupA')).toBe(true);
    expect(isExpanded(container, 'groupB')).toBe(true);

    // Toggle Group A closed again — Group B's already-expanded state must not change.
    await verticalWidget.session.user.click(groupHeader(container, 'groupA'));

    expect(isExpanded(container, 'groupA')).toBe(false);
    expect(isExpanded(container, 'groupB')).toBe(true);
  });
});
