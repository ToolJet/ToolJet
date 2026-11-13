import { act, fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// QA AD-58: Backspace in the decimals of an Ant Design Currency Input put the deleted digit back as 0, then deleted the
// decimal point and turned the padded decimals into whole digits: 1,234,567.89 went to 1,234,567.80, 1,234,567.00,
// 123,456,700.00 and 12,345,670,000.00, and the amount stayed multiplied after blur. rc-input-number formats the text
// again when the value comes back and on each render; the field's formatter padded it to Precision every time. The
// pack's component, Ant's InputNumber, the inline SDK and the host renderer are the real ones; only module and CSS
// loading is replaced. Each Backspace is the browser's: the key down, the text one character shorter, the key up.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const field = (v) => v.root().querySelector('input.ant-input-number-input');
const backspace = async (input) => {
  act(() => {
    fireEvent.keyDown(input, { key: 'Backspace', code: 'Backspace', keyCode: 8 });
    fireEvent.change(input, { target: { value: input.value.slice(0, -1) } });
    fireEvent.keyUp(input, { key: 'Backspace', code: 'Backspace', keyCode: 8 });
  });
  await settle();
};
// The field's text and the exposed value after each Backspace, then after the focus leaves.
const editFromTheEnd = async (v, times) => {
  const input = field(v);
  act(() => {
    input.focus();
  });
  const steps = [];
  for (let i = 0; i < times; i++) {
    await backspace(input);
    steps.push([input.value, v.exposed.value]);
  }
  act(() => {
    input.blur();
  });
  await settle();
  steps.push([input.value, v.exposed.value]);
  return steps;
};

describe('Ant Design Currency Input: Backspace in the decimals', () => {
  test('[PackComponent-CURRBACK-001] 1,234,567.89 loses one character a key, and pads only when the focus leaves', async () => {
    const v = await mountPack('antd', 'CurrencyInput', { value: 1234567.891 });
    await settle();
    expect(field(v).value).toBe('1,234,567.89');

    expect(await editFromTheEnd(v, 3)).toEqual([
      ['1,234,567.8', 1234567.8],
      ['1,234,567.', 1234567],
      ['1,234,567', 1234567],
      ['1,234,567.00', 1234567],
    ]);
  });

  test('[PackComponent-CURRBACK-002] de-DE 1.234,50 does the same, in its own separators', async () => {
    const v = await mountPack('antd', 'CurrencyInput', { value: 1234.5, locale: 'de-DE', currency: 'EUR' });
    await settle();
    expect(field(v).value).toBe('1.234,50');

    expect(await editFromTheEnd(v, 3)).toEqual([
      ['1.234,5', 1234.5],
      ['1.234,', 1234],
      ['1.234', 1234],
      ['1.234,00', 1234],
    ]);
  });
});
