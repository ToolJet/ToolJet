import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA item 49: an Ant Input's Container background showed only on the Outlined variant. Filled kept Ant's grey fill and
// Borderless stayed transparent, so the style did nothing there. Set, it now fills the field on every variant (and on
// every Ant field with a Variant); left unset, each variant keeps Ant's own look. The real components, inline SDK and
// host; only module and CSS loading is replaced. jsdom has no layout, so the oracle is what Ant's stylesheet and the
// pack's compute for the rendered markup (copied out of the shadow root).
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const ANT_SRC = path.resolve(__dirname, '../../../../../../packs/antd/src');
const ANT = require('../../../../../../packs/antd/src/index.ts');
// jsdom's CSS parser rejects a whole stylesheet with an @container rule in it, so those blocks (none about fields) go.
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
// Only the field rules of Ant's 900KB stylesheet, which jsdom would take seconds to parse in full.
const fieldRules = (text) =>
  (text.match(/[^{}]*\{[^{}]*\}/g) ?? []).filter((rule) => /ant-(input|select|picker)/.test(rule)).join('\n');
const CSS_TEXT = [
  fieldRules(fs.readFileSync(path.join(ANT_SRC, 'styles/antd.css'), 'utf8')),
  withoutContainerQueries(fs.readFileSync(path.join(ANT_SRC, 'styles/pack.css'), 'utf8')),
].join('\n');

afterEach(cleanup);

let serial = 0;
async function mount(name, props, styles, { disabled = false } = {}) {
  loadLibraryModule.mockResolvedValue({ [name]: ANT[name] });
  const cy = `ant-bg-${++serial}`;
  const view = render(
    <InlineLibraryComponent
      bundleUrl={`ant-bg-${serial}.js`}
      cssUrl={`ant-bg-${serial}.css`}
      cacheKey={`ant-bg-${serial}`}
      componentName={name}
      componentProps={props}
      componentStyles={styles}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      actions={new Map()}
      host={{ ...makeHost(name, {}), disabled }}
      dataCy={cy}
      fireEvent={() => {}}
    />
  );
  const root = () => view.container.querySelector(`[data-cy="${cy}"]`)?.shadowRoot?.querySelector('.tj-ant-root');
  await waitFor(() => expect(root()?.querySelector('input, textarea')).toBeTruthy());
  const holder = document.createElement('div');
  const style = document.createElement('style');
  // jsdom drops a colour written as var(), so the set colour stands in for its variable, as the browser resolves it.
  const own = root().style.getPropertyValue('--tj-ant-color-bg-container').trim();
  style.textContent = own ? CSS_TEXT.replaceAll('var(--tj-ant-color-bg-container)', own) : CSS_TEXT;
  holder.appendChild(style);
  holder.insertAdjacentHTML('beforeend', root().outerHTML);
  document.body.appendChild(holder);
  copies.push(holder);
  return holder;
}
const copies = [];
afterEach(() => copies.splice(0).forEach((holder) => holder.remove()));

const OWN = '#ffeeaa';
const SET = 'rgb(255, 238, 170)';
const backgroundOf = (field) => getComputedStyle(field).backgroundColor;

describe.each([
  ['Input', '.ant-input-filled, .ant-input-borderless'],
  ['TextArea', 'textarea'],
  ['InputNumber', '.ant-input-number-filled, .ant-input-number-borderless'],
  ['DatePicker', '.ant-picker-filled, .ant-picker-borderless'],
  ['Select', '.ant-select-selector'],
])('Ant %s Container background', (name, fieldSelector) => {
  test.each(['filled', 'borderless'])('fills the %s variant once set', async (variant) => {
    // Break this catches: the set colour drawn on Outlined only, Filled keeping Ant's grey and Borderless transparent.
    const holder = await mount(name, { variant }, { colorBgContainer: OWN });

    expect(holder.querySelector('.tj-ant-root').style.getPropertyValue('--tj-ant-color-bg-container')).toBe(OWN);
    expect(backgroundOf(holder.querySelector(fieldSelector))).toBe(SET);
  });

  test.each(['filled', 'borderless'])('keeps Ant’s own %s look while unset', async (variant) => {
    // Break this catches: a fix that repaints every Filled or Borderless field, set or not.
    const holder = await mount(name, { variant }, {});

    expect(backgroundOf(holder.querySelector(fieldSelector))).not.toBe(SET);
  });
});

describe('a disabled Ant Input with Container background set', () => {
  test('keeps Ant’s disabled colour', async () => {
    // Break this catches: the set colour painted over the disabled field, so it no longer looks disabled.
    const holder = await mount('Input', { variant: 'filled' }, { colorBgContainer: OWN }, { disabled: true });
    const field = holder.querySelector('.ant-input-filled');

    expect(field.className).toMatch(/disabled/);
    expect(backgroundOf(field)).not.toBe(SET);
  });
});
