import React from 'react';
import { render, waitFor } from '@testing-library/react';
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

afterEach(() => {
  document.body.innerHTML = '';
});

const mountQr = async (props = {}) => {
  loadLibraryModule.mockResolvedValue(pack);
  render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-qr-colors"
      componentName="QRCode"
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost('QRCode')}
      dataCy="ant-qr"
    />
  );
  const root = () => document.querySelector('[data-cy="ant-qr"]').shadowRoot;
  await waitFor(() => expect(root().querySelector('.ant-qrcode svg')).toBeTruthy());
  const qr = root().querySelector('.ant-qrcode');
  const paths = [...qr.querySelectorAll('svg path')];
  return { qr, bg: paths[0].getAttribute('fill'), modules: paths[paths.length - 1].getAttribute('fill') };
};

// Ant fixes the modules' fill from its JS token (light mode's black), which the pack's CSS-only dark mode and theme
// colours never reach (AD-25): the modules follow --ant-color-text and the box --ant-color-bg-container instead.
describe('Ant QR Code colours', () => {
  // The box's var() colours are checked in a real browser: jsdom's CSS parser drops var() values.
  it('draws the modules in the CSS colour, not the light-mode token', async () => {
    const { modules } = await mountQr();
    expect(modules).toBe('currentColor');
  });

  it("with only a Background set, keeps Ant's dark modules (light ones would vanish on a white Background)", async () => {
    const { bg, modules } = await mountQr({ bgColor: '#ffffff' });
    expect(bg).toBe('#ffffff');
    expect(modules).not.toBe('currentColor');
  });

  it('keeps a Color and Background the user set', async () => {
    const { qr, bg, modules } = await mountQr({ color: '#ff0000', bgColor: '#ffffff' });
    expect(modules).toBe('#ff0000');
    expect(bg).toBe('#ffffff');
    expect(qr.style.backgroundColor).toBe('rgb(255, 255, 255)');
  });
});
