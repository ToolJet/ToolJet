import { act, fireEvent, waitFor } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// QA AD-32: the 12-hour settings of an Ant Design TimePicker only half worked. Use 12 hours with Format left at its
// default (HH:mm) showed 14:05 beside a popup with AM/PM; Format h:mm a alone showed 2:05 pm, but its popup listed hours
// 00-23 and no AM/PM column. The pack's TimePicker, the inline SDK and the host renderer are the real ones; only module
// and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

// The popup opens in the popup layer, outside the widget's shadow root.
const deepAll = (selector, root = document) => {
  const found = [...root.querySelectorAll(selector)];
  for (const el of root.querySelectorAll('*')) if (el.shadowRoot) found.push(...deepAll(selector, el.shadowRoot));
  return found;
};
const field = (v) => v.root().querySelector('.ant-picker-input input');
// The open popup's columns, each as the text of its cells.
const openColumns = async (v) => {
  act(() => {
    fireEvent.mouseDown(field(v));
    fireEvent.click(field(v));
  });
  await waitFor(() => expect(deepAll('.ant-picker-time-panel-column').length).toBeGreaterThan(0));
  return deepAll('.ant-picker-time-panel-column').map((column) =>
    [...column.querySelectorAll('.ant-picker-time-panel-cell-inner')].map((cell) => cell.textContent)
  );
};

describe('Ant Design TimePicker on the 12-hour clock', () => {
  test('[PackComponent-TIME12-001] Use 12 hours with the default Format shows 2:05 PM, and the value stays 14:05', async () => {
    const v = await mountPack('antd', 'TimePicker', { value: '14:05', use12Hours: true });

    expect(field(v).value).toBe('2:05 PM');
    expect(v.exposed.value).toBe('14:05');
  });

  test('[PackComponent-TIME12-002] Format h:mm a alone lists the hours 12 to 11 and an AM/PM column', async () => {
    const v = await mountPack('antd', 'TimePicker', { value: '14:05', format: 'h:mm a' });

    const columns = await openColumns(v);

    expect(field(v).value).toBe('2:05 pm');
    expect(columns).toHaveLength(3);
    expect(columns[0]).toHaveLength(12);
    expect(columns[0][0]).toBe('12');
    expect(columns[2]).toEqual(['AM', 'PM']);
  });

  test('[PackComponent-TIME12-003] HH:mm:ss with Use 12 hours shows 2:05:09 PM, and the value stays 24-hour text', async () => {
    const v = await mountPack('antd', 'TimePicker', { value: '14:05:09', format: 'HH:mm:ss', use12Hours: true });

    expect(field(v).value).toBe('2:05:09 PM');
    expect(v.exposed.value).toBe('14:05:09');
  });

  test('[PackComponent-TIME12-004] 3 PM picked on the 12-hour clock is stored as 15:05', async () => {
    const v = await mountPack('antd', 'TimePicker', { value: '14:05', format: 'h:mm a' });
    const columns = await openColumns(v);
    expect(columns).toHaveLength(3);

    const hours = deepAll('.ant-picker-time-panel-column')[0];
    act(() => {
      fireEvent.click(
        [...hours.querySelectorAll('.ant-picker-time-panel-cell-inner')].find((c) => c.textContent === '03')
      );
    });
    act(() => {
      fireEvent.click(deepAll('.ant-picker-ok button')[0]);
    });
    await settle();

    expect(v.exposed.value).toBe('15:05');
    expect(field(v).value).toBe('3:05 pm');
  });

  // Characterization: without either setting the clock stays 24-hour.
  test('[PackComponent-TIME12-005] the default Format keeps the 24-hour clock: 14:05 and the hours 00 to 23', async () => {
    const v = await mountPack('antd', 'TimePicker', { value: '14:05' });

    const columns = await openColumns(v);

    expect(field(v).value).toBe('14:05');
    expect(columns).toHaveLength(2);
    expect(columns[0]).toHaveLength(24);
  });
});
