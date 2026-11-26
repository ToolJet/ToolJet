import { fireEvent, waitFor } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA: in a page that scrolls, a Rocket 2.0 Date Time Picker's calendar opened hundreds of pixels below its field, off
// the screen, and the page jumped as it opened; the Time Picker in the same place opened right under its field. The
// calendar moves focus to a day as it opens, and that focus must not scroll the page under the popup. The pack
// component, the inline SDK and the host renderer are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

let focusSpy;
beforeEach(() => {
  focusSpy = jest.spyOn(HTMLElement.prototype, 'focus');
});
afterEach(() => {
  focusSpy.mockRestore();
  document.body.innerHTML = '';
});

const layer = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot;
// Each time focus moved to a calendar day: the day, and the options the focus call passed.
const dayFocuses = () =>
  focusSpy.mock.contexts
    .map((el, i) => ({ el, options: focusSpy.mock.calls[i][0] }))
    .filter(({ el }) => el?.hasAttribute?.('data-day'))
    .map(({ el, options }) => ({ day: el.getAttribute('data-day'), options }));

const openCalendar = async (name, props) => {
  const v = await mountPack('shadcn', name, props);
  fireEvent.click(await waitFor(() => v.root().querySelector('.uc-picker-trigger')));
  await waitFor(() => expect(layer()?.querySelector('[data-day]')).toBeTruthy());
  await waitFor(() => expect(dayFocuses().length).toBeGreaterThan(0));
  return v;
};
const noScroll = expect.objectContaining({ preventScroll: true });

describe('Rocket calendar pickers: opening does not scroll the page', () => {
  test('[PackComponent-DTP-SCROLL-001] the Date Time Picker focuses its day without scrolling', async () => {
    await openCalendar('DateTimePicker', { defaultValue: '2026-10-23 09:30' });
    dayFocuses().forEach(({ options }) => expect(options).toEqual(noScroll));
  });

  test('[PackComponent-DTP-SCROLL-002] the Date Picker, on the same calendar, focuses its day without scrolling', async () => {
    await openCalendar('DatePicker', { defaultValue: '2026-10-23' });
    dayFocuses().forEach(({ options }) => expect(options).toEqual(noScroll));
  });

  test('[PackComponent-DTP-SCROLL-003] control: the calendar still focuses the chosen day as it opens', async () => {
    await openCalendar('DateTimePicker', { defaultValue: '2026-10-23 09:30' });
    expect(dayFocuses().at(-1).day).toBe('2026-10-23');
  });
});
