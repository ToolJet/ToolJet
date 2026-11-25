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
const starsOf = async (props, styles) => {
  const v = await mountPack('antd', 'Rate', props, { styles });
  await waitFor(() => expect(v.root().querySelector('.ant-rate, .tj-cc-error')).toBeTruthy());
  return v;
};

// QA PKB-79: a Count of 3.5 reached rc-rate, which threw "Invalid array length", and the widget showed its error.
describe('PKB-79: a Count with decimals', () => {
  test.each([
    [3.5, 3],
    [7.9, 7],
  ])('%s draws %s stars', async (count, n) => {
    const v = await starsOf({ count });
    expect(v.root().querySelector('.tj-cc-error')).toBeNull();
    expect(v.root().querySelectorAll('.ant-rate-star')).toHaveLength(n);
  });
});

// QA PKB-41: Primary color, Border color and Border radius changed nothing. The box takes Container background, Border
// color and Border radius (.tj-ant-chart-box); the stars fill in the primary colour (the style, else the theme's).
describe('PKB-41: Rate styles', () => {
  test('the box takes Container background, Border color and Border radius', async () => {
    const v = await starsOf({}, { colorBgContainer: '#ffeeaa', colorBorder: '#0000ff', borderRadius: 20 });
    const root = v.root().querySelector('.tj-ant-root');
    expect(root.classList.contains('tj-ant-chart-box')).toBe(true);
    const vars = root.getAttribute('style');
    expect(vars).toMatch(/--tj-ant-color-bg-container: ?#ffeeaa/);
    expect(vars).toMatch(/--tj-ant-color-border-secondary: ?#0000ff/);
    expect(vars).toMatch(/--tj-ant-border-radius: ?20px/);
  });

  test('the stars fill in the primary colour: the Primary color style, else the theme brand, else Ant blue', async () => {
    const v = await starsOf({ value: 3 }, { colorPrimary: '#ff0000' });
    expect(v.root().querySelector('.tj-ant-rate .tj.ant-rate')).toBeTruthy();
    expect(v.root().querySelector('.tj-ant-root').getAttribute('style')).toMatch(/--tj-ant-color-primary: ?#ff0000/);
    expect(ruleOf('.tj-ant-rate .tj.ant-rate')).toMatch(/--ant-rate-star-color: var\(--ant-color-primary\)/);
    // --ant-color-primary is the style, else the applied theme, else Ant's blue (antd.css).
    const antd = fs.readFileSync(path.resolve(__dirname, '../../../../../../packs/antd/src/styles/antd.css'), 'utf8');
    expect(antd).toMatch(/--ant-color-primary: var\(--tj-ant-color-primary, var\(--tjt-color-primary, #1677ff\)\)/);
  });
});

// The Rate's box fills the widget (Dynamic height off) with the label and stars centred down it; the stars' row is
// their own height, so they sit in the middle (Ant's 32px field row and the gaps under inline boxes left 8px under them).
// jsdom has no layout: the oracle is the rules (checked in Chrome: 58px above and below in a 160px box).
test('Rate fills its box and centres the label and stars', async () => {
  const v = await starsOf({});
  expect(v.root().querySelector('.tj-ant-root').classList.contains('tj-ant-rate')).toBe(true);
  const box = ruleOf('.tj-cc-root:not(.tj-cc-fit) > .tj-ant-rate');
  expect(box).toMatch(/height: 100%/);
  expect(box).toMatch(/justify-content: safe center/);
  expect(box).toMatch(/overflow: auto/);
  expect(ruleOf('.tj-ant-rate .tj.ant-rate')).toMatch(/display: flex/);
  expect(ruleOf('.tj-ant-rate .ant-form-item-control-input')).toMatch(/min-height: 0/);
  expect(ruleOf('.tj-ant-rate .ant-form-item-control-input-content')).toMatch(/display: flex/);
});
