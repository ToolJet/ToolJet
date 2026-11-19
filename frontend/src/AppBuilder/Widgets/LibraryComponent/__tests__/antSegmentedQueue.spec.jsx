import fs from 'fs';
import path from 'path';
import { fireEvent } from '@testing-library/react';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

installBrowserStubs();

// Ant Design Segmented QA queue (fix/ant-design-bugs-1.0). The pack's Segmented, the inline SDK and the host renderer
// are the real ones; only module and CSS loading is replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

afterEach(() => {
  document.body.innerHTML = '';
});

const PACK_SRC = path.resolve(__dirname, '../../../../../../packs/antd/src');
const read = (file) => fs.readFileSync(path.join(PACK_SRC, file), 'utf8');
const cssRule = (css, selector) => {
  const at = css.indexOf(`${selector} {`);
  return at < 0 ? '' : css.slice(at, css.indexOf('}', at));
};

describe('Ant Design Segmented: a bound number', () => {
  // Break this catches: the number 2 with only a text '2' option stays exposed as a number, while a click on that same
  // option exposes the text '2'. The value takes the option's own value, as a click does.
  test('[PackComponent-ANTSEG-001] the number 2 with only a text 2 option exposes the option value, text 2', async () => {
    const v = await mountPack('antd', 'Segmented', { value: 2, options: [{ label: 'Two', value: '2' }] });
    await settle();

    expect(v.exposed.value).toBe('2');
    expect(v.events).toEqual([]);
  });

  // Characterization: number options keep the number.
  test('[PackComponent-ANTSEG-002] the number 2 with number options stays the number 2', async () => {
    const options = [
      { label: 'One', value: 1 },
      { label: 'Two', value: 2 },
    ];
    const v = await mountPack('antd', 'Segmented', { value: 2, options });
    await settle();

    expect(v.exposed.value).toBe(2);
  });
});

describe('Ant Design Segmented: Block', () => {
  // Break this catches: the loading wrapper around the control is inline-block, so it shrinks to the buttons and Block
  // cannot stretch them to the box width.
  test('[PackComponent-ANTSEG-003] with Block on, the control sits in a full-width wrapper', async () => {
    const v = await mountPack('antd', 'Segmented', { block: true });
    await settle();

    const seg = v.root().querySelector('.ant-segmented');
    expect(seg.classList.contains('ant-segmented-block')).toBe(true);
    expect(seg.closest('.tj-ant-spin-inline')).toBeNull();
    expect(seg.closest('.tj-ant-spin-block')).not.toBeNull();
  });
});

describe('Ant Design Segmented: arrow keys and a disabled option', () => {
  // Break this catches: the arrow key moves onto the disabled option B and fires On change with it (the browser then
  // moves on to C and fires again). A disabled option is never picked.
  test('[PackComponent-ANTSEG-004] an arrow key onto a disabled option picks nothing', async () => {
    const options = [
      { label: 'A', value: 'a' },
      { label: 'B', value: 'b', disabled: true },
      { label: 'C', value: 'c' },
    ];
    const v = await mountPack('antd', 'Segmented', { value: 'a', options });
    await settle();
    const before = v.events.length;

    fireEvent.keyDown(v.root().querySelector('.ant-segmented-item-selected input'), { key: 'ArrowRight' });
    await settle();

    expect(v.exposed.value).toBe('a');
    expect(v.events.slice(before)).toEqual([]);
  });
});

describe('Ant Design Segmented: the Value help text', () => {
  // Break this catches: the Inspector says an empty Value selects the first option, but nothing is selected (on
  // purpose: a required Segmented must not look filled).
  test('[PackComponent-ANTSEG-005] the help text says an empty Value selects nothing', () => {
    const src = read('components/Choice.tsx');
    const segmented = src.slice(src.indexOf('export const Segmented'), src.indexOf('export const Rate'));

    expect(segmented).toMatch(/description: 'Empty selects nothing\.'/);
    expect(segmented).not.toMatch(/empty: the first/);
  });
});

describe('Ant Design Segmented: Primary color and Border color', () => {
  // jsdom lays nothing out, so this reads the pack's rules. Break this catches: Primary color and Border color change
  // nothing on a Segmented. Each rule reads only the variable the style sets, so a Segmented without them is unchanged.
  test('[PackComponent-ANTSEG-006] Primary color colours the picked option and Border color draws a border', () => {
    const css = read('styles/pack.css');
    const picked = cssRule(css, '.tj-ant-root .ant-segmented .ant-segmented-item-selected');
    const track = cssRule(css, '.tj-ant-root .ant-segmented');

    expect(picked).toMatch(/color:\s*var\(--tj-ant-color-primary,/);
    expect(track).toMatch(/var\(--tj-ant-color-border,\s*transparent\)/);
  });
});
