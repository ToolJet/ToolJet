import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
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

// The Ant Phone Input only ever selects a country Only countries allows (AD-24), as Rocket 2.0's does.
const mountPhone = async (props) => {
  loadLibraryModule.mockResolvedValue(pack);
  const exposed = {};
  const actions = new Map();
  const element = (p) => (
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-phone-countries"
      componentName="PhoneInput"
      componentProps={p}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={() => {}}
      actions={actions}
      host={makeHost('PhoneInput', { validation: 'text' })}
      dataCy="ant-phone"
    />
  );
  const rendered = render(element(props));
  await waitFor(() => expect(actions.get('setCountryCode')).toBeTruthy());
  return {
    exposed,
    run: (name, ...args) => act(() => actions.get(name)(...args)),
    setProps: (next) => act(() => rendered.rerender(element({ ...props, ...next }))),
  };
};

describe('Ant Phone Input: Only countries', () => {
  it('starts on the first allowed country when Default country is not allowed', async () => {
    const v = await mountPhone({ defaultCountry: 'US', onlyCountries: ['GB', 'IN'] });
    await waitFor(() => expect(v.exposed.country).toBe('GB'));
  });

  it('keeps an allowed Default country', async () => {
    const v = await mountPhone({ defaultCountry: 'IN', onlyCountries: ['GB', 'IN'] });
    await waitFor(() => expect(v.exposed.country).toBe('IN'));
  });

  it('setCountryCode ignores a country that is not allowed', async () => {
    const v = await mountPhone({ defaultCountry: 'GB', onlyCountries: ['GB', 'IN'] });
    await waitFor(() => expect(v.exposed.country).toBe('GB'));
    v.run('setCountryCode', 'US');
    v.run('setCountryCode', 'IN');
    await waitFor(() => expect(v.exposed.country).toBe('IN'));
    v.run('setCountryCode', 'US');
    await new Promise((r) => setTimeout(r, 30));
    expect(v.exposed.country).toBe('IN');
  });

  it('moves off a country that Only countries stops allowing', async () => {
    const v = await mountPhone({ defaultCountry: 'US', onlyCountries: [] });
    await waitFor(() => expect(v.exposed.country).toBe('US'));
    v.setProps({ onlyCountries: ['GB', 'IN'] });
    await waitFor(() => expect(v.exposed.country).toBe('GB'));
  });
});
