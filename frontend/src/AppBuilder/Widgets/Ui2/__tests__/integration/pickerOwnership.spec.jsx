/**
 * UI 2.0 pickers in a panel: an open popup takes no choice once the panel that owns the picker is disabled or hidden.
 *
 * Release audit round 2 (17 Oct): the picker's own disabled, loading and hidden states already closed its popup
 * (usePickerPopup), but its popup lives in a portal, outside the panel. Disable the Tabs panel holding a picker, or
 * hide the Tabs, with the popup open and another choice focused, and Enter still changed the value and fired the
 * event, for seven picker types (Combobox reproduced with real browser clicks). What the picker already holds is kept
 * (a hidden tab keeps its drafts); only new choices are refused.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { componentDefinition } from '@/test/app-builder';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const TABS = 'tab1';
const PICK = 'pick1';
const OPTIONS = '{{[{label:"Alpha",value:"a"},{label:"Beta",value:"b"}]}}';
const trigger = () => document.querySelector(`[id^="shad-${PICK}-"]`);
const searchTo = async (text) => {
  const search = await screen.findByPlaceholderText('Search options');
  fireEvent.change(search, { target: { value: text } });
  await waitFor(() => expect(screen.getByText(text).closest('[cmdk-item]')).toHaveAttribute('data-selected', 'true'));
  return search;
};
const dayIn = async (day) =>
  within((await screen.findAllByRole('grid'))[0])
    .getByText(day)
    .closest('button');

// [componentType, properties, change event, open and focus another choice, read the value]
const CASES = [
  [
    'ShadSelect',
    { defaultValue: 'a', options: OPTIONS },
    'onSelect',
    async () => {
      fireEvent.pointerDown(trigger(), { button: 0, pointerType: 'mouse', ctrlKey: false });
      return screen.findByRole('option', { name: 'Beta' });
    },
    (e) => e.value,
  ],
  [
    'ShadCombobox',
    { defaultValue: 'a', options: OPTIONS, searchPlaceholder: 'Search options' },
    'onSelect',
    async () => {
      fireEvent.click(trigger());
      return searchTo('Beta');
    },
    (e) => e.value,
  ],
  [
    'ShadMultiselect',
    { defaultValue: '{{["a"]}}', options: OPTIONS, searchPlaceholder: 'Search options' },
    'onSelect',
    async () => {
      fireEvent.click(trigger());
      return searchTo('Beta');
    },
    (e) => JSON.stringify(e.values),
  ],
  [
    'ShadColorPicker',
    { defaultValue: '#6366f1', swatches: '{{["#6366f1","#22c55e"]}}' },
    'onChange',
    async () => {
      fireEvent.click(trigger());
      return screen.findByRole('button', { name: '#22c55e' });
    },
    (e) => e.value,
  ],
  [
    'ShadDatePicker',
    { defaultValue: '2026-10-15', format: 'YYYY-MM-DD' },
    'onSelect',
    async () => {
      fireEvent.click(trigger());
      return dayIn('20');
    },
    (e) => e.value,
  ],
  [
    'ShadDateTimePicker',
    { defaultValue: '2026-10-15T09:00:00' },
    'onSelect',
    async () => {
      fireEvent.click(trigger());
      return dayIn('20');
    },
    (e) => e.value,
  ],
  [
    'ShadTimePicker',
    { defaultValue: '09:00', timeFormat: '24h', pickerStyle: 'list' },
    'onSelect',
    async () => {
      fireEvent.click(trigger());
      const times = await screen.findByRole('listbox', { name: 'Times' });
      return within(times).getByRole('option', { name: '10:00' });
    },
    (e) => e.value,
  ],
];

const harnesses = Object.fromEntries(
  CASES.map(([type]) => [
    type,
    createWidgetHarness({
      componentType: 'ShadTabs',
      handle: 'tabs1',
      id: TABS,
      widgetHeight: 400,
      widgetWidth: 640,
      capabilities: { dnd: true },
      preload: [type],
    }),
  ])
);

// [what happens to the owner, the Tabs action and its arguments]
const OWNERS = [
  ['its tab is disabled', 'setTabDisable', ['t0', true]],
  ['the Tabs is hidden', 'setVisibility', [false]],
  ['nothing (control)', null, []],
];

describe('[UI2-OWNER-201] an open picker popup takes no choice once its panel is disabled or hidden', () => {
  it.each(CASES.flatMap((c) => OWNERS.map((o) => [c[0], o[0], ...c.slice(1), o[1], o[2]])))(
    '%s when %s',
    async (type, _owner, properties, event, openAndFocus, read, action, args) => {
      const widget = harnesses[type];
      await widget.setup();
      try {
        const child = componentDefinition(PICK, PICK, type, {
          ...Object.fromEntries(Object.entries(properties).map(([k, v]) => [k, binding(v)])),
        });
        child.component.parent = `${TABS}-t0`;
        child.component.definition.others = { showOnDesktop: binding('{{true}}'), showOnMobile: binding('{{false}}') };
        child.layouts = { desktop: { top: 0, left: 0, width: 20, height: 60 } };
        widget.render({ currentMode: 'view', extraComponents: { [PICK]: child } });
        await waitFor(() => expect(trigger()).not.toBeNull());
        widget.setEvents(countInvocationsOn(PICK, event, { key: 'calls' }));
        const picker = () => widget.exposed(PICK) ?? {};
        await waitFor(() => expect(read(picker())).toBeDefined());
        const target = await openAndFocus();
        act(() => target.focus());
        const before = read(picker());
        if (action) await widget.act(action, ...args);
        await userEvent.setup({ delay: null }).keyboard('{Enter}');
        await act(async () => new Promise((resolve) => setTimeout(resolve, 20)));
        if (action) {
          expect({ value: read(picker()), calls: widget.variables().calls ?? 0 }).toEqual({ value: before, calls: 0 });
        } else {
          await waitFor(() => expect(widget.variables().calls).toBe(1));
          expect(read(picker())).not.toBe(before);
        }
      } finally {
        widget.teardown();
      }
    }
  );
});
