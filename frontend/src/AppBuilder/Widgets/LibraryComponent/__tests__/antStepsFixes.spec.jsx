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

const TEN = Array.from({ length: 10 }, (_, i) => ({ title: `Step ${i + 1}`, description: 'Details' }));

let serial = 0;
const mount = async (props, styles = {}, { fit = false } = {}) => {
  loadLibraryModule.mockResolvedValue(pack);
  const cy = `ant-steps-${++serial}`;
  const view = render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-steps-fixes"
      componentName="Steps"
      componentProps={props}
      componentStyles={styles}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost('Steps')}
      dataCy={cy}
      fit={fit}
    />
  );
  const shadow = () => view.container.querySelector(`[data-cy="${cy}"]`)?.shadowRoot;
  await waitFor(() => expect(shadow()?.querySelector('.ant-steps-item')).toBeTruthy());
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
const ruleOf = (selector) => {
  const at = PACK_CSS.indexOf(`${selector} {`);
  return at === -1 ? '' : PACK_CSS.slice(at, PACK_CSS.indexOf('}', at));
};

// QA PKB-76: ten vertical steps in a 200px box ran 662px past it and the host cut them off. With Dynamic height off the
// steps now scroll inside the box; with it on, the box grows with them.
describe('PKB-76: Steps past a fixed box', () => {
  test('Dynamic height off: fills the box and scrolls', async () => {
    const root = rootUnderPackCss(await mount({ items: TEN, direction: 'vertical' }));
    expect(root.height).toBe('100%');
    expect(root.overflow === 'auto' || root.overflowY === 'auto').toBe(true);
  });
  test('Dynamic height on: no scroll', async () => {
    const root = rootUnderPackCss(await mount({ items: TEN, direction: 'vertical' }, {}, { fit: true }));
    expect(root.overflow === 'auto' || root.overflowY === 'auto').toBe(false);
  });
});

// QA PKB-41: Steps has no box of its own, so Container background, Border color and Border radius changed nothing. It now
// has the charts' box, transparent until the styles are set.
test('PKB-41: Container background, Border color and Border radius style the Steps box', async () => {
  const shadow = await mount({ items: TEN }, { colorBgContainer: '#ffeeaa', colorBorder: '#0000ff', borderRadius: 20 });
  // jsdom drops a var() value: the box rule applies to the root, it reads each style's variable, and the styles set them.
  const root = rootUnderPackCss(shadow);
  expect(root.borderStyle).toBe('solid');
  const rule = ruleOf('.tj-ant-chart-box');
  expect(rule).toMatch(/background-color: var\(--tj-ant-color-bg-container/);
  expect(rule).toMatch(/border-color: var\(--tj-ant-color-border-secondary/);
  expect(rule).toMatch(/border-radius: var\(--tj-ant-border-radius/);
  const vars = shadow().querySelector('.tj-ant-root').getAttribute('style');
  expect(vars).toMatch(/--tj-ant-color-bg-container: ?#ffeeaa/);
  expect(vars).toMatch(/--tj-ant-color-border-secondary: ?#0000ff/);
  expect(vars).toMatch(/--tj-ant-border-radius: ?20px/);
});

// QA PF-007: a clickable step took focus but showed no ring on the step (Ant rings its icon only, in a pale tint).
test('PF-007: a focused clickable step is ringed as a whole', async () => {
  const shadow = await mount({ items: TEN, clickable: true });
  const step = shadow().querySelector('.ant-steps-item-container');
  expect(step.getAttribute('tabindex')).toBe('0');
  expect(shadow().querySelector('.tj-ant-root').classList.contains('tj-ant-steps')).toBe(true);
  // jsdom has no :focus-visible, so the oracle is the rule that rings it.
  const rule = ruleOf('.tj-ant-steps .ant-steps-item-container:focus-visible');
  expect(rule).toMatch(/outline: var\(--ant-line-width-focus\) solid/);
});
