import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';

import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA AD-11: an Ant Design Currency Input applied Locale and Precision to formattedValue only: with de-DE and EUR the
// field showed 1,234.5 while formattedValue was 1.234,50 €, and with en-IN 1,234,567 while it was ₹12,34,567.00. The
// pack's Currency Input, the inline SDK and the host renderer are the real ones; only module and CSS loading is
// replaced.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const pack = require('../../../../../../packs/antd/src/index.ts');

let mounts = 0;
const mount = async (props) => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const exposed = {};
  const view = render(
    <InlineLibraryComponent
      bundleUrl="antd.js"
      cssUrl="antd.css"
      cacheKey="ant-currency-locale"
      componentName="CurrencyInput"
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost('CurrencyInput', {})}
      dataCy={`currency-${mounts}`}
    />
  );
  const input = () => view.container.querySelector(`[data-cy="currency-${mounts}"]`).shadowRoot.querySelector('input');
  await waitFor(() => expect(input()).toBeTruthy());
  await waitFor(() => expect(exposed.formattedValue).toBeTruthy());
  return { input, exposed };
};

describe('Ant Design Currency Input: the field in the locale and precision', () => {
  test('[PackComponent-CURLOCALE-001] de-DE, EUR, 1234.5: the field shows 1.234,50, as formattedValue does', async () => {
    const field = await mount({ locale: 'de-DE', currency: 'EUR', value: 1234.5 });

    expect(field.input().value).toBe('1.234,50');
    expect(field.exposed.formattedValue).toContain('1.234,50');
  });

  test('[PackComponent-CURLOCALE-002] en-IN, INR, 1234567: the field groups as the locale does (12,34,567.00)', async () => {
    const field = await mount({ locale: 'en-IN', currency: 'INR', value: 1234567 });

    expect(field.input().value).toBe('12,34,567.00');
  });

  test('[PackComponent-CURLOCALE-003] de-DE: typed 9876,5 is read in the locale, and shown in it once left', async () => {
    const field = await mount({ locale: 'de-DE', currency: 'EUR', value: 1234.5 });

    act(() => {
      fireEvent.focus(field.input());
      fireEvent.change(field.input(), { target: { value: '9876,5' } });
      fireEvent.blur(field.input());
    });

    expect(field.exposed.value).toBe(9876.5);
    expect(field.input().value).toBe('9.876,50');
  });

  // Characterization: rounding to Precision already held (QA's P22 and P26 parts of AD-11).
  test('[PackComponent-CURLOCALE-004] Precision 0 with 3.7: the field and the value are both 4', async () => {
    const field = await mount({ precision: 0, value: 3.7 });

    await waitFor(() => expect(field.exposed.value).toBe(4));
    expect(field.input().value).toBe('4');
  });
});
