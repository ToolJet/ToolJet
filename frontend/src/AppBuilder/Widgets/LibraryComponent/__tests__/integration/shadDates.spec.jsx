import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { DatePicker } from '../../../../../../../packs/shadcn/src/components/DatePicker';
import { DateTimePicker } from '../../../../../../../packs/shadcn/src/components/DateTimePicker';
import { Calendar } from '../../../../../../../packs/shadcn/src/components/Calendar';
import { Dialog } from '../../../../../../../packs/shadcn/src/components/Dialog';

// The shadcn pack's date fields and Dialog on the real inline SDK and host renderer (release audit, 2026-10-23):
// calendar keys past disabled days and over month ends (SP-25, SP-26), an emptied bound default clearing the
// selection (SP-27), a DatePicker in a Dialog's body not cancelling the dialog (SP-28) and a blocked Dialog refusing
// to confirm (SP-02). Only the module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const PACK = { DatePicker, DateTimePicker, Calendar, Dialog };

const makeHost = (name, over = {}) => ({
  disabled: false,
  loading: false,
  fieldId: `dates-${name}`,
  useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
  setRows: () => {},
  rowSlotAttr: (index) => `tj-row-${name}-${index}`,
  registerPopupSlot: () => () => {},
  popupSlotAttr: (slot) => `tj-slot-${name}-${slot}`,
  ...over,
});

/** One pack widget as the host draws it; `record` collects its exposed values and events. */
const widget = (name, props, record, extra = {}) => (
  <InlineLibraryComponent
    bundleUrl="pack.js"
    cssUrl="pack.css"
    cacheKey="shad-dates"
    componentName={name}
    componentProps={props}
    componentStyles={{}}
    renderSlot={() => null}
    setExposedVariable={(key, value) => {
      record.exposed[key] = value;
    }}
    fireEvent={(event) => record.events.push(event)}
    actions={record.actions}
    host={extra.host ?? makeHost(name)}
    dataCy={extra.dataCy ?? name}
    popupSlotNames={extra.popupSlotNames}
    renderPopupSlot={extra.renderPopupSlot}
  />
);
const recorder = () => ({ exposed: {}, events: [], actions: new Map() });

// The shared popup layer every popup of the pack portals into.
const layer = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot;
const day = (root, iso) => root.querySelector(`[data-day="${iso}"]`);
const focusedDay = (root) => root.activeElement?.getAttribute('data-day');
// A real press: Radix decides outside presses on pointerdown, the click opens and picks.
const press = (el) => {
  fireEvent.pointerDown(el, { button: 0 });
  fireEvent.mouseDown(el, { button: 0 });
  fireEvent.pointerUp(el, { button: 0 });
  fireEvent.mouseUp(el, { button: 0 });
  fireEvent.click(el, { button: 0 });
};
// Radix starts listening for outside presses a tick after a layer mounts.
const tick = () => act(() => new Promise((resolve) => setTimeout(resolve, 20)));

beforeEach(() => loadLibraryModule.mockResolvedValue(PACK));
afterEach(() => {
  document.body.innerHTML = '';
});

const openPicker = async (view, name) => {
  const root = await waitFor(() => {
    const r = view.container.querySelector(`[data-cy="${name}"]`).shadowRoot;
    expect(r.querySelector('.uc-picker-trigger')).toBeTruthy();
    return r;
  });
  fireEvent.click(root.querySelector('.uc-picker-trigger'));
  return waitFor(() => {
    const popup = layer();
    expect(popup.querySelector('[data-day]')).toBeTruthy();
    return popup;
  });
};

describe.each([
  ['DatePicker', { defaultValue: '2026-10-23' }],
  ['DateTimePicker', { defaultValue: '2026-10-23 09:30' }],
])('%s calendar keys', (name, value) => {
  const blackout = { ...value, minDate: '2026-10-20', maxDate: '2026-10-30', disabledDates: ['2026-10-24'] };

  it('ArrowRight steps over a disabled day to the next enabled one and keeps an enabled tab stop (SP-25)', async () => {
    const view = render(widget(name, blackout, recorder()));
    const popup = await openPicker(view, name);
    act(() => day(popup, '2026-10-23').focus());
    expect(focusedDay(popup)).toBe('2026-10-23');
    expect(day(popup, '2026-10-24').disabled).toBe(true);
    fireEvent.keyDown(day(popup, '2026-10-23'), { key: 'ArrowRight' });
    await waitFor(() => expect(focusedDay(popup)).toBe('2026-10-25'));
    const stop = popup.querySelector('[data-day][tabindex="0"]');
    expect(stop.getAttribute('data-day')).toBe('2026-10-25');
    expect(stop.disabled).toBe(false);
    // And back over it.
    fireEvent.keyDown(day(popup, '2026-10-25'), { key: 'ArrowLeft' });
    await waitFor(() => expect(focusedDay(popup)).toBe('2026-10-23'));
  });

  it('stays on the last enabled day when every day beyond it is out of reach', async () => {
    const view = render(widget(name, { ...blackout, defaultValue: value.defaultValue.replace('23', '30') }, recorder()));
    const popup = await openPicker(view, name);
    act(() => day(popup, '2026-10-30').focus());
    expect(focusedDay(popup)).toBe('2026-10-30');
    fireEvent.keyDown(day(popup, '2026-10-30'), { key: 'ArrowRight' });
    fireEvent.keyDown(day(popup, '2026-10-30'), { key: 'PageDown' });
    await tick();
    expect(focusedDay(popup)).toBe('2026-10-30');
    expect(popup.querySelector('[role="grid"]').getAttribute('aria-label')).toBe('October 2026');
  });

  it.each([
    ['2027-01-31', 'PageDown', '2027-02-28', 'February 2027'],
    ['2027-03-31', 'PageUp', '2027-02-28', 'February 2027'],
    ['2028-01-31', 'PageDown', '2028-02-29', 'February 2028'],
    ['2026-10-15', 'PageDown', '2026-11-15', 'November 2026'],
  ])('from %s %s lands on %s, clamped to the target month (SP-26)', async (from, key, to, caption) => {
    const start = name === 'DateTimePicker' ? `${from} 09:30` : from;
    const view = render(widget(name, { defaultValue: start }, recorder()));
    const popup = await openPicker(view, name);
    act(() => day(popup, from).focus());
    expect(focusedDay(popup)).toBe(from);
    fireEvent.keyDown(day(popup, from), { key });
    await waitFor(() => expect(focusedDay(popup)).toBe(to));
    expect(popup.querySelector('[role="grid"]').getAttribute('aria-label')).toBe(caption);
  });
});

describe('inline Calendar keys', () => {
  it('ArrowRight steps over a disabled day (SP-25)', async () => {
    const view = render(widget('Calendar', { defaultValue: '2026-10-23', disabledDates: ['2026-10-24'] }, recorder()));
    const root = await waitFor(() => {
      const r = view.container.querySelector('[data-cy="Calendar"]').shadowRoot;
      expect(day(r, '2026-10-23')).toBeTruthy();
      return r;
    });
    day(root, '2026-10-23').focus();
    fireEvent.keyDown(day(root, '2026-10-23'), { key: 'ArrowRight' });
    await waitFor(() => expect(focusedDay(root)).toBe('2026-10-25'));
  });
});

describe('an emptied bound default (SP-27)', () => {
  it('clears the DatePicker, what it shows and what it exposes', async () => {
    const record = recorder();
    const view = render(widget('DatePicker', { defaultValue: '2027-01-31' }, record));
    const root = () => view.container.querySelector('[data-cy="DatePicker"]').shadowRoot;
    await waitFor(() => expect(root().textContent).toContain('31 Jan 2027'));
    expect(record.exposed.value).toBe('2027-01-31');
    view.rerender(widget('DatePicker', { defaultValue: '' }, record));
    await waitFor(() => expect(root().textContent).not.toContain('31 Jan 2027'));
    expect(record.exposed.value).toBe('');
    expect(record.exposed.unixTimestamp).toBe(null);
  });

  it('still starts an app saved before defaultValue on its legacy value', async () => {
    const record = recorder();
    const view = render(widget('DatePicker', { value: '2026-01-05' }, record));
    const root = () => view.container.querySelector('[data-cy="DatePicker"]').shadowRoot;
    await waitFor(() => expect(root().textContent).toContain('05 Jan 2026'));
  });

  it('clears the inline Calendar selection and selectedDates', async () => {
    const record = recorder();
    const props = { defaultValue: '2026-10-23', defaultMonth: '2026-10-01' };
    const view = render(widget('Calendar', props, record));
    const root = () => view.container.querySelector('[data-cy="Calendar"]').shadowRoot;
    await waitFor(() => expect(day(root(), '2026-10-23')?.getAttribute('aria-pressed')).toBe('true'));
    expect(record.exposed.selectedDates).toEqual(['2026-10-23']);
    view.rerender(widget('Calendar', { ...props, defaultValue: '' }, record));
    await waitFor(() => expect(day(root(), '2026-10-23').getAttribute('aria-pressed')).toBe('false'));
    expect(record.exposed.value).toBe('');
    expect(record.exposed.selectedDate).toBe('');
    expect(record.exposed.selectedDates).toEqual([]);
  });

  it('still starts an inline Calendar saved before defaultValue on its legacy selectedDate', async () => {
    const view = render(widget('Calendar', { selectedDate: '2026-10-23', defaultMonth: '2026-10-01' }, recorder()));
    const root = () => view.container.querySelector('[data-cy="Calendar"]').shadowRoot;
    await waitFor(() => expect(day(root(), '2026-10-23')?.getAttribute('aria-pressed')).toBe('true'));
  });
});

describe('a Dialog', () => {
  const DIALOG = { title: 'Synthetic dialog', description: 'No external actions', confirmText: 'Confirm test', showBody: true };
  const dialogContent = () => layer()?.querySelector('[role="dialog"]');
  const button = (label) => [...layer().querySelectorAll('button')].find((b) => b.textContent === label);

  // A Dialog whose body holds a DatePicker, both from the same pack revision (one popup layer), as the host draws it.
  const dialogWithPicker = (dialog, picker, dialogHost) =>
    widget('Dialog', DIALOG, dialog, {
      host: dialogHost,
      popupSlotNames: ['body'],
      renderPopupSlot: () => widget('DatePicker', { defaultValue: '' }, picker, { dataCy: 'bodyDate' }),
    });

  it('stays open while a DatePicker in its body opens and picks, and the backdrop still cancels it (SP-28)', async () => {
    const dialog = recorder();
    const picker = recorder();
    render(dialogWithPicker(dialog, picker, makeHost('Dialog')));
    await waitFor(() => expect(dialog.actions.get('open')).toBeTruthy());
    act(() => dialog.actions.get('open')());
    await waitFor(() => expect(dialogContent()).toBeTruthy());
    const pickerRoot = await waitFor(() => {
      const r = document.querySelector('.tj-cc-popup-host [data-cy="bodyDate"]')?.shadowRoot;
      expect(r?.querySelector('.uc-picker-trigger')).toBeTruthy();
      return r;
    });
    await tick();

    press(pickerRoot.querySelector('.uc-picker-trigger'));
    await waitFor(() => expect(layer().querySelector('[aria-label="Choose a date"]')).toBeTruthy());
    await tick();
    expect(dialog.events).not.toContain('onCancel');
    expect(dialogContent()).toBeTruthy();

    const first = layer().querySelector('[aria-label="Choose a date"] [data-day]:not([disabled]):not(.is-outside)');
    press(first);
    await waitFor(() => expect(picker.exposed.value).toBe(first.getAttribute('data-day')));
    await tick();
    expect(dialog.events).not.toContain('onCancel');
    expect(dialogContent()).toBeTruthy();

    await tick();
    press(layer().querySelector('.ui-dialog-overlay'));
    await waitFor(() => expect(dialog.events).toContain('onCancel'));
    expect(dialog.events).not.toContain('onConfirm');
  });

  it('stacks its body popups above itself', async () => {
    const dialog = recorder();
    render(dialogWithPicker(dialog, recorder(), makeHost('Dialog')));
    await waitFor(() => expect(dialog.actions.get('open')).toBeTruthy());
    act(() => dialog.actions.get('open')());
    await waitFor(() => expect(dialogContent()).toBeTruthy());
    expect(dialogContent().style.getPropertyValue('--ui-popup-layer')).toBe('1002');
  });

  const openDialog = async (host, wrap = (el) => el) => {
    const dialog = recorder();
    const view = render(wrap(widget('Dialog', { ...DIALOG, showBody: false }, dialog, { host })));
    await waitFor(() => expect(dialog.actions.get('open')).toBeTruthy());
    act(() => dialog.actions.get('open')());
    await waitFor(() => expect(dialogContent()).toBeTruthy());
    return { dialog, view };
  };

  it('confirms while its owner takes input', async () => {
    const { dialog } = await openDialog(makeHost('Dialog'));
    expect(button('Confirm test').disabled).toBe(false);
    fireEvent.click(button('Confirm test'));
    expect(dialog.events.filter((e) => e === 'onConfirm')).toHaveLength(1);
  });

  it('refuses to confirm once the host disables it, and keeps the dialog open (SP-02)', async () => {
    const { dialog, view } = await openDialog(makeHost('Dialog'));
    view.rerender(widget('Dialog', { ...DIALOG, showBody: false }, dialog, { host: makeHost('Dialog', { disabled: true }) }));
    await waitFor(() => expect(button('Confirm test').disabled).toBe(true));
    fireEvent.click(button('Confirm test'));
    expect(dialog.events).not.toContain('onConfirm');
    expect(dialogContent()).toBeTruthy();
    // Cancel still closes it.
    fireEvent.click(button('Cancel'));
    expect(dialog.events).toContain('onCancel');
  });

  it('refuses to confirm while a parent (a disabled Tabs) makes it inert, and confirms again after (SP-02)', async () => {
    const { dialog, view } = await openDialog(makeHost('Dialog'), (el) => <div data-cy="parent">{el}</div>);
    const parent = view.container.querySelector('[data-cy="parent"]');
    parent.setAttribute('inert', '');
    await waitFor(() => expect(button('Confirm test').disabled).toBe(true));
    fireEvent.click(button('Confirm test'));
    expect(dialog.events).not.toContain('onConfirm');
    parent.removeAttribute('inert');
    await waitFor(() => expect(button('Confirm test').disabled).toBe(false));
    fireEvent.click(button('Confirm test'));
    expect(dialog.events.filter((e) => e === 'onConfirm')).toHaveLength(1);
  });
});
