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

const mountOtp = async (props) => {
  loadLibraryModule.mockResolvedValue(pack);
  render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-otp-mask"
      componentName="OTP"
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost('OTP', { validation: 'text' })}
      dataCy="ant-otp"
    />
  );
  const root = () => document.querySelector('[data-cy="ant-otp"]').shadowRoot;
  await waitFor(() => expect(root().querySelectorAll('.ant-otp-input')).toHaveLength(3));
  return root;
};

// Ant 5.29's mask={true} drops the password type and prints each digit in its overlay; only a mask character hides them.
describe('Ant OTP mask', () => {
  it('hides every digit behind a mask character', async () => {
    const root = await mountOtp({ length: 3, value: '123', mask: true });
    await waitFor(() => expect(root().querySelectorAll('.ant-otp-mask-icon')).toHaveLength(3));
    const overlays = [...root().querySelectorAll('.ant-otp-mask-icon')].map((el) => el.textContent);
    expect(overlays).toEqual(['•', '•', '•']);
  });

  it('shows the digits when mask is off', async () => {
    const root = await mountOtp({ length: 3, value: '123', mask: false });
    expect(root().querySelectorAll('.ant-otp-mask-icon')).toHaveLength(0);
    expect([...root().querySelectorAll('.ant-otp-input')].map((el) => el.value)).toEqual(['1', '2', '3']);
  });
});
