import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import FormSignalContext from '@/AppBuilder/Widgets/Form/FormSignalContext';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from '../fuzz/packTestEnv';

installBrowserStubs();

// The MUI and Ant packs' DateTimePicker (role datetimepicker, what the build compiler swaps UI 2.0's
// ShadDateTimePicker to, 2026-10-25) on the real inline SDK, host renderer and Form signal; only module and CSS loading
// is replaced. The value is local date-time text, YYYY-MM-DDTHH:mm:ss, with selectedDate, selectedTime and
// unixTimestamp beside it as UI 2.0 exposes them.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const packs = {
  mui: require('../../../../../../../packs/mui/src/index.ts'),
  antd: require('../../../../../../../packs/antd/src/index.ts'),
};
const manifests = {
  mui: require('../../../../../../../packs/mui/pack.json'),
  antd: require('../../../../../../../packs/antd/pack.json'),
};
// The value setter and the clear action, by each pack's names.
const NAMES = { mui: { set: 'setValue', clear: 'clear' }, antd: { set: 'setFieldValue', clear: 'clear' } };

let mounts = 0;
const mount = async (pack, props = {}) => {
  loadLibraryModule.mockResolvedValue({ DateTimePicker: packs[pack].DateTimePicker });
  mounts += 1;
  const exposed = {};
  const events = [];
  // The exposed values as each event fired: a Form reads `value`, so it must be published before onChange.
  const seen = [];
  const actions = new Map();
  let state = { props, clearCount: 0 };
  const element = () => (
    <FormSignalContext.Provider value={{ clearCount: state.clearCount, submitAttemptCount: 0 }}>
      <InlineLibraryComponent
        bundleUrl="pack.js"
        cssUrl="pack.css"
        cacheKey={`datetime-${pack}-${mounts}`}
        componentName="DateTimePicker"
        componentProps={state.props}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={(key, value) => {
          exposed[key] = value;
        }}
        fireEvent={(event) => {
          events.push(event);
          seen.push({ event, exposed: { ...exposed } });
        }}
        actions={actions}
        host={makeHost('DateTimePicker', { validation: 'date' })}
        dataCy="datetime"
      />
    </FormSignalContext.Provider>
  );
  const view = render(element());
  const root = () => view.container.querySelector('[data-cy="datetime"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-cc-root')?.childElementCount).toBeGreaterThan(0));
  await waitFor(() => expect(actions.has(NAMES[pack].set)).toBe(true));
  const run = (action, ...args) => act(async () => actions.get(action)(...args));
  const setProps = (next) => {
    state = { ...state, props: { ...state.props, ...next } };
    act(() => view.rerender(element()));
  };
  const clearForm = () => {
    state = { ...state, clearCount: state.clearCount + 1 };
    act(() => view.rerender(element()));
  };
  const count = (event) => events.filter((e) => e === event).length;
  return { root, exposed, events, seen, actions, run, setProps, clearForm, count };
};

// Every element matching `selector` in the page, through open shadow roots (the popup layer is its own shadow root).
const deepAll = (selector, root = document) => {
  const found = [...root.querySelectorAll(selector)];
  for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deepAll(selector, el.shadowRoot));
  return found;
};
const parts = (d) => ({ selectedDate: d.slice(0, 10), selectedTime: d.slice(11, 16), unixTimestamp: new Date(d).getTime() });

afterEach(() => {
  document.body.innerHTML = '';
});

describe.each(['mui', 'antd'])('%s DateTimePicker', (pack) => {
  const { set, clear } = NAMES[pack];

  test('the manifest gives it the datetimepicker role with the UI 2.0 names mapped', () => {
    const entry = manifests[pack].components.DateTimePicker;
    expect(entry.role).toBe('datetimepicker');
    expect(entry.fit).toBe(true);
    expect(entry.loading).toBe('own');
    expect(entry.roleEvents.onSelect).toBe('onChange');
    expect(entry.roleActions.clearValue).toBe('clear');
    // The Ant DatePicker keeps the date role; showTime there still draws a date-time picker for saved apps.
    expect(manifests[pack].components.DatePicker.role).toBe('datepicker');
  });

  test('set by action: the value text and its parts, published before one onChange; the same value fires nothing', async () => {
    const w = await mount(pack);
    expect(w.exposed.value).toBe('');
    await w.run(set, '2026-10-25T14:30:00');
    expect(w.exposed.value).toBe('2026-10-25T14:30:00');
    expect(w.exposed).toMatchObject(parts('2026-10-25T14:30:00'));
    expect(w.count('onChange')).toBe(1);
    const fired = w.seen.find((s) => s.event === 'onChange');
    expect(fired.exposed).toMatchObject({ value: '2026-10-25T14:30:00', ...parts('2026-10-25T14:30:00') });

    // The same instant written another way is the same value.
    w.events.length = 0;
    await w.run(set, '2026-10-25T14:30:00');
    await w.run(set, '2026-10-25 14:30');
    expect(w.count('onChange')).toBe(0);
    // Twice in one batch: the second compares with the first.
    await act(async () => {
      w.actions.get(set)('2026-11-02T08:05:00');
      w.actions.get(set)('2026-11-02T08:05:00');
    });
    expect(w.count('onChange')).toBe(1);
    expect(w.exposed.value).toBe('2026-11-02T08:05:00');
  });

  test('clear empties the value and its parts, once', async () => {
    const w = await mount(pack, { value: '2026-10-25T14:30:00' });
    await waitFor(() => expect(w.exposed.selectedDate).toBe('2026-10-25'));
    w.events.length = 0;
    w.seen.length = 0;
    await w.run(clear);
    expect(w.exposed).toMatchObject({ value: '', selectedDate: '', selectedTime: '', unixTimestamp: null });
    expect(w.count('onChange')).toBe(1);
    expect(w.seen.find((s) => s.event === 'onChange').exposed.value).toBe('');
    await w.run(clear);
    expect(w.count('onChange')).toBe(1);
  });

  test('a value set by property shows in the field and updates the parts without an event', async () => {
    const w = await mount(pack, { value: '2026-10-25T14:30:00', ...(pack === 'mui' ? { ampm: false } : {}) });
    const input = () => w.root().querySelector('input');
    await waitFor(() => expect(input().value).toContain('14:30'));
    w.events.length = 0;
    w.setProps({ value: '2026-12-01T09:00:00' });
    await waitFor(() => expect(w.exposed.selectedDate).toBe('2026-12-01'));
    expect(w.exposed.selectedTime).toBe('09:00');
    expect(w.count('onChange')).toBe(0);
  });

  test('a Form clear empties the value, its parts and the field', async () => {
    const w = await mount(pack, { ...(pack === 'mui' ? { ampm: false } : {}) });
    await w.run(set, '2026-10-26T10:00:00');
    const input = () => w.root().querySelector('input');
    await waitFor(() => expect(input().value).toContain('10:00'));
    w.clearForm();
    await waitFor(() => expect(w.exposed.value).toBe(''));
    await waitFor(() => expect(w.exposed.selectedDate).toBe(''));
    await waitFor(() => expect(input().value).not.toContain('2026'));
  });
});

describe('picking in the popup', () => {
  test('MUI: a day and an hour picked in the popup write the value, one onChange each', async () => {
    const w = await mount('mui', { value: '2026-10-25T14:30:00', ampm: false });
    fireEvent.click(w.root().querySelector('button[aria-label*="hoose"]'));
    await waitFor(() => expect(deepAll('[role="dialog"]').length).toBeGreaterThan(0));
    await waitFor(() => expect(w.events).toContain('onOpen'));
    w.events.length = 0;
    w.seen.length = 0;
    const day = deepAll('button[role="gridcell"]').find((b) => b.textContent === '15');
    fireEvent.click(day);
    await waitFor(() => expect(w.exposed.value).toBe('2026-10-15T14:30:00'));
    expect(w.count('onChange')).toBe(1);
    expect(w.seen[0].exposed.value).toBe('2026-10-15T14:30:00');
    // The hours column of the clock.
    // Narrow layouts step from the calendar to the clock with Next; wide ones show both.
    const next = deepAll('button').find((b) => b.textContent === 'Next');
    if (next) fireEvent.click(next);
    const hour = deepAll('[role="listbox"][aria-label="Select hours"] [role="option"]').find((o) => o.textContent === '09');
    expect(hour).toBeTruthy();
    fireEvent.click(hour);
    await waitFor(() => expect(w.exposed.value).toBe('2026-10-15T09:30:00'));
    expect(w.count('onChange')).toBe(2);
    expect(w.exposed.selectedTime).toBe('09:30');
    // A minute every minutesStep (5 by default).
    const minutes = deepAll('[role="listbox"][aria-label="Select minutes"] [role="option"]').map((o) => o.textContent);
    expect(minutes.slice(0, 3)).toEqual(['00', '05', '10']);
  });

  test('Ant: a day picked and confirmed writes the value, one onChange', async () => {
    const w = await mount('antd', { value: '2026-10-25T14:30:00' });
    const input = w.root().querySelector('.ant-picker-input input');
    fireEvent.mouseDown(input);
    fireEvent.click(input);
    await waitFor(() => expect(deepAll('.ant-picker-dropdown').length).toBeGreaterThan(0));
    w.events.length = 0;
    w.seen.length = 0;
    fireEvent.click(deepAll('td[title="2026-10-15"]')[0]);
    fireEvent.click(deepAll('.ant-picker-ok button')[0]);
    await waitFor(() => expect(w.exposed.value).toBe('2026-10-15T14:30:00'));
    expect(w.count('onChange')).toBe(1);
    expect(w.seen.find((s) => s.event === 'onChange').exposed).toMatchObject({ value: '2026-10-15T14:30:00', selectedDate: '2026-10-15' });
  });

  test('Ant: a date and time typed and entered write the value', async () => {
    const w = await mount('antd', {});
    const input = w.root().querySelector('.ant-picker-input input');
    fireEvent.mouseDown(input);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '2026-10-16 09:15' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 13 });
    await waitFor(() => expect(w.exposed.value).toBe('2026-10-16T09:15:00'));
    expect(w.count('onChange')).toBe(1);
  });
});
