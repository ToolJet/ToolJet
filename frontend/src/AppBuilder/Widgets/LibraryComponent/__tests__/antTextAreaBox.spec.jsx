import React from 'react';
import { cleanup, render, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA item 50: the Ant TextArea grew with its text (autoSize, up to Max rows, or without limit at Max rows 0) past its
// widget box, which cut it off: the field's bottom border and the lines being typed were hidden, and ten lines at load
// spilled 96px below a 160px box. Without Dynamic height the field now fills its box under the label and scrolls, as a
// ToolJet TextArea does; with Dynamic height the field keeps growing and the box grows with it. The real components,
// inline SDK and host; only module and CSS loading is replaced. jsdom has no layout, so the oracle is what the pack's
// stylesheet and the host's computes for the rendered markup (copied out of the shadow root).
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
const PACK_CSS = withoutContainerQueries(fs.readFileSync(path.join(ANT_SRC, 'styles/pack.css'), 'utf8'));

afterEach(cleanup);
const copies = [];
afterEach(() => copies.splice(0).forEach((holder) => holder.remove()));

let serial = 0;
async function mount(props, { fit = false } = {}) {
  loadLibraryModule.mockResolvedValue({ TextArea: ANT.TextArea });
  const cy = `ant-ta-${++serial}`;
  const view = render(
    <InlineLibraryComponent
      bundleUrl={`ant-ta-${serial}.js`}
      cssUrl={`ant-ta-${serial}.css`}
      cacheKey={`ant-ta-${serial}`}
      componentName="TextArea"
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      actions={new Map()}
      host={makeHost('TextArea', {})}
      dataCy={cy}
      fireEvent={() => {}}
      fit={fit}
    />
  );
  const shadow = () => view.container.querySelector(`[data-cy="${cy}"]`)?.shadowRoot;
  await waitFor(() => expect(shadow()?.querySelector('textarea')).toBeTruthy());
  const holder = document.createElement('div');
  const style = document.createElement('style');
  style.textContent = PACK_CSS;
  holder.appendChild(style);
  holder.insertAdjacentHTML('beforeend', shadow().querySelector('.tj-cc-root').outerHTML);
  document.body.appendChild(holder);
  copies.push(holder);
  return holder;
}

const TEN_LINES = Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`).join('\n');
const computed = (el) => getComputedStyle(el);
// What the stylesheets set for the field. Ant writes its autoSize height inline; a browser lets an !important rule
// beat it, jsdom does not, so the inline height is left out here (the browser check covers the rest).
const fieldStyle = (holder) => {
  const field = holder.querySelector('textarea');
  ['height', 'min-height', 'max-height', 'overflow-y'].forEach((name) => field.style.removeProperty(name));
  return computed(field);
};

describe('Ant TextArea in a fixed-height box (Dynamic height off)', () => {
  test.each([
    ['Max rows 8', { value: TEN_LINES }],
    ['Max rows 0 (no limit)', { value: TEN_LINES, maxRows: 0 }],
    ['Allow clear and Show count', { value: TEN_LINES, allowClear: true, showCount: true, maxLength: 500 }],
  ])('fills the box and scrolls its text: %s', async (_, props) => {
    // Break this catches: the field drawn at its text's height, past the box that then cuts it off.
    const holder = await mount(props);
    const field = fieldStyle(holder);

    expect(computed(holder.querySelector('.tj-ant-root')).height).toBe('100%');
    expect(field.height).toBe('100%');
    expect(field.overflowY).toBe('auto');
  });
});

describe('Ant TextArea with Dynamic height on', () => {
  test('keeps growing with its text, for the box to grow with it', async () => {
    // Break this catches: the field held to the box's height, so Dynamic height never sees it grow.
    const holder = await mount({ value: TEN_LINES }, { fit: true });

    expect(fieldStyle(holder).height).not.toBe('100%');
  });
});
