/**
 * MultiselectV2 — accent color on an option's checkbox. Shared setup lives in
 * ./widgetHarness.js.
 *
 * Same jsdom virtualizer problem as DropdownV2 (see dropdownV2.spec.jsx's
 * header for the full explanation): CustomMenuList is shared between the two
 * widgets and measures offsetHeight, which jsdom hard-codes to 0, so the
 * option list renders empty unless it's stubbed per-test below.
 */
import { screen, waitFor, within } from '@testing-library/react';
import { createWidgetHarness, binding } from './widgetHarness';

const ID = 'ms1';
const NAME = 'multiselect1';

const widget = createWidgetHarness({
  componentType: 'MultiselectV2',
  handle: NAME,
  id: ID,
  defaultProperties: { visibility: binding('{{true}}') },
  defaultStyles: {
    auto: binding('{{true}}'),
    labelWidth: binding('33'),
    widthType: binding('ofComponent'),
    alignment: binding('side'),
    direction: binding('left'),
  },
});

function option(label, value, { visible = true, disable = false, caption = null } = {}) {
  return {
    label,
    value,
    caption,
    visible: { value: `{{${visible}}}` },
    disable: { value: `{{${disable}}}` },
  };
}

const trigger = (container) => container.querySelector('.multiselect-widget .px-0.h-100');

async function openMenu(container) {
  await waitFor(() => expect(trigger(container)).toBeInTheDocument());
  await widget.session.user.click(trigger(container));
}

describe('MultiselectV2', () => {
  let restoreOffsetHeight;

  beforeEach(() => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => 300 });
    restoreOffsetHeight = () => Object.defineProperty(HTMLElement.prototype, 'offsetHeight', descriptor);
    widget.setup();
  });

  afterEach(() => {
    restoreOffsetHeight();
    widget.teardown();
  });

  describe('accent color', () => {
    const OPTIONS = { value: [option('Alpha', '1'), option('Beta', '2')] };

    test('a selected option renders its checkbox with the configured accent color', async () => {
      const { container } = widget.render({
        properties: { options: OPTIONS, values: { value: ['1'] } },
        styles: { accentColor: binding('#008000') },
      });

      await openMenu(container);

      const alpha = (await screen.findAllByRole('option')).find((el) => el.textContent.includes('Alpha'));
      const checkbox = within(alpha).getByRole('checkbox');

      expect(checkbox).toBeChecked();
      expect(checkbox).toHaveStyle({ backgroundColor: '#008000', borderColor: '#008000' });
    });

    test('an unselected option does not get the accent color applied', async () => {
      const { container } = widget.render({
        properties: { options: OPTIONS, values: { value: ['1'] } },
        styles: { accentColor: binding('#008000') },
      });

      await openMenu(container);

      const beta = (await screen.findAllByRole('option')).find((el) => el.textContent.includes('Beta'));
      const checkbox = within(beta).getByRole('checkbox');

      expect(checkbox).not.toBeChecked();
      expect(checkbox.style.backgroundColor).toBe('');
    });
  });
});
