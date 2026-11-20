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

let mounts = 0;
const mount = async (name, props) => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const exposed = {};
  render(
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-unknown-enum"
      componentName={name}
      componentProps={props}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost(name)}
      dataCy={`ant-enum-${mounts}`}
    />
  );
  const root = () => document.querySelector(`[data-cy="ant-enum-${mounts}"]`).shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-ant-root, .tj-cc-error')).toBeTruthy());
  return { root, exposed };
};

// A value an enumeration does not list (a typo, a query's 'failed', a binding still empty) falls back to its default
// instead of reaching antd, which looked it up in a table and crashed the widget (AD-28).
describe('Ant enumerations given a value they do not list', () => {
  it.each([
    ['Result', { status: 'failed' }, '.ant-result-info'],
    ['Result', { status: '' }, '.ant-result-info'],
    ['Alert', { type: 'danger' }, '.ant-alert-info'],
    ['QRCode', { errorLevel: 'Z' }, '.ant-qrcode svg'],
  ])('%s %j draws its default', async (name, props, drawn) => {
    const v = await mount(name, props);
    await waitFor(() => expect(v.root().querySelector(drawn)).toBeTruthy());
    expect(v.root().querySelector('.tj-cc-error')).toBeNull();
  });

  it('a number a query returns matches the listed text', async () => {
    const v = await mount('Result', { status: 404 });
    await waitFor(() => expect(v.root().querySelector('.ant-result-404')).toBeTruthy());
  });

  it('a listed value still applies, and the exposed value is what the app set', async () => {
    const v = await mount('Result', { status: 'error' });
    await waitFor(() => expect(v.root().querySelector('.ant-result-error')).toBeTruthy());
    const w = await mount('Result', { status: 'failed' });
    await waitFor(() => expect(w.exposed.status).toBe('failed'));
  });
});
