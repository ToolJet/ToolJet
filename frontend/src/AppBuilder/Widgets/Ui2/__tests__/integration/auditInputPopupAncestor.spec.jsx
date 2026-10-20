import '@/AppBuilder/Widgets/Ui2/__tests__/consoleGuard';
/**
 * UI 2.0 Currency and Phone inputs: a currency or country menu already open takes no choice once the panel around the
 * input stops taking input (its Tabs pane switched away or disabled, its Form disabled).
 *
 * Release audit (16 Oct), Codex's TABS-INPUT-POPUP-OWNER-016 and FORM-INPUT-POPUP-OWNER-016: the menus are portalled
 * outside the pane or fieldset and did not go through the shared picker popup, so nothing checked the input's panels
 * when a choice arrived. A choice in a menu opened before the Tabs switched or disabled the pane, or before the Form
 * was disabled, still changed the currency or country and fired onChange (Radix Select also commits a mouse choice on
 * pointerup, which the disabled-Form guard did not catch). The Color picker is the passing control.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { componentDefinition } from '@/test/app-builder';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const FIELD = 'field1';
const CASES = [
  {
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
  },
  {
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
  },
  {
    type: 'ShadColorPicker',
    properties: {
      label: binding('Brand color'),
      defaultValue: binding('#6366f1'),
      swatches: binding("{{['#6366f1','#22c55e']}}"),
    },
    trigger: () => document.getElementById(`shad-${FIELD}`),
    option: () => screen.queryByRole('button', { name: '#22c55e' }),
    read: (e) => ({ value: e.value }),
    initial: { value: '#6366f1' },
    selected: { value: '#22c55e' },
  },
];

const child = (c, parent) => {
  const def = componentDefinition(FIELD, FIELD, c.type, c.properties);
  def.component.parent = parent;
  def.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{true}}') };
  def.layouts = { desktop: { top: 0, left: 0, width: 25, height: 100 } };
  return def;
};

const press = (c, trigger) =>
  c.type === 'ShadCurrencyInput'
    ? fireEvent.pointerDown(trigger, { button: 0, pointerType: 'mouse', ctrlKey: false })
    : fireEvent.click(trigger);

// A menu that closed when its panel stopped taking input is a valid outcome: there is nothing left to choose. The
// user-event calls are not wrapped in act: they await their own updates.
const choose = async (c, mode) => {
  if (!c.option()) return;
  const user = userEvent.setup();
  if (mode === 'pointer') return user.click(c.option());
  if (c.type === 'ShadPhoneInput') {
    const search = screen.getByPlaceholderText('Search country...');
    await act(async () => fireEvent.change(search, { target: { value: 'United Kingdom' } }));
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    await act(async () => search.focus());
    return user.keyboard('{ArrowDown}{Enter}');
  }
  await act(async () => c.option().focus());
  return user.keyboard('{Enter}');
};

const expectChoice = async (c, w, taken) => {
  // Only the panel changed: the input's own state stays visible and enabled.
  expect(w.exposed(FIELD).isVisible).toBe(true);
  expect(w.exposed(FIELD).isDisabled).toBe(false);
  await waitFor(() =>
    expect({ ...c.read(w.exposed(FIELD)), changes: w.variables().changes || 0 }).toEqual({
      ...(taken ? c.selected : c.initial),
      changes: taken ? 1 : 0,
    })
  );
};

const MODES = ['pointer', 'keyboard'];

describe.each(CASES.map((c) => [c.type, c]))('%s in Tabs', (_type, c) => {
  const w = createWidgetHarness({
    componentType: 'ShadTabs',
    id: 'tabs1',
    handle: 'tabs1',
    capabilities: { dnd: true },
    preload: [c.type],
    widgetWidth: 800,
    widgetHeight: 500,
  });
  beforeEach(() => w.setup());
  afterEach(() => w.teardown());

  test.each(['enabled', 'switch', 'disableTab'].flatMap((change) => MODES.map((mode) => [change, mode])))(
    'a menu opened before the pane is %s takes a %s choice only while the pane takes input',
    async (change, mode) => {
      await act(async () =>
        w.render({
          currentMode: 'view',
          properties: { defaultTab: binding('t0') },
          extraComponents: { [FIELD]: child(c, 'tabs1-t0') },
        })
      );
      await waitFor(() => expect(c.read(w.exposed(FIELD))).toEqual(c.initial));
      await act(async () => w.setEvents(countInvocationsOn(FIELD, 'onChange', { key: 'changes' })));
      const trigger = c.trigger();
      const panel = trigger.closest('[role="tabpanel"]');
      expect(panel).not.toBeNull();
      await act(async () => press(c, trigger));
      await waitFor(() => expect(c.option()).toBeInTheDocument());
      if (change === 'switch') {
        await w.act('setTab', 't1');
        expect(panel).not.toBeVisible();
      }
      if (change === 'disableTab') {
        await w.act('setTabDisable', 't0', true);
        expect(panel.inert).toBe(true);
      }
      await choose(c, mode);
      await expectChoice(c, w, change === 'enabled');
    }
  );
});

describe.each(CASES.map((c) => [c.type, c]))('%s in a Form', (_type, c) => {
  const w = createWidgetHarness({
    componentType: 'Form',
    id: 'form1',
    handle: 'form1',
    capabilities: { dnd: true },
    preload: [c.type],
    widgetWidth: 800,
    widgetHeight: 500,
  });
  beforeEach(() => w.setup());
  afterEach(async () => act(async () => w.teardown()));

  test.each(['enabled', 'disableForm'].flatMap((change) => MODES.map((mode) => [change, mode])))(
    'a menu opened before the Form is %s takes a %s choice only while the Form takes input',
    async (change, mode) => {
      await act(async () =>
        w.render({
          currentMode: 'view',
          properties: {
            disabledState: binding('{{false}}'),
            advanced: binding('{{false}}'),
            showHeader: binding('{{false}}'),
            showFooter: binding('{{false}}'),
          },
          extraComponents: { [FIELD]: child(c, 'form1') },
        })
      );
      await act(async () => {});
      await waitFor(() => expect(c.read(w.exposed(FIELD))).toEqual(c.initial));
      await waitFor(() => expect(w.exposed().formData[FIELD]).toBe(c.initial.value));
      await act(async () => w.setEvents(countInvocationsOn(FIELD, 'onChange', { key: 'changes' })));
      const trigger = c.trigger();
      expect(trigger.closest('fieldset')).not.toBeNull();
      await act(async () => press(c, trigger));
      await waitFor(() => expect(c.option()).toBeInTheDocument());
      if (change === 'disableForm') {
        await w.act('setDisable', true);
        expect(trigger.closest('fieldset')).toBeDisabled();
      }
      await choose(c, mode);
      await expectChoice(c, w, change === 'enabled');
    }
  );
});
