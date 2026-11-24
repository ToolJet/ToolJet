import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
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

const layer = () => document.querySelector('.tj-cc-popup-host')?.shadowRoot;

afterEach(() => {
  document.body.innerHTML = '';
});

// The Ant Modal with the host's Loading on: antd's confirmLoading drops every cancel, so Loading may only spin OK.
const mountModal = async ({ open = true } = {}) => {
  loadLibraryModule.mockResolvedValue(pack);
  const exposed = {};
  const events = [];
  const actions = new Map();
  let host = makeHost('Modal');
  const element = () => (
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="ant-modal-loading"
      componentName="Modal"
      componentProps={{}}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push(event)}
      actions={actions}
      host={host}
      dataCy="ant-modal"
    />
  );
  const rendered = render(element());
  await waitFor(() => expect(actions.get('show')).toBeTruthy());
  if (open) {
    act(() => actions.get('show')());
    await waitFor(() => expect(layer()?.querySelector('.ant-modal')).toBeTruthy());
  }
  host = { ...host, loading: true };
  act(() => rendered.rerender(element()));
  const trigger = () => document.querySelector('[data-cy="ant-modal"]').shadowRoot.querySelector('.ant-btn');
  return { exposed, events, trigger };
};

describe('Ant Modal while loading', () => {
  it('the trigger spins and a click opens nothing', async () => {
    const v = await mountModal({ open: false });
    await waitFor(() => expect(v.trigger().className).toMatch(/ant-btn-loading/));
    fireEvent.click(v.trigger());
    await act(() => new Promise((r) => setTimeout(r, 50)));
    expect(v.exposed.open).not.toBe(true);
    expect(v.events).not.toContain('afterOpen');
  });

  it('spins OK and keeps it from firing onOk', async () => {
    const v = await mountModal();
    const ok = () => layer().querySelector('.ant-modal-footer .ant-btn-primary');
    await waitFor(() => expect(ok().className).toMatch(/ant-btn-loading/));
    fireEvent.click(ok());
    expect(v.events).not.toContain('onOk');
    expect(v.exposed.open).toBe(true);
  });

  it.each([
    ['Cancel', () => fireEvent.click(layer().querySelector('.ant-modal-footer .ant-btn:not(.ant-btn-primary)'))],
    ['the X', () => fireEvent.click(layer().querySelector('.ant-modal-close'))],
    ['a mask click', () => fireEvent.click(layer().querySelector('.ant-modal-wrap'))],
    ['Escape', () => fireEvent.keyDown(layer().querySelector('.ant-modal-wrap'), { key: 'Escape', keyCode: 27 })],
  ])('%s still closes it and fires onCancel', async (_, close) => {
    const v = await mountModal();
    await waitFor(() =>
      expect(layer().querySelector('.ant-modal-footer .ant-btn-primary').className).toMatch(/ant-btn-loading/)
    );
    close();
    await waitFor(() => expect(v.exposed.open).toBe(false));
    expect(v.events).toContain('onCancel');
  });
});
