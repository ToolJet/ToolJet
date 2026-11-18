import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
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
// jsdom's CSS parser rejects a whole stylesheet with an @container rule in it, so those blocks go.
const withoutContainerQueries = (text) => {
  let out = '';
  let i = 0;
  for (let at = text.indexOf('@container', i); at !== -1; at = text.indexOf('@container', i)) {
    out += text.slice(i, at);
    let depth = 0;
    let j = text.indexOf('{', at);
    for (; j < text.length; j += 1) {
      if (text[j] === '{') depth += 1;
      else if (text[j] === '}' && --depth === 0) break;
    }
    i = j + 1;
  }
  return out + text.slice(i);
};
const PACK_CSS = withoutContainerQueries(
  fs.readFileSync(path.resolve(__dirname, '../../../../../../packs/antd/src/styles/pack.css'), 'utf8')
);

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
});

const TWELVE = Array.from({ length: 12 }, (_, i) => ({ label: `Option ${i + 1}`, value: `o${i + 1}` }));

let serial = 0;
const mount = async (props, { fit = false } = {}) => {
  loadLibraryModule.mockResolvedValue(pack);
  const cy = `ant-radio-${++serial}`;
  const view = render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-radio-fixes"
      componentName="RadioGroup"
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost('RadioGroup')}
      dataCy={cy}
      fit={fit}
    />
  );
  const shadow = () => view.container.querySelector(`[data-cy="${cy}"]`)?.shadowRoot;
  await waitFor(() =>
    expect(shadow()?.querySelectorAll('.ant-radio-wrapper, .ant-radio-button-wrapper')).toHaveLength(12)
  );
  return shadow;
};

// The rendered markup under the pack's stylesheet (copied out of the shadow root: jsdom has no cascade into it).
const rootUnderPackCss = (shadow) => {
  const holder = document.createElement('div');
  const style = document.createElement('style');
  style.textContent = PACK_CSS;
  holder.appendChild(style);
  holder.insertAdjacentHTML('beforeend', shadow().querySelector('.tj-cc-root').outerHTML);
  document.body.appendChild(holder);
  return getComputedStyle(holder.querySelector('.tj-ant-root'));
};

// QA PKB-76: twelve options in an 80px or 160px box ran past it, and the host cut them off: the last ones could not be
// reached. With Dynamic height off the field now fills its box and scrolls, as the ToolJet Radio does; with it on, the
// box grows with the options as before.
describe('PKB-76: Radio Group options past a fixed box', () => {
  test.each([
    ['a row', { options: TWELVE }],
    ['vertical', { options: TWELVE, vertical: true }],
    ['buttons', { options: TWELVE, optionType: 'button' }],
  ])('%s: the field fills the box and scrolls (Dynamic height off)', async (_, props) => {
    const root = rootUnderPackCss(await mount(props));
    expect(root.height).toBe('100%');
    expect(root.overflow === 'auto' || root.overflowY === 'auto').toBe(true);
  });

  test('Dynamic height on: no scroll, the box grows with the options', async () => {
    const root = rootUnderPackCss(await mount({ options: TWELVE }, { fit: true }));
    expect(root.overflow === 'auto' || root.overflowY === 'auto').toBe(false);
  });
});

// QA PF-273: Border radius rounds Ant's button options only; a default radio is a circle and the group has no box, so
// it did nothing. The style now shows only while Option type is Button.
describe('PF-273: Border radius shows only for the button type', () => {
  test('RadioGroup declares Border radius with visibleWhen optionType button', async () => {
    const { toolJetSdk } = jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime');
    const spy = jest.spyOn(toolJetSdk, 'useStyleNumber');
    try {
      await mount({ options: TWELVE });
      const radius = spy.mock.calls.map(([o]) => o).find((o) => o.name === 'borderRadius');
      expect(radius.visibleWhen).toEqual({ key: 'optionType', value: 'button' });
    } finally {
      spy.mockRestore();
    }
  });
});

// A label with a word longer than the box (no spaces) made its option wider than the box: the text ran out to the box's
// edge and was cut there, and the group scrolled sideways. An option is now at most the box's width and the word breaks.
test('a label wider than the box wraps inside it', async () => {
  const long = 'asdkbasndjkasdknasndjkaasd;mal;msdsndjnasjndasndnaksdjkasasdmansdkansdnasndkjansjdnasnkjdjkasd';
  const shadow = await mount({ options: [{ label: long, value: 'a' }, ...TWELVE.slice(1)] });
  rootUnderPackCss(shadow);
  const copy = document.body.querySelector('.tj-ant-root');
  expect(getComputedStyle(copy.querySelector('.ant-radio-wrapper')).maxWidth).toBe('100%');
  const label = getComputedStyle(copy.querySelector('.ant-radio-label'));
  expect(label.overflowWrap).toBe('anywhere');
  expect(['0', '0px']).toContain(label.minWidth);
});
