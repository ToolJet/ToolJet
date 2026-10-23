/**
 * UI 2.0 pickers with an open popup.
 *
 * Release audit (17 Oct):
 *  - 37: open the popup, focus another choice, then disable, load or hide the picker, and press Enter without moving
 *    focus: the value changed and onSelect / onChange fired. The exposed state said disabled (or hidden) throughout.
 *  - 68: while the Color picker's popup is open, a color set from outside (setColor, a new default) did not reach its
 *    hex field; leaving the field then applied the old text and undid the change.
 */
import { createWidgetHarness } from '@/AppBuilder/Widgets/Ui2/__tests__/ui2Harness';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { binding, countInvocationsOn } from '@/AppBuilder/Widgets/__tests__/integration/widgetHarness';

const ID = 'picker1';
const OPTIONS = '{{[{label:"Alpha",value:"a"},{label:"Beta",value:"b"}]}}';
// [componentType, properties, change event, open and focus another choice, read the value]
const CASES = [
  [
    'ShadSelect',
    { defaultValue: 'a', options: OPTIONS },
    'onSelect',
    async () => {
      fireEvent.pointerDown(document.querySelector(`[id^="shad-${ID}-"]`), {
        button: 0,
        pointerType: 'mouse',
        ctrlKey: false,
      });
      return screen.findByRole('option', { name: 'Beta' });
    },
    (e) => e.value,
  ],
  [
    'ShadColorPicker',
    { defaultValue: '#6366f1', swatches: '{{["#6366f1","#22c55e"]}}' },
    'onChange',
    async () => {
      fireEvent.click(document.querySelector(`[id^="shad-${ID}-"]`));
      return screen.findByRole('button', { name: '#22c55e' });
    },
    (e) => e.value,
  ],
  [
    'ShadCombobox',
    { defaultValue: 'a', options: OPTIONS, searchPlaceholder: 'Search options' },
    'onSelect',
    async () => {
      fireEvent.click(document.querySelector(`[id^="shad-${ID}-"]`));
      const search = await screen.findByPlaceholderText('Search options');
      fireEvent.change(search, { target: { value: 'Beta' } });
      await waitFor(() =>
        expect(screen.getByText('Beta').closest('[cmdk-item]')).toHaveAttribute('data-selected', 'true')
      );
      return search;
    },
    (e) => e.value,
  ],
  [
    'ShadMultiselect',
    { defaultValue: '{{["a"]}}', options: OPTIONS, searchPlaceholder: 'Search options' },
    'onSelect',
    async () => {
      fireEvent.click(document.querySelector(`[id^="shad-${ID}-"]`));
      const search = await screen.findByPlaceholderText('Search options');
      fireEvent.change(search, { target: { value: 'Beta' } });
      await waitFor(() =>
        expect(screen.getByText('Beta').closest('[cmdk-item]')).toHaveAttribute('data-selected', 'true')
      );
      return search;
    },
    (e) => JSON.stringify(e.values),
  ],
  [
    'ShadDatePicker',
    { defaultValue: '2026-10-15', format: 'YYYY-MM-DD' },
    'onSelect',
    async () => {
      fireEvent.click(document.querySelector(`[id^="shad-${ID}-"]`));
      const grid = (await screen.findAllByRole('grid'))[0];
      return within(grid).getByText('20').closest('button');
    },
    (e) => e.value,
  ],
  [
    'ShadDateTimePicker',
    { defaultValue: '2026-10-15T09:00:00' },
    'onSelect',
    async () => {
      fireEvent.click(document.querySelector(`[id^="shad-${ID}-"]`));
      const grid = (await screen.findAllByRole('grid'))[0];
      return within(grid).getByText('20').closest('button');
    },
    (e) => e.value,
  ],
  [
    'ShadTimePicker',
    { defaultValue: '09:00', timeFormat: '24h', pickerStyle: 'list' },
    'onSelect',
    async () => {
      fireEvent.click(document.querySelector(`[id^="shad-${ID}-"]`));
      const times = await screen.findByRole('listbox', { name: 'Times' });
      return within(times).getByRole('option', { name: '10:00' });
    },
    (e) => e.value,
  ],
];

const harnesses = {};
const harnessFor = (componentType) =>
  (harnesses[componentType] ??= createWidgetHarness({
    componentType,
    id: ID,
    handle: 'picker1',
    widgetHeight: 80,
    widgetWidth: 320,
    preload: [componentType],
  }));
CASES.forEach(([type]) => harnessFor(type));

const bind = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, binding(v)]));

describe('[UI2-POPUP-037] an open popup takes no choice once its picker is disabled, loading or hidden', () => {
  it.each(
    CASES.flatMap((c) =>
      [
        ['setDisable', true],
        ['setLoading', true],
        ['setVisibility', false],
        ['none', null],
      ].map(([action, arg]) => [c[0], action, arg, ...c.slice(1)])
    )
  )('%s after %s', async (componentType, action, arg, properties, event, openAndFocus, read) => {
    const widget = harnessFor(componentType);
    await widget.setup();
    try {
      widget.render({ currentMode: 'view', properties: bind(properties) });
      await waitFor(() => expect(document.querySelector(`[id^="shad-${ID}-"]`)).toBeInTheDocument());
      widget.setEvents(countInvocationsOn(ID, event, { key: 'calls' }));
      const target = await openAndFocus();
      act(() => target.focus());
      const before = read(widget.exposed());
      if (action !== 'none') await widget.act(action, arg);
      await userEvent.setup({ delay: null }).keyboard('{Enter}');
      await new Promise((resolve) => setTimeout(resolve, 20));
      if (action === 'none') {
        // The control: an enabled picker takes the choice.
        await waitFor(() => expect(widget.variables().calls).toBe(1));
        expect(read(widget.exposed())).not.toBe(before);
      } else {
        expect({ value: read(widget.exposed()), calls: widget.variables().calls ?? 0 }).toEqual({
          value: before,
          calls: 0,
        });
      }
    } finally {
      widget.teardown();
    }
  });
});

describe('[UI2-POPUP-068] the open Color picker follows a color set from outside', () => {
  it.each([
    ['setColor', (widget) => widget.act('setColor', '#ff0000')],
    ['a new default', (widget) => widget.setComponentProperty(ID, 'defaultValue', '#ff0000', 'properties')],
  ])('%s', async (_label, setFromOutside) => {
    const widget = harnessFor('ShadColorPicker');
    await widget.setup();
    try {
      widget.render({ currentMode: 'view', properties: bind({ defaultValue: '#6366f1' }) });
      await waitFor(() => expect(document.querySelector(`[id^="shad-${ID}-"]`)).toBeInTheDocument());
      await act(async () => fireEvent.click(document.querySelector(`[id^="shad-${ID}-"]`)));
      const hex = await screen.findByRole('textbox', { name: /hex/i });
      await act(async () => hex.focus());
      await setFromOutside(widget);
      await waitFor(() => expect(widget.exposed().value).toBe('#ff0000'));
      await waitFor(() => expect(hex).toHaveValue('#ff0000'));
      await act(async () => hex.blur());
      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(widget.exposed().value).toBe('#ff0000');
    } finally {
      widget.teardown();
    }
  });
});
