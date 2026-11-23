import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { OtpInput } from '../../../../../../packs/shadcn/src/components/OtpInput';

jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

// jsdom has no layout: box i stands at x 40i to 40i + 40, so a click at its middle lands on it.
const realRect = Element.prototype.getBoundingClientRect;
beforeAll(() => {
  Element.prototype.getBoundingClientRect = function rect() {
    if (this.dataset?.slot !== 'otp') return realRect.call(this);
    const i = [...this.parentElement.parentElement.querySelectorAll('[data-slot="otp"]')].indexOf(this);
    return { left: i * 40, right: i * 40 + 40, top: 0, bottom: 40, width: 40, height: 40, x: i * 40, y: 0 };
  };
});
afterAll(() => {
  Element.prototype.getBoundingClientRect = realRect;
});
afterEach(() => {
  document.body.innerHTML = '';
});

const mountOtp = async (props) => {
  loadLibraryModule.mockResolvedValue({ OtpInput });
  const exposed = {};
  const events = [];
  const actions = new Map();
  render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="shad-otp-positions"
      componentName="OtpInput"
      componentProps={{ length: 6, ...props }}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push(event)}
      actions={actions}
      host={{
        formField: true,
        fieldId: 'otp',
        disabled: false,
        loading: false,
        useValidation: () => ({ isValid: true, error: '', required: false, touch: () => {} }),
      }}
      dataCy="shad-otp"
    />
  );
  const root = () => document.querySelector('[data-cy="shad-otp"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.ui2-otp-input')).toBeTruthy());
  const input = () => root().querySelector('.ui2-otp-input');
  const shown = () => [...root().querySelectorAll('[data-slot="otp"]')].map((el) => el.textContent || '_').join('');
  const click = (i) =>
    act(() => {
      fireEvent.mouseDown(input(), { clientX: i * 40 + 20 });
      input().focus();
    });
  const key = (k) => act(() => void fireEvent.keyDown(input(), { key: k }));
  const keys = (text) => [...text].forEach(key);
  const run = (name, ...args) => act(() => actions.get(name)(...args));
  return { exposed, events, input, shown, click, key, keys, run };
};

// Each box keeps its place, as in Ant's OTP: emptying box 3 of a full code and typing again changes only box 3.
// The code used to be one string, so an emptied box moved the boxes after it one place left.
describe('Rocket OTP: boxes keep their places', () => {
  it('emptying box 3 of 123456 and typing 7 gives 127456', async () => {
    const v = await mountOtp({ defaultValue: '123456' });
    await waitFor(() => expect(v.shown()).toBe('123456'));
    v.click(2);
    v.key('Backspace');
    expect(v.shown()).toBe('12_456');
    expect(v.exposed.value).toBe('12456');
    expect(v.exposed.isComplete).toBe(false);
    v.click(2);
    v.key('7');
    expect(v.shown()).toBe('127456');
    expect(v.exposed.value).toBe('127456');
    expect(v.exposed.isComplete).toBe(true);
  });

  it('typing over a filled box replaces only that box', async () => {
    const v = await mountOtp({ defaultValue: '123456' });
    await waitFor(() => expect(v.shown()).toBe('123456'));
    v.click(2);
    v.key('9');
    expect(v.shown()).toBe('129456');
  });

  it('a letter in a numeric code changes nothing', async () => {
    const v = await mountOtp({ defaultValue: '123456' });
    await waitFor(() => expect(v.shown()).toBe('123456'));
    v.click(3);
    v.key('a');
    expect(v.shown()).toBe('123456');
  });

  it('Backspace on an empty box steps back and empties the one before it', async () => {
    const v = await mountOtp({ defaultValue: '123456' });
    await waitFor(() => expect(v.shown()).toBe('123456'));
    v.click(2);
    v.key('Backspace');
    v.key('Backspace');
    expect(v.shown()).toBe('1__456');
  });

  it('a fresh code typed from the first box fills the boxes in order', async () => {
    const v = await mountOtp({});
    act(() => v.input().focus());
    v.keys('123456');
    expect(v.shown()).toBe('123456');
    expect(v.exposed.isComplete).toBe(true);
  });

  it('a paste and setText still fill the code from the first box', async () => {
    const v = await mountOtp({ defaultValue: '123456' });
    await waitFor(() => expect(v.shown()).toBe('123456'));
    v.click(2);
    v.key('Backspace');
    act(() => void fireEvent.change(v.input(), { target: { value: '654321' } }));
    expect(v.shown()).toBe('654321');
    v.run('setText', '111222');
    await waitFor(() => expect(v.shown()).toBe('111222'));
  });
});
