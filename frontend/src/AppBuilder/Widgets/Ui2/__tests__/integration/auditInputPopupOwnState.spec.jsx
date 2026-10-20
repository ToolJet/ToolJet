import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * UI 2.0 Currency and Phone inputs: a currency or country menu already open takes no choice once the input itself
 * stops taking input (disabled, loading or hidden).
 *
 * Release audit (16 Oct), Codex's CURRENCY-AND-COLOR-OPEN-BUSY-016, PHONE-COUNTRY-OPEN-BUSY-016 and
 * INPUT-HIDDEN-POPUP-016: neither menu went through the shared picker popup, so a menu opened before setDisable,
 * setLoading or setVisibility(false) stayed open, and a pointer or keyboard choice in it still changed the currency or
 * country (and the amount or number with it) and fired onChange. The Color picker, which uses the shared popup, is the
 * passing control.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'picker1';
const CURRENCY = {
  type: 'ShadCurrencyInput',
  properties: {
    label: binding('Amount'),
    defaultValue: binding('{{12.35}}'),
    currency: binding('USD'),
    locale: binding('en-US'),
    currencyOptions: binding("{{['USD','JPY']}}"),
  },
  trigger: () => document.querySelector('[role="combobox"][aria-label="Currency"]'),
  option: () => screen.queryByRole('option', { name: /^JPY/ }),
  read: (e) => ({ currency: e.currency, value: e.value }),
  initial: { currency: 'USD', value: 12.35 },
  selected: { currency: 'JPY', value: 12 },
};
const PHONE = {
  type: 'ShadPhoneInput',
  properties: {
    label: binding('Phone number'),
    defaultCountry: binding('US'),
    defaultValue: binding('+14155550123'),
    onlyCountries: binding("{{['US','GB']}}"),
  },
  trigger: () => screen.getByRole('button', { name: 'Country: United States' }),
  option: () => screen.queryByRole('option', { name: /United Kingdom/ }),
  read: (e) => ({ country: e.country, value: e.value }),
  initial: { country: 'US', value: '+14155550123' },
  selected: { country: 'GB', value: '+444155550123' },
};
const COLOR = {
  type: 'ShadColorPicker',
  properties: {
    label: binding('Brand color'),
    defaultValue: binding('#6366f1'),
    swatches: binding("{{['#6366f1','#22c55e']}}"),
  },
  trigger: () => document.getElementById(`shad-${ID}`),
  option: () => screen.queryByRole('button', { name: '#22c55e' }),
  read: (e) => ({ value: e.value }),
  initial: { value: '#6366f1' },
  selected: { value: '#22c55e' },
};
const CASES = [CURRENCY, PHONE, COLOR];
const harnesses = Object.fromEntries(
  CASES.map((c) => [
    c.type,
    createWidgetHarness({ componentType: c.type, id: ID, handle: ID, widgetWidth: 360, widgetHeight: 80 }),
  ])
);

const press = (c, trigger) =>
  c.type === 'ShadCurrencyInput'
    ? fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse', ctrlKey: false })
    : fireEvent.click(trigger);

const open = async (c, w) => {
  await act(async () => w.render({ currentMode: 'view', properties: c.properties }));
  await waitFor(() => expect(c.read(w.exposed())).toEqual(c.initial));
  await act(async () => w.setEvents(countInvocationsOn(ID, 'onChange', { key: 'changes' })));
  await act(async () => press(c, c.trigger()));
  await waitFor(() => expect(c.option()).toBeInTheDocument());
};

// A menu that closed when its owner stopped taking input is a valid outcome: there is nothing left to choose.
const choose = async (c, mode) => {
  if (!c.option()) return;
  const user = userEvent.setup();
  if (mode === 'pointer') return act(async () => user.click(c.option()));
  if (c.type === 'ShadPhoneInput') {
    // Loading resets the menu's search, so the keyboard choice filters to the one country first.
    const search = screen.getByPlaceholderText('Search country...');
    await act(async () => fireEvent.change(search, { target: { value: 'United Kingdom' } }));
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    await act(async () => search.focus());
    return act(async () => user.keyboard('{ArrowDown}{Enter}'));
  }
  await act(async () => c.option().focus());
  return act(async () => user.keyboard('{Enter}'));
};

const BLOCKS = {
  none: null,
  setDisable: [true, (e) => e.isDisabled === true],
  setLoading: [true, (e) => e.isLoading === true],
  setVisibility: [false, (e) => e.isVisible === false],
};

describe.each(CASES.map((c) => [c.type, c]))('%s', (_type, c) => {
  const w = harnesses[c.type];
  beforeEach(() => w.setup());
  afterEach(() => w.teardown());

  test.each(Object.keys(BLOCKS).flatMap((action) => ['pointer', 'keyboard'].map((mode) => [action, mode])))(
    'a menu opened before %s takes a %s choice only while the input takes input',
    async (action, mode) => {
      await open(c, w);
      if (BLOCKS[action]) {
        const [arg, applied] = BLOCKS[action];
        await w.act(action, arg);
        expect(applied(w.exposed())).toBe(true);
      }
      await choose(c, mode);
      const taken = action === 'none';
      await waitFor(() =>
        expect({ ...c.read(w.exposed()), changes: w.variables().changes || 0 }).toEqual({
          ...(taken ? c.selected : c.initial),
          changes: taken ? 1 : 0,
        })
      );
    }
  );

  test.each(['setDisable', 'setLoading'])(
    'after %s and back, the value is kept and one ordinary choice works once',
    async (action) => {
      await open(c, w);
      await w.act(action, true);
      await w.act(action, false);
      expect(c.trigger()).not.toBeDisabled();
      expect(c.read(w.exposed())).toEqual(c.initial);
      expect(w.variables().changes || 0).toBe(0);
      if (!c.option()) await act(async () => press(c, c.trigger()));
      await waitFor(() => expect(c.option()).toBeInTheDocument());
      await choose(c, 'keyboard');
      await waitFor(() => expect(c.read(w.exposed())).toEqual(c.selected));
      expect(w.variables().changes).toBe(1);
    }
  );
});
