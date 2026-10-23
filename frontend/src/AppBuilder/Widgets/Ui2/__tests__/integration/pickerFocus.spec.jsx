/**
 * UI 2.0 pickers: focus events, setBlur and validation around their popup.
 *
 * Release audit round 2 (17 Oct):
 *  - Escape closing an open Select, Combobox or Multiselect fired onBlur then onFocus, though focus never left the
 *    control (it went to its popup and came back). Confirmed in a real browser.
 *  - setBlur while the popup was open did nothing: focus was in the popup, and only the trigger was blurred.
 *  - A required picker's closed trigger did not say it was required (aria-required); once touched and invalid it says
 *    so (aria-invalid, described by the message), which is kept as a control.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'w1';
const OPTIONS = "{{[{ label: 'Alpha', value: 'a' }, { label: 'Beta', value: 'b' }]}}";
const TYPES = ['ShadSelect', 'ShadCombobox', 'ShadMultiselect'];
const harnesses = Object.fromEntries(
  TYPES.map((type) => [
    type,
    createWidgetHarness({ componentType: type, id: ID, handle: 'pick1', widgetHeight: 120, preload: [type] }),
  ])
);
const trigger = () => document.querySelector(`[id^="shad-${ID}-"]`);
const popupOpen = () => !!document.querySelector('[role=listbox]');
const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
const render = (widget, extra = {}) =>
  widget.render({
    currentMode: 'view',
    properties: { label: binding('Team'), options: binding(OPTIONS), ...extra },
    validation: { mandatory: binding('{{true}}') },
  });

describe.each(TYPES)('%s around its popup', (type) => {
  const widget = harnesses[type];
  beforeEach(() => widget.setup());
  afterEach(widget.teardown);

  const open = async (user) => {
    await user.click(trigger());
    await waitFor(() => expect(popupOpen()).toBe(true));
  };

  it('[UI2-FOCUS-101] Escape closes the popup with no extra onBlur or onFocus', async () => {
    render(widget);
    await waitFor(() => expect(trigger()).not.toBeNull());
    widget.setEvents([
      ...countInvocationsOn(ID, 'onFocus', { key: 'focuses' }),
      ...countInvocationsOn(ID, 'onBlur', { key: 'blurs' }),
    ]);
    const user = userEvent.setup({ delay: null });
    await open(user);
    await settle();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(popupOpen()).toBe(false));
    await settle();
    expect(document.activeElement).toBe(trigger());
    expect({ focuses: widget.variables().focuses ?? 0, blurs: widget.variables().blurs ?? 0 }).toEqual({
      focuses: 1,
      blurs: 0,
    });
    // The control: leaving for another element fires onBlur once.
    await user.tab();
    await settle();
    expect(widget.variables().blurs).toBe(1);
  });

  it('[UI2-FOCUS-102] setBlur with the popup open closes it and takes focus away', async () => {
    render(widget);
    await waitFor(() => expect(trigger()).not.toBeNull());
    widget.setEvents(countInvocationsOn(ID, 'onBlur', { key: 'blurs' }));
    const user = userEvent.setup({ delay: null });
    await open(user);
    await widget.act('setBlur');
    await waitFor(() => expect(popupOpen()).toBe(false));
    await settle();
    expect(trigger().contains(document.activeElement)).toBe(false);
    expect(widget.variables().blurs).toBe(1);
  });

  it('[UI2-VALID-104] a required picker’s closed trigger says it is required', async () => {
    render(widget);
    await waitFor(() => expect(trigger()).not.toBeNull());
    expect(trigger()).toHaveAttribute('aria-required', 'true');
    // The control: an optional picker does not.
    widget.setComponentProperty(ID, 'mandatory', '{{false}}', 'validation');
    await waitFor(() => expect(trigger()).not.toHaveAttribute('aria-required'));
  });

  it('[UI2-VALID-103] a required picker closed without a choice says it is invalid', async () => {
    render(widget);
    await waitFor(() => expect(trigger()).not.toBeNull());
    const user = userEvent.setup({ delay: null });
    await open(user);
    await user.keyboard('{Escape}');
    await waitFor(() => expect(popupOpen()).toBe(false));
    await user.tab();
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(trigger()).toHaveAttribute('aria-invalid', 'true');
    expect(trigger()).toHaveAccessibleDescription(screen.getByRole('alert').textContent);
    // The control: a choice clears it.
    await open(user);
    await act(async () => fireEvent.click(screen.getByRole('option', { name: 'Alpha' })));
    await waitFor(() => expect(trigger()).not.toHaveAttribute('aria-invalid', 'true'));
  });
});
