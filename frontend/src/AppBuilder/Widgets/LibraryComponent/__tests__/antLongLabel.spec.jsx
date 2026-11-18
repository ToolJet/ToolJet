import { act, fireEvent, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

// QA (PF-089): a very long label on an Ant Design field (Color Picker and the other Ant fields) was cut off mid-text with
// no ellipsis, and could not be read anywhere; the native label stays on one line, ends in an ellipsis and shows the
// whole text on hover. jsdom does not lay text out, so the rules that keep the label to one line with an ellipsis are
// checked, and the label's text is given a width it overflows to see Ant's tooltip show the whole text on hover.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const css = fs.readFileSync(path.resolve(__dirname, '../../../../../../packs/antd/src/styles/pack.css'), 'utf8');
// The declarations of a rule, by its exact selector.
const rule = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = css.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]*)\\}`));
  return (match?.[1] ?? '').replace(/\s+/g, ' ');
};
const LABEL = Array.from({ length: 80 }, () => 'word').join(' ');

// Every text tooltip Ant has drawn, wherever it portals.
const tooltips = () =>
  [document, ...[...document.querySelectorAll('*')].map((el) => el.shadowRoot).filter(Boolean)]
    .flatMap((root) => [...root.querySelectorAll('.ant-tooltip-inner')])
    .map((el) => el.textContent);
const hoverLabel = async (label, overflows) => {
  const v = await mountPack('antd', 'ColorPicker', { label });
  const text = v.root().querySelector('.tj-ant-label-text');
  Object.defineProperty(text, 'clientWidth', { configurable: true, get: () => 100 });
  Object.defineProperty(text, 'scrollWidth', { configurable: true, get: () => (overflows ? 900 : 100) });
  await act(async () => fireEvent.mouseEnter(text));
  return { v, text };
};

describe('Ant fields: a long label stays on one line and can be read on hover', () => {
  test('[PackComponent-ANTLABEL-001] the label text is one line that ends in an ellipsis', () => {
    const label = rule('.tj-ant-root .ant-form-item-label > label > .tj-ant-label-text');
    expect(label).toMatch(/display: block/);
    expect(label).toMatch(/white-space: nowrap/);
    expect(label).toMatch(/overflow: hidden/);
    expect(label).toMatch(/text-overflow: ellipsis/);
  });

  test("[PackComponent-ANTLABEL-002] a cut label shows its whole text in Ant's tooltip, not a browser title", async () => {
    const { v } = await hoverLabel(LABEL, true);
    await waitFor(() => expect(tooltips()).toContain(LABEL));
    expect(v.root().querySelector('.ant-form-item-label > label').getAttribute('title') ?? '').toBe('');
  });

  test('[PackComponent-ANTLABEL-003] control: a label that fits shows no tooltip', async () => {
    await hoverLabel('Colour', false);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(tooltips()).not.toContain('Colour');
  });
});
