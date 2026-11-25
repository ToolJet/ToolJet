import React from 'react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// RadialChart and Sparkline are not drawn in the charts' Frame, so the chart fixes for the box styles and keyboard
// access missed them: Background, Border color and Border radius changed nothing (QA PKB-41), and neither was a Tab
// stop (QA PF-241). The real components, inline SDK and host; only module and CSS loading (and G2) are replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../../../../../../packs/antd/node_modules/@ant-design/plots', () => {
  const React = require('react');
  const fake = (name) => () => React.createElement('div', { 'data-fake-plot': name });
  return {
    __esModule: true,
    RadialBar: fake('RadialBar'),
    Tiny: { Line: fake('Tiny.Line'), Area: fake('Tiny.Area'), Column: fake('Tiny.Column') },
  };
});

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

let serial = 0;
const mount = async (name, props, styles = {}) => {
  loadLibraryModule.mockResolvedValue(pack);
  const cy = `ant-mini-${++serial}`;
  const events = [];
  const view = render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-mini-charts"
      componentName={name}
      componentProps={props}
      componentStyles={styles}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={(event) => events.push(event)}
      actions={new Map()}
      host={makeHost(name)}
      dataCy={cy}
    />
  );
  const shadow = () => view.container.querySelector(`[data-cy="${cy}"]`)?.shadowRoot;
  await waitFor(() => expect(shadow()?.querySelector('.tj-ant-mini-focus')).toBeTruthy());
  return { shadow, events, focus: () => shadow().querySelector('.tj-ant-mini-focus') };
};

// The rendered markup under the pack's stylesheet (jsdom has no shadow-root cascade for a copied sheet).
const underPackCss = (shadow) => {
  const holder = document.createElement('div');
  const style = document.createElement('style');
  style.textContent = PACK_CSS;
  holder.appendChild(style);
  holder.insertAdjacentHTML('beforeend', shadow().querySelector('.tj-cc-root').outerHTML);
  document.body.appendChild(holder);
  return holder.querySelector('.tj-ant-root');
};

const CASES = [
  ['RadialChart (progress)', 'RadialChart', { mode: 'progress', value: 40 }],
  ['RadialChart (categories)', 'RadialChart', { mode: 'categories' }],
  ['Sparkline', 'Sparkline', { data: [1, 3, 2] }],
];

describe('PKB-41: Background, Border color and Border radius style the box', () => {
  test.each(CASES)('%s', async (_, name, props) => {
    const v = await mount(name, props, { colorBgContainer: '#ffeeaa', colorBorder: '#0000ff', borderRadius: 10 });
    const box = getComputedStyle(underPackCss(v.shadow));
    // jsdom drops a var() value, so the oracle is in two parts: the box rule applies to the widget's root, and that
    // rule reads each style's variable (set on the same root by the styles).
    expect(box.boxSizing).toBe('border-box');
    expect(box.borderStyle).toBe('solid');
    const rule = /\.tj-ant-chart-box \{([^}]*)\}/.exec(PACK_CSS)[1];
    expect(rule).toMatch(/background-color: var\(--tj-ant-color-bg-container/);
    expect(rule).toMatch(/border-color: var\(--tj-ant-color-border-secondary/);
    expect(rule).toMatch(/border-radius: var\(--tj-ant-border-radius/);
    const vars = v.shadow().querySelector('.tj-ant-root').getAttribute('style');
    expect(vars).toMatch(/--tj-ant-color-bg-container: ?#ffeeaa/);
    expect(vars).toMatch(/--tj-ant-color-border-secondary: ?#0000ff/);
    expect(vars).toMatch(/--tj-ant-border-radius: ?10px/);
  });
});

describe('PF-241: a Tab stop with a role and a name', () => {
  test.each(CASES)('%s', async (_, name, props) => {
    const v = await mount(name, props);
    const el = v.focus();
    expect(el.tabIndex).toBe(0);
    expect(el.getAttribute('role')).toBeTruthy();
    expect(el.getAttribute('aria-label')).toBeTruthy();
  });

  test.each([
    ['RadialChart (progress)', 'RadialChart', { mode: 'progress', value: 40 }],
    ['Sparkline', 'Sparkline', { data: [1, 3, 2] }],
  ])('%s: Enter and Space fire On click, other keys do not', async (_, name, props) => {
    const v = await mount(name, props);
    fireEvent.keyDown(v.focus(), { key: 'Enter' });
    fireEvent.keyDown(v.focus(), { key: ' ' });
    fireEvent.keyDown(v.focus(), { key: 'Escape' });
    fireEvent.keyDown(v.focus(), { key: 'ArrowRight' });
    expect(v.events.filter((e) => e === 'onClick')).toHaveLength(2);
  });
});
