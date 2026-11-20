import { fireEvent, waitFor } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { installBrowserStubs } from './fuzz/packTestEnv';
import { mountPack, settle } from './packMount';

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
const SRC = 'https://example.com/a.png';
// The picture's box: Ant puts a Tab stop's props on it (div.ant-image), whose click opens the preview.
const img = (v) => v.root().querySelector('.ant-image');

// QA PKB-41: Primary, Text and Container colour drew nothing on a picture, and Border color nothing either. The Image now
// declares only Border color and Border radius, and draws both on the image's box.
describe('Image styles', () => {
  test('only Border color and Border radius are declared', async () => {
    const { toolJetSdk } = jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime');
    const strings = jest.spyOn(toolJetSdk, 'useStyleString');
    const numbers = jest.spyOn(toolJetSdk, 'useStyleNumber');
    try {
      await mountPack('antd', 'Image', { src: SRC });
      const names = [...strings.mock.calls, ...numbers.mock.calls].map(([o]) => o.name);
      expect([...new Set(names)].sort()).toEqual(['borderRadius', 'colorBorder']);
    } finally {
      strings.mockRestore();
      numbers.mockRestore();
    }
  });

  test('Border color and Border radius reach the image box', async () => {
    const v = await mountPack('antd', 'Image', { src: SRC }, { styles: { colorBorder: '#0000ff', borderRadius: 20 } });
    const vars = v.root().querySelector('.tj-ant-root').getAttribute('style');
    expect(vars).toMatch(/--tj-image-border: ?1px solid #0000ff/);
    expect(vars).toMatch(/--tj-image-radius: ?20px/);
    const rule = ruleOf('.tj-ant-image .ant-image');
    expect(rule).toMatch(/border: var\(--tj-image-border, none\)/);
    expect(rule).toMatch(/border-radius: var\(--tj-image-radius/);
  });

  test('unset, no border and no radius of its own', async () => {
    const v = await mountPack('antd', 'Image', { src: SRC });
    const vars = v.root().querySelector('.tj-ant-root').getAttribute('style') ?? '';
    expect(vars).not.toMatch(/--tj-image-(border|radius)/);
  });
});

// QA PF-225: the image could not be reached with Tab, so its preview opened only with the mouse.
describe('Image keyboard', () => {
  test('with Preview on, the picture is a Tab stop and Enter opens the preview and fires On click', async () => {
    const v = await mountPack('antd', 'Image', { src: SRC, preview: true });
    await waitFor(() => expect(img(v)).toBeTruthy());
    expect(img(v).getAttribute('tabindex')).toBe('0');
    expect(img(v).getAttribute('role')).toBe('button');
    fireEvent.keyDown(img(v), { key: 'Enter' });
    await settle();
    expect(v.events).toContain('onClick');
    await waitFor(() =>
      expect(
        [...document.querySelectorAll('.tj-cc-popup-host')].some((h) =>
          h.shadowRoot.querySelector('.ant-image-preview')
        )
      ).toBe(true)
    );
  });

  test('Escape and arrows do not press it', async () => {
    const v = await mountPack('antd', 'Image', { src: SRC, preview: true });
    await waitFor(() => expect(img(v)).toBeTruthy());
    fireEvent.keyDown(img(v), { key: 'Escape' });
    fireEvent.keyDown(img(v), { key: 'ArrowDown' });
    await settle();
    expect(v.events).not.toContain('onClick');
  });

  test('with Preview off, no Tab stop', async () => {
    const v = await mountPack('antd', 'Image', { src: SRC, preview: false });
    await waitFor(() => expect(img(v)).toBeTruthy());
    expect(img(v).hasAttribute('tabindex')).toBe(false);
  });
});
