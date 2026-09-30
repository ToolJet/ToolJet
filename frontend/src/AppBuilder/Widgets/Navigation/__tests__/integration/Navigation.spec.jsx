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
import { screen, within, waitFor } from '@testing-library/react';
import {
  createWidgetHarness,
  binding,
  setVariableOn,
  store,
  MODULE_ID,
} from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

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

  test('[Navigation-OVF-001] caps the popover height at 75vh and only scrolls past it, instead of growing unbounded', async () => {
    widget.render();
    const el = await openMorePopover();

    expect(el.style.maxHeight).toMatch(/75vh/);
    // `auto`, not `scroll`: a bar should appear only once content exceeds the cap.
    expect(el.style.overflowY).toBe('auto');
  });

  test('[Navigation-OVF-002] keeps the same height cap after expanding a group inside the popover', async () => {
    widget.render();
    const el = await openMorePopover();

    const groupTrigger = within(el).getByRole('button', { name: 'Group 1' });
    await widget.session.user.click(groupTrigger);
    await within(el).findByText('Option 3');

    expect(el.style.maxHeight).toMatch(/75vh/);
    expect(el.style.overflowY).toBe('auto');
  });
});

describe('Navigation widget — rendering, selection, and events', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  // Rendered vertically: useCalculateOverflow only runs for horizontal orientation, and jsdom's
  // zero-width layout otherwise buckets every item into the "More" popover's overflow list before
  // this assertion runs — orientation-independent guarantees are asserted here, not against the
  // horizontal top bar (see the "More" popover tests above for horizontal-specific assertions).
  test('[Navigation-DEF-001] configured menu items render as labeled, iconed entries and groups', async () => {
    const { container } = widget.render({ styles: { orientation: binding('vertical') } });

    expect(await screen.findByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Group 1')).toBeInTheDocument();
    expect(container.querySelector('[data-cy="nav-icon-item1"]')).toBeInTheDocument();
  });

  test('[Navigation-DEF-003] orientation switches between the horizontal NavigationMenu and the vertical accordion list', async () => {
    const { container: horizontalContainer } = widget.render();
    await screen.findByText('Option 1');

    expect(horizontalContainer.querySelector('.navigation-horizontal')).toBeInTheDocument();
    // In horizontal mode, a group is a dropdown trigger, not an always-mounted accordion.
    expect(horizontalContainer.querySelector('.accordion-item')).not.toBeInTheDocument();

    const { container: verticalContainer } = widget.render({ styles: { orientation: binding('vertical') } });
    await within(verticalContainer).findByText('Option 1');

    expect(verticalContainer.querySelector('.navigation-vertical')).toBeInTheDocument();
    expect(verticalContainer.querySelector('.accordion-item')).toBeInTheDocument();
  });

  test('[Navigation-SEL-001] clicking an item sets selectedItem and moves the previous selection into previousSelectedItem', async () => {
    const { container } = widget.render({ styles: { orientation: binding('vertical') } });
    await screen.findByText('Option 1');

    await widget.session.user.click(container.querySelector('[data-cy="nav-item-item1"]'));
    expect(widget.exposed().selectedItem).toMatchObject({ id: 'item1', label: 'Option 1' });
    expect(widget.exposed().previousSelectedItem).toBeNull();

    await widget.session.user.click(container.querySelector('[data-cy="nav-group-group1"] button'));
    const option3 = await screen.findByText('Option 3');
    await widget.session.user.click(option3);

    expect(widget.exposed().selectedItem).toMatchObject({ id: 'item3', label: 'Option 3', groupId: 'group1' });
    expect(widget.exposed().previousSelectedItem).toMatchObject({ id: 'item1', label: 'Option 1' });
  });

  // onClick's own action-resolution context has no direct handle on the clicked item (Navigation.jsx's
  // `fireEvent('onNavigationItemClicked', { itemId })` only uses `itemId` to pick which event rows run,
  // never exposes it as a `{{}}`-bindable customVariable) — but `applySelection` sets `selectedItem`
  // BEFORE firing, so a bound action can read the clicked item via `components.<name>.selectedItem`.
  test('[Navigation-EVT-001] clicking an item fires onClick, with selectedItem already updated by the time it runs', async () => {
    const { container } = widget.render({
      styles: { orientation: binding('vertical') },
      events: setVariableOn(ID, 'onClick', { key: 'clickedItemId', value: `{{components.${NAME}.selectedItem.id}}` }),
    });
    await screen.findByText('Option 1');

    await widget.session.user.click(container.querySelector('[data-cy="nav-item-item1"]'));

    expect(widget.variables().clickedItemId).toBe('item1');
  });

  test('[Navigation-DEF-002] displayStyle toggles which of icon/label render per item', async () => {
    const { container: textOnly } = widget.render({
      styles: { orientation: binding('vertical'), displayStyle: binding('textOnly') },
    });
    await within(textOnly).findByText('Option 1');
    expect(textOnly.querySelector('[data-cy="nav-icon-item1"]')).not.toBeInTheDocument();
    expect(textOnly.querySelector('[data-cy="nav-label-item1"]')).toBeInTheDocument();

    const { container: iconOnly } = widget.render({
      styles: { orientation: binding('vertical'), displayStyle: binding('iconOnly') },
    });
    await waitFor(() => expect(iconOnly.querySelector('[data-cy="nav-icon-item1"]')).toBeInTheDocument());
    expect(iconOnly.querySelector('[data-cy="nav-label-item1"]')).not.toBeInTheDocument();
  });

  // Guarantee revised during implementation: TablerIcon's fallback only applies when `iconName` is
  // set but not found in the tabler icon module (`module[iconName] || module[fallbackIcon]`) — its
  // load effect returns early when `iconName` itself is falsy/omitted, so an unset icon renders a
  // blank placeholder forever, not the fallback. Only the "unrecognized name" case is testable here.
  test('[Navigation-DEF-004] An unrecognized icon name falls back to a default icon instead of staying blank', async () => {
    const { container } = widget.render({
      styles: { orientation: binding('vertical') },
      properties: {
        menuItems: {
          value: [
            {
              id: 'baditem',
              label: 'Bad Icon',
              icon: { value: 'IconDoesNotExist12345' },
              iconVisibility: true,
              visible: { value: '{{false}}' },
              disable: { value: '{{false}}' },
              isGroup: false,
            },
          ],
        },
      },
    });
    await screen.findByText('Bad Icon');

    await waitFor(() => expect(container.querySelector('[data-cy="nav-icon-baditem"] svg')).toBeInTheDocument());
  });

  test('[Navigation-VIS-002] A disabled item renders disabled and unclickable, but stays visible', async () => {
    const { container } = widget.render({
      styles: { orientation: binding('vertical') },
      properties: {
        menuItems: {
          value: [
            {
              id: 'item1',
              label: 'Option 1',
              icon: { value: 'IconArchive' },
              iconVisibility: true,
              visible: { value: '{{false}}' },
              disable: { value: '{{true}}' },
              isGroup: false,
            },
          ],
        },
      },
    });
    const itemButton = await screen.findByText('Option 1').then((el) => el.closest('button'));

    expect(itemButton).toBeInTheDocument();
    expect(itemButton).toBeDisabled();
    expect(itemButton).toHaveClass('tj-list-item-disabled');

    await widget.session.user.click(itemButton);
    expect(widget.exposed().selectedItem).toBeNull();
  });

  test('[Navigation-CAP-001] A caption renders inline beneath the label for a vertical item', async () => {
    const { container } = widget.render({
      styles: { orientation: binding('vertical') },
      properties: {
        menuItems: {
          value: [
            {
              id: 'item1',
              label: 'Option 1',
              caption: 'A helpful caption',
              icon: { value: 'IconArchive' },
              iconVisibility: true,
              visible: { value: '{{false}}' },
              disable: { value: '{{false}}' },
              isGroup: false,
            },
          ],
        },
      },
    });
    await screen.findByText('Option 1');

    expect(within(container).getByText('A helpful caption')).toBeInTheDocument();
  });

  // Navigation-CAP-002 (tooltip-not-inline for a horizontal top-level item) is Navigation-BRW-003,
  // not an RTL scenario: any item placed in `links.overflow` — which is *every* item under jsdom's
  // zero-width layout, see Navigation-DEF-001 — is re-rendered by Navigation.jsx's "More" popover
  // branch with `orientation="vertical"` forced, regardless of the widget's own configured
  // orientation. That makes `isHorizontalTopLevel` false for every reachable item in jsdom, so the
  // inline-caption branch (CAP-001's) is the only one RTL can ever exercise; the tooltip branch only
  // runs for a genuinely non-overflowed horizontal top-level item, which requires real geometry.

  test('[Navigation-EVT-002] Clicking is a no-op while disabledState is true — no selection change, no event', async () => {
    const { container } = widget.render({
      styles: { orientation: binding('vertical') },
      properties: { disabledState: binding('{{true}}') },
      events: setVariableOn(ID, 'onClick', { key: 'clicked', value: 'YES' }),
    });
    await screen.findByText('Option 1');

    await widget.session.user.click(container.querySelector('[data-cy="nav-item-item1"]'));

    expect(widget.exposed().selectedItem).toBeNull();
    expect(widget.variables().clicked).toBeUndefined();
  });
});

describe('Navigation widget — visibility/loading/disabled states and their CSA precedence', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Navigation-STATE-001] visibility false hides the widget without unmounting it', async () => {
    const { container } = widget.render({
      styles: { orientation: binding('vertical') },
      properties: { visibility: binding('{{false}}') },
    });
    await waitFor(() => expect(container.querySelector('.navigation-widget')).toBeInTheDocument());

    expect(container.querySelector('.navigation-widget').style.display).toBe('none');
    expect(widget.exposed().isVisible).toBe(false);
  });

  test('[Navigation-STATE-002] setVisibility survives an unrelated property re-resolve', async () => {
    const { container } = widget.render({ styles: { orientation: binding('vertical') } });
    await screen.findByText('Option 1');

    await widget.act('setVisibility', false);
    expect(container.querySelector('.navigation-widget').style.display).toBe('none');

    // Unrelated re-resolve: disabledState changes, visibility itself is untouched.
    widget.render({
      styles: { orientation: binding('vertical') },
      properties: { disabledState: binding('{{true}}') },
    });
    await waitFor(() => expect(container.querySelector('.navigation-widget')).toHaveClass('navigation-disabled'));

    expect(container.querySelector('.navigation-widget').style.display).toBe('none');
  });

  test('[Navigation-STATE-003] loadingState shows a spinner in place of the menu', async () => {
    const { container } = widget.render({
      styles: { orientation: binding('vertical') },
      properties: { loadingState: binding('{{true}}') },
    });

    await waitFor(() => expect(container.querySelector('.navigation-spinner')).toBeInTheDocument());
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });

  test('[Navigation-STATE-004] setLoading survives an unrelated property re-resolve', async () => {
    const { container } = widget.render({ styles: { orientation: binding('vertical') } });
    await screen.findByText('Option 1');

    await widget.act('setLoading', true);
    await waitFor(() => expect(container.querySelector('.navigation-spinner')).toBeInTheDocument());

    // Unrelated re-resolve: visibility changes (explicitly, to a no-op true->true), loadingState untouched.
    widget.render({
      styles: { orientation: binding('vertical') },
      properties: { visibility: binding('{{true}}') },
    });
    await waitFor(() => expect(container.querySelector('.navigation-spinner')).toBeInTheDocument());
  });

  test('[Navigation-STATE-005] disabledState disables every item and blocks their onClick', async () => {
    const { container } = widget.render({
      styles: { orientation: binding('vertical') },
      properties: { disabledState: binding('{{true}}') },
    });
    await screen.findByText('Option 1');

    expect(container.querySelector('.navigation-widget')).toHaveClass('navigation-disabled');
    await widget.session.user.click(container.querySelector('[data-cy="nav-item-item1"]'));
    expect(widget.exposed().selectedItem).toBeNull();
  });

  test('[Navigation-STATE-006] setDisable survives an unrelated property re-resolve', async () => {
    const { container } = widget.render({ styles: { orientation: binding('vertical') } });
    await screen.findByText('Option 1');

    await widget.act('setDisable', true);
    await waitFor(() => expect(widget.exposed().isDisabled).toBe(true));

    // Unrelated re-resolve: loadingState changes, disabledState (the property) untouched.
    widget.render({
      styles: { orientation: binding('vertical') },
      properties: { loadingState: binding('{{false}}') },
    });
    await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());

    expect(widget.exposed().isDisabled).toBe(true);
  });
});

describe('Navigation widget — item-scoped CSA actions', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  const twoItems = () => ({
    styles: { orientation: binding('vertical') },
    properties: {
      menuItems: {
        value: [item('item1', 'Option 1'), item('item2', 'Option 2')],
      },
    },
  });

  test('[Navigation-ACT-001] selectItem programmatically selects a top-level item by id', async () => {
    widget.render(twoItems());
    await screen.findByText('Option 1');

    await widget.act('selectItem', 'item1');

    expect(widget.exposed().selectedItem).toMatchObject({ id: 'item1' });
  });

  test('[Navigation-ACT-002] selectItem is a no-op for a group id', async () => {
    widget.render({ styles: { orientation: binding('vertical') } }); // default widget has group1
    await screen.findByText('Option 1');

    await widget.act('selectItem', 'group1');

    expect(widget.exposed().selectedItem).toBeNull();
  });

  test('[Navigation-ACT-003] setItemVisibility flips one item without touching siblings', async () => {
    widget.render(twoItems());
    await screen.findByText('Option 1');
    await screen.findByText('Option 2');

    await widget.act('setItemVisibility', 'item1', false);

    await waitFor(() => expect(screen.queryByText('Option 1')).not.toBeInTheDocument());
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  test('[Navigation-ACT-004] setItemDisable flips one item without touching siblings', async () => {
    const { container } = widget.render(twoItems());
    await screen.findByText('Option 1');

    await widget.act('setItemDisable', 'item1', true);

    await waitFor(() => expect(container.querySelector('[data-cy="nav-item-item1"]')).toBeDisabled());
    expect(container.querySelector('[data-cy="nav-item-item2"]')).not.toBeDisabled();
  });

  test('[Navigation-ACT-005] A CSA-set item disable survives an unrelated property re-resolve, but resets once menuItems itself changes', async () => {
    const { container } = widget.render(twoItems());
    await screen.findByText('Option 1');

    await widget.act('setItemDisable', 'item1', true);
    await waitFor(() => expect(container.querySelector('[data-cy="nav-item-item1"]')).toBeDisabled());

    // Unrelated re-resolve: same menuItems content, a different property changes.
    widget.render({ ...twoItems(), properties: { ...twoItems().properties, loadingState: binding('{{false}}') } });
    await waitFor(() => expect(screen.getByText('Option 1')).toBeInTheDocument());
    expect(container.querySelector('[data-cy="nav-item-item1"]')).toBeDisabled();

    // Genuine menuItems change: item1 relabeled — a real definition edit, must resync and drop the CSA override.
    widget.render({
      styles: { orientation: binding('vertical') },
      properties: {
        menuItems: { value: [item('item1', 'Option 1 renamed'), item('item2', 'Option 2')] },
      },
    });
    await screen.findByText('Option 1 renamed');
    expect(container.querySelector('[data-cy="nav-item-item1"]')).not.toBeDisabled();
  });
});

describe('Navigation widget — style-driven container behaviour and compatibility', () => {
  beforeEach(() => widget.setup());
  afterEach(() => widget.teardown());

  test('[Navigation-STYLE-001] dynamicHeight switches the container to auto height with visible overflow, only in view mode', async () => {
    const { container: viewContainer } = widget.render({
      styles: { orientation: binding('vertical') },
      properties: { dynamicHeight: binding('{{true}}') },
      currentMode: 'view',
    });
    await within(viewContainer).findByText('Option 1');
    const viewRoot = viewContainer.querySelector('.navigation-widget');
    expect(viewRoot.style.height).toBe('auto');
    expect(viewRoot.style.overflow).toBe('visible');

    const { container: editContainer } = widget.render({
      styles: { orientation: binding('vertical') },
      properties: { dynamicHeight: binding('{{true}}') },
      currentMode: 'edit',
    });
    await within(editContainer).findByText('Option 1');
    const editRoot = editContainer.querySelector('.navigation-widget');
    expect(editRoot.style.height).toBe('100%');
  });

  test('[Navigation-STYLE-002] Container background/border/radius/padding reach the DOM as real inline style, respecting an explicit 0', async () => {
    const { container } = widget.render({
      styles: {
        orientation: binding('vertical'),
        backgroundColor: binding('rgb(1, 2, 3)'),
        borderColor: binding('rgb(4, 5, 6)'),
        borderRadius: binding('0'),
        padding: binding('0'),
      },
    });
    await within(container).findByText('Option 1');
    const root = container.querySelector('.navigation-widget');

    expect(root.style.backgroundColor).toBe('rgb(1, 2, 3)');
    expect(root.style.borderColor).toBe('rgb(4, 5, 6)');
    expect(root.style.borderRadius).toBe('0px');
    expect(root.style.padding).toBe('0px');
  });

  test('[Navigation-COMPAT-001] A saved definition predating dynamicHeight/collapseWhenHidden/subMenuAlignment still renders with pre-feature defaults', async () => {
    const { container } = widget.render({
      styles: { orientation: binding('vertical') },
      afterSeed: () => {
        // Simulate an old saved definition: strip the keys entirely, not just set to default.
        const definition = store().getComponentDefinition(ID, MODULE_ID)?.component?.definition;
        if (definition?.properties) {
          delete definition.properties.dynamicHeight;
          delete definition.properties.collapseWhenHidden;
        }
        if (definition?.styles) delete definition.styles.subMenuAlignment;
      },
    });

    await within(container).findByText('Option 1');
    expect(container.querySelector('.navigation-widget')).toBeInTheDocument();
    // No crash, and dynamicHeight's absence falls back to the fixed-height branch (falsy `??`/`&&` reads).
    expect(container.querySelector('.navigation-widget').style.height).toBe('100%');
  });

  test('[Navigation-A11Y-001] The widget root carries an accessible navigation role and label; a disabled item is unreachable via its own click handler', async () => {
    widget.render({
      styles: { orientation: binding('vertical') },
      properties: {
        menuItems: {
          value: [
            {
              id: 'item1',
              label: 'Option 1',
              icon: { value: 'IconArchive' },
              iconVisibility: true,
              visible: { value: '{{false}}' },
              disable: { value: '{{true}}' },
              isGroup: false,
            },
          ],
        },
      },
    });

    const nav = await screen.findByRole('navigation', { name: /navigation menu/i });
    expect(nav).toBeInTheDocument();
    const itemButton = (await screen.findByText('Option 1')).closest('button');
    expect(itemButton).toBeDisabled();
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

  test('[Navigation-GRP-001] a group whose every child is hidden does not render at all', async () => {
    const { container } = verticalWidget.render();

    expect(await screen.findByText('Group A')).toBeInTheDocument();
    expect(groupWrapper(container, 'groupHidden')).not.toBeInTheDocument();
    expect(screen.queryByText('Group Hidden')).not.toBeInTheDocument();
  });

  test('[Navigation-GRP-003] selecting an item inside Group A collapses a manually-expanded Group B and expands Group A', async () => {
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

  test('[Navigation-GRP-004] selecting a top-level item collapses every previously-expanded group', async () => {
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

  test('[Navigation-GRP-005] manually clicking a group header toggles only that group, leaving others untouched', async () => {
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
