import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';
import { hostValidation } from './fuzz/hostValidation';

installBrowserStubs();

// QA items 52, 53 and 55 on the Ant pack, against what the ToolJet versions of these fields do:
// - 52: a value outside Min/Max (InputNumber) or Min/Max date (DatePicker, DateTimePicker) counted as valid, so a Form
//   submitted it; on the DateTimePicker the last allowed day still offered the times after the max.
// - 53: InputNumber's Precision rounded only what the field shows; the exposed value (and a Form's data) kept every
//   digit.
// - 55: an indeterminate Checkbox drew the same dash checked and unchecked, so a click changed nothing on screen.
// The pack's own source on the real inline SDK and host validation; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');

let mounts = 0;
const mount = async (name, props = {}) => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const exposed = {};
  const events = [];
  const actions = new Map();
  const setExposed = (key, value) => {
    exposed[key] = value;
  };
  const host = { ...makeHost(name, { validation: 'text' }), useValidation: hostValidation(setExposed) };
  let state = props;
  const element = () => (
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-field-rules"
      componentName={name}
      componentProps={state}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={setExposed}
      fireEvent={(event) => events.push(event)}
      actions={actions}
      host={host}
      dataCy={`ant-rules-${mounts}`}
    />
  );
  const rendered = render(element());
  const view = { exposed, events };
  view.root = () => rendered.container.querySelector('[data-cy^="ant-rules-"]').shadowRoot;
  view.setProps = (next) => {
    state = { ...state, ...next };
    act(() => rendered.rerender(element()));
  };
  view.run = (action, ...args) => act(() => actions.get(action)(...args));
  await waitFor(() => expect(view.root()?.querySelector('.tj-ant-root')).toBeTruthy());
  await settle();
  return view;
};
const settle = () => act(() => new Promise((r) => setTimeout(r, 50)));

afterEach(() => {
  document.body.innerHTML = '';
});

describe('Ant InputNumber Min and Max', () => {
  test.each([
    [{ value: 150, max: 100 }, false],
    [{ value: -5, min: 0 }, false],
    [{ value: 50, min: 0, max: 100 }, true],
    [{ value: 100, max: 100 }, true],
  ])('%j is valid: %s', async (props, valid) => {
    // Break this catches: a value past Max (or under Min) reported valid, so a Form submits it.
    const v = await mount('InputNumber', props);
    expect(v.exposed.isValid).toBe(valid);
  });

  test('a value set past Max by setFieldValue is invalid too', async () => {
    // Break this catches: only the bound value judged, not one an action sets.
    const v = await mount('InputNumber', { value: 50, max: 100 });
    v.run('setFieldValue', 150);
    await settle();
    expect(v.exposed.value).toBe(150);
    expect(v.exposed.isValid).toBe(false);
  });
});

describe('Ant InputNumber Precision', () => {
  test('rounds the exposed value as well as what the field shows', async () => {
    // Break this catches: the field showing 1.26 while the app (and a Form) reads 1.256.
    const v = await mount('InputNumber', { value: 1.256, precision: 2 });
    expect(v.root().querySelector('input').value).toBe('1.26');
    expect(v.exposed.value).toBe(1.26);
  });

  test('rounds a value an action sets', async () => {
    // Break this catches: setFieldValue writing every digit past Precision.
    const v = await mount('InputNumber', { value: 1, precision: 1 });
    v.run('setFieldValue', 2.349);
    await settle();
    expect(v.exposed.value).toBe(2.3);
  });

  test('leaves a value alone with no Precision', async () => {
    // Break this catches: rounding every number, Precision set or not.
    const v = await mount('InputNumber', { value: 1.256 });
    expect(v.exposed.value).toBe(1.256);
  });
});

describe.each([
  ['DatePicker', '2026-10-25'],
  ['DateTimePicker', '2026-10-25T10:00:00'],
])('Ant %s Min date and Max date', (name, inside) => {
  test.each([
    [{ value: '2026-11-02', maxDate: '2026-10-31' }, false],
    [{ value: '2026-09-01', minDate: '2026-10-01' }, false],
  ])('%j is valid: %s', async (props, valid) => {
    // Break this catches: a date past Max date (or before Min date) reported valid, so a Form submits it.
    const v = await mount(name, name === 'DateTimePicker' ? { ...props, value: `${props.value}T09:00:00` } : props);
    expect(v.exposed.isValid).toBe(valid);
  });

  test('a date inside the range is valid', async () => {
    // Break this catches: a bound check that throws out dates it allows.
    const v = await mount(name, { value: inside, minDate: '2026-10-01', maxDate: '2026-10-31' });
    expect(v.exposed.isValid).toBe(true);
  });
});

describe('Ant DateTimePicker on the last allowed day', () => {
  test('a time after Max date is invalid', async () => {
    // Break this catches: 18:00 accepted on the day whose max is 17:00.
    const v = await mount('DateTimePicker', { value: '2026-10-31T18:00:00', maxDate: '2026-10-31T17:00:00' });
    expect(v.exposed.isValid).toBe(false);
  });

  test('a date alone as Max date still allows that whole day', async () => {
    // Break this catches: maxDate 2026-10-31 read as its midnight, ruling out the rest of that day.
    const v = await mount('DateTimePicker', { value: '2026-10-31T18:00:00', maxDate: '2026-10-31' });
    expect(v.exposed.isValid).toBe(true);
  });
});

const deepAll = (selector, root = document) => {
  const found = [...root.querySelectorAll(selector)];
  for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deepAll(selector, el.shadowRoot));
  return found;
};

describe('Ant DateTimePicker time columns on the last allowed day', () => {
  test("the hours after Max date can't be picked; the ones before can", async () => {
    // Break this catches: 18:00 offered on the day whose max is 17:00, picked and submitted.
    const v = await mount('DateTimePicker', { value: '2026-10-31T10:00:00', maxDate: '2026-10-31T17:00:00' });
    const input = v.root().querySelector('.ant-picker-input input');
    act(() => input.focus());
    fireEvent.mouseDown(input);
    fireEvent.click(input);
    await waitFor(() => expect(deepAll('.ant-picker-time-panel-column').length).toBeGreaterThan(0));
    const hours = deepAll('.ant-picker-time-panel-column')[0];
    const hour = (h) =>
      [...hours.querySelectorAll('.ant-picker-time-panel-cell')].find((cell) => cell.textContent === h);

    expect(hour('18').className).toMatch(/ant-picker-time-panel-cell-disabled/);
    expect(hour('17').className).not.toMatch(/ant-picker-time-panel-cell-disabled/);
    expect(hour('09').className).not.toMatch(/ant-picker-time-panel-cell-disabled/);
  });
});

// QA item 56: once a day is clicked, focus is on the picker's panel, not its field, and Escape (which Ant handles on the
// field) did nothing: the popup stayed open. Escape on the panel now closes it, as the ToolJet Date time picker does.
describe.each([
  ['DateTimePicker', { value: '2026-10-20T10:00:00' }],
  ['DatePicker', { value: '2026-10-20' }],
  ['TimePicker', { value: '10:00' }],
  ['RangePicker', { value: ['2026-10-20', '2026-10-24'] }],
])('Ant %s popup', (name, props) => {
  test('closes on Escape pressed on its panel', async () => {
    // Break this catches: a popup left open by Escape once focus has moved from the field to the panel.
    const v = await mount(name, props);
    const input = v.root().querySelector('.ant-picker-input input');
    act(() => input.focus());
    fireEvent.mouseDown(input);
    fireEvent.click(input);
    await waitFor(() => expect(deepAll('.ant-picker-dropdown .ant-picker-panel').length).toBeGreaterThan(0));
    const dropdown = deepAll('.ant-picker-dropdown')[0];
    expect(dropdown.className).not.toMatch(/ant-picker-dropdown-hidden/);

    fireEvent.keyDown(dropdown.querySelector('.ant-picker-panel'), { key: 'Escape' });

    await waitFor(() => expect(dropdown.className).toMatch(/ant-picker-dropdown-hidden/));
  });
});

describe('Ant Checkbox indeterminate', () => {
  test('shows the tick once checked, and the dash while unchecked', async () => {
    // Break this catches: the dash drawn checked and unchecked alike, so a click changes nothing on screen.
    const v = await mount('Checkbox', { indeterminate: true, checked: false });
    const box = () => v.root().querySelector('.ant-checkbox');
    expect(box().className).toMatch(/ant-checkbox-indeterminate/);

    fireEvent.click(v.root().querySelector('input'));
    await settle();

    expect(v.exposed.checked).toBe(true);
    expect(box().className).not.toMatch(/ant-checkbox-indeterminate/);
    expect(box().className).toMatch(/ant-checkbox-checked/);
  });
});
