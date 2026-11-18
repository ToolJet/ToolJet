import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');

afterEach(() => {
  document.body.innerHTML = '';
});

const frame = () => act(() => new Promise((r) => requestAnimationFrame(() => r())));

const mountOtp = async (value) => {
  loadLibraryModule.mockResolvedValue(pack);
  const exposed = {};
  const events = [];
  const actions = new Map();
  render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-otp-overwrite"
      componentName="OTP"
      componentProps={{ value, length: 6 }}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, v) => {
        exposed[key] = v;
      }}
      fireEvent={(event) => events.push(event)}
      actions={actions}
      host={makeHost('OTP', { validation: 'text' })}
      dataCy="ant-otp"
    />
  );
  const root = () => document.querySelector('[data-cy="ant-otp"]').shadowRoot;
  const boxes = () => [...root().querySelectorAll('.ant-otp-input')];
  await waitFor(() =>
    expect(
      boxes()
        .map((b) => b.value)
        .join('')
    ).toBe(value)
  );
  // A click on a box, as a browser delivers it: focus, then mouse up.
  const click = async (i) => {
    const box = boxes()[i];
    act(() => {
      fireEvent.mouseDown(box);
      box.focus();
      box.setSelectionRange(0, 0);
      fireEvent.mouseUp(box);
    });
    await frame();
    await frame();
    return box;
  };
  // A key typed as a browser types it: a keydown, and unless that is refused, the key replaces the selected text or
  // goes in at the caret.
  const type = (box, ch) => {
    const { value: v, selectionStart: s, selectionEnd: e } = box;
    act(() => {
      if (!fireEvent.keyDown(box, { key: ch })) return;
      fireEvent.input(box, { target: { value: v.slice(0, s) + ch + v.slice(e) } });
    });
  };
  // Backspace on a selected box, as a browser does it: the selection is deleted.
  const erase = (box) => {
    const { value: v, selectionStart: s, selectionEnd: e } = box;
    act(() => {
      if (!fireEvent.keyDown(box, { key: 'Backspace' })) return;
      fireEvent.input(box, { target: { value: v.slice(0, s) + v.slice(e) } });
    });
  };
  const shown = () =>
    boxes()
      .map((b) => b.value || '_')
      .join('');
  const run = (name, ...args) => act(() => actions.get(name)(...args));
  return { exposed, events, boxes, click, type, erase, shown, run };
};

// A click selects the box's character, so typing replaces it: Ant's own select-on-focus compares
// document.activeElement, which inside the pack's shadow root is the host, and never ran (AD-22).
describe('Ant OTP: typing over a filled box', () => {
  it('a click selects the box', async () => {
    const v = await mountOtp('123456');
    const box = await v.click(2);
    expect([box.selectionStart, box.selectionEnd]).toEqual([0, 1]);
  });

  it('correcting box 3 of 123456 to 9 gives 129456', async () => {
    const v = await mountOtp('123456');
    v.type(await v.click(2), '9');
    await waitFor(() => expect(v.exposed.value).toBe('129456'));
  });

  it('a letter typed into a numeric box leaves the code as it was', async () => {
    const v = await mountOtp('123456');
    v.type(await v.click(3), 'a');
    await frame();
    expect(
      v
        .boxes()
        .map((b) => b.value)
        .join('')
    ).toBe('123456');
    expect(v.exposed.value ?? '123456').toBe('123456');
  });

  it('emptying box 3 of a full code and filling it again changes only box 3', async () => {
    const v = await mountOtp('123456');
    v.erase(await v.click(2));
    await frame();
    expect(v.shown()).toBe('12_456');
    v.type(await v.click(2), '7');
    await waitFor(() => expect(v.shown()).toBe('127456'));
    expect(v.exposed.value).toBe('127456');
  });

  it('a value set from outside still fills the boxes after typing', async () => {
    const v = await mountOtp('123456');
    v.erase(await v.click(2));
    await frame();
    v.run('setFieldValue', '654321');
    await waitFor(() => expect(v.shown()).toBe('654321'));
  });
});
