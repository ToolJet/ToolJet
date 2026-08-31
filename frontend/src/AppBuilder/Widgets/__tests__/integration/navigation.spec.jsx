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
