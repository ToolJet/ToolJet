import { waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack } from './packMount';

installBrowserStubs();

jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const PACK_CSS = fs.readFileSync(path.resolve(__dirname, '../../../../../../packs/antd/src/styles/pack.css'), 'utf8');
const ruleOf = (selector) => {
  const at = PACK_CSS.indexOf(`${selector} {`);
  return at === -1 ? '' : PACK_CSS.slice(at, PACK_CSS.indexOf('}', at));
};
const rootOf = (v) => v.root().querySelector('.tj-ant-root');

// QA PKB-41: Progress has no box of its own, so Container background, Border color and Border radius changed nothing. It
// now has the charts' box (.tj-ant-chart-box), transparent until the styles are set.
describe('PKB-41: Progress box', () => {
  test.each(['line', 'circle', 'dashboard'])('%s: the styles reach its box', async (type) => {
    const v = await mountPack(
      'antd',
      'Progress',
      { type },
      { styles: { colorBgContainer: '#ffeeaa', colorBorder: '#0000ff', borderRadius: 0 } }
    );
    await waitFor(() => expect(v.root().querySelector('.ant-progress')).toBeTruthy());
    expect(rootOf(v).classList.contains('tj-ant-chart-box')).toBe(true);
    const vars = rootOf(v).getAttribute('style');
    expect(vars).toMatch(/--tj-ant-color-bg-container: ?#ffeeaa/);
    expect(vars).toMatch(/--tj-ant-color-border-secondary: ?#0000ff/);
    expect(vars).toMatch(/--tj-ant-border-radius: ?0px/);
  });
});

// QA PF-213: Steps 1e9 reached Ant, which threw "Invalid array length" building that many segments, and the widget
// showed its error. Steps now keeps to its declared 1 to 50.
describe('PF-213: a huge Steps', () => {
  test.each([1e9, 1e21])('%s draws 50 segments', async (steps) => {
    const v = await mountPack('antd', 'Progress', { steps });
    await waitFor(() => expect(v.root().querySelector('.ant-progress')).toBeTruthy());
    expect(v.root().querySelector('.tj-cc-error')).toBeNull();
    expect(v.root().querySelectorAll('.ant-progress-steps-item')).toHaveLength(50);
  });

  test('a fraction takes its whole steps; 0 is a continuous bar', async () => {
    const five = await mountPack('antd', 'Progress', { steps: 5.7 });
    await waitFor(() => expect(five.root().querySelectorAll('.ant-progress-steps-item')).toHaveLength(5));
    const bar = await mountPack('antd', 'Progress', { steps: 0 });
    await waitFor(() => expect(bar.root().querySelector('.ant-progress-line')).toBeTruthy());
    expect(bar.root().querySelectorAll('.ant-progress-steps-item')).toHaveLength(0);
  });
});

// QA PF-214: a long Title in a short box ran past its bottom with no scroll. The title and bar are centred and scroll
// in the Spin wrapper that fills the box (centred on the root, the bar sat at the top), starting at the top when taller
// (jsdom has no layout: the oracle is the rule, checked in Chrome: 49px above and below a bar in a 120px box).
test('PF-214: the bar is centred in its box, and a title taller than the box scrolls inside it', async () => {
  const v = await mountPack('antd', 'Progress', { title: 'Uploading files' });
  await waitFor(() => expect(v.root().querySelector('.ant-progress')).toBeTruthy());
  const container = v.root().querySelector('.tj-ant-progress-line > .tj-ant-spin-fill > .ant-spin-container');
  expect(container.querySelector('.tj-ant-progress-title')).toBeTruthy();
  const rule = ruleOf('.tj-ant-progress-line > .tj-ant-spin-fill > .ant-spin-container');
  expect(rule).toMatch(/flex-direction: column/);
  expect(rule).toMatch(/justify-content: safe center/);
  expect(rule).toMatch(/overflow: auto/);
});

// Stroke color is gone: the Primary color style colours the bar, ring and steps (Ant's default progress colour is the
// info colour, which Primary color sets).
describe('Progress colour', () => {
  test('no Stroke color property', async () => {
    const { toolJetSdk } = jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime');
    const strings = jest.spyOn(toolJetSdk, 'useStateString');
    try {
      await mountPack('antd', 'Progress', {});
      expect(strings.mock.calls.map(([o]) => o.name)).not.toContain('strokeColor');
    } finally {
      strings.mockRestore();
    }
  });

  test('Primary color sets the colour the bar, ring and steps draw in', async () => {
    const v = await mountPack('antd', 'Progress', {}, { styles: { colorPrimary: '#ff0000' } });
    await waitFor(() => expect(v.root().querySelector('.ant-progress')).toBeTruthy());
    expect(rootOf(v).getAttribute('style')).toMatch(/--tj-ant-color-info: ?#ff0000/);
    const antd = fs.readFileSync(path.resolve(__dirname, '../../../../../../packs/antd/src/styles/antd.css'), 'utf8');
    expect(antd).toMatch(/--ant-progress-default-color:var\(--ant-color-info\)/);
    expect(antd).toMatch(/--ant-color-info: var\(--tj-ant-color-info,/);
  });

  test('a saved Stroke color is ignored, and the bar keeps the Primary color', async () => {
    const v = await mountPack('antd', 'Progress', { strokeColor: '#00ff00' });
    await waitFor(() => expect(v.root().querySelector('.ant-progress-bg')).toBeTruthy());
    expect(v.root().querySelector('.ant-progress-bg').getAttribute('style') ?? '').not.toMatch(/00ff00|0, 255, 0/i);
  });
});
