import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { makeHost } from './fuzz/packTestEnv';

// Mounts one real pack component through the real inline SDK and host renderer. The spec that uses it must mock
// inlineRuntime's loadLibraryModule and loadLibraryCss (jest.mock is hoisted per spec file):
//
//   jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
//     ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
//     loadLibraryModule: jest.fn(),
//     loadLibraryCss: jest.fn(() => Promise.resolve(null)),
//   }));
export const SOURCE = {
  shadcn: require('../../../../../../packs/shadcn/src/index.ts'),
  antd: require('../../../../../../packs/antd/src/index.ts'),
  mui: require('../../../../../../packs/mui/src/index.ts'),
};

let mounts = 0;
export const mountPack = async (pack, name, props = {}, { host = {}, styles = {}, actions } = {}) => {
  loadLibraryModule.mockResolvedValue({ [name]: SOURCE[pack][name] });
  mounts += 1;
  const id = mounts;
  const exposed = {};
  const events = [];
  const actionMap = actions ?? new Map();
  let state = { props, styles, host: { ...makeHost(name, {}), ...host } };
  const element = () => (
    <InlineLibraryComponent
      bundleUrl={`m-${id}.js`}
      cssUrl={`m-${id}.css`}
      cacheKey={`pack-mount-${pack}-${name}-${id}`}
      componentName={name}
      componentProps={state.props}
      componentStyles={state.styles}
      renderSlot={() => null}
      setExposedVariable={(key, value) => {
        exposed[key] = value;
      }}
      fireEvent={(event) => events.push(event)}
      actions={actionMap}
      host={state.host}
      dataCy={`pm-${id}`}
    />
  );
  let view;
  await act(async () => {
    view = render(element());
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
  const root = () => view.container.querySelector(`[data-cy="pm-${id}"]`).shadowRoot;
  await waitFor(() => expect(root().querySelector('.tj-cc-root').childElementCount).toBeGreaterThan(0));
  const update = async (next) => {
    state = { ...state, ...next };
    await act(async () => {
      view.rerender(element());
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  };
  // Runs a component action (setValue, selectItem, ...) the way the host does.
  const run = async (action, ...args) => {
    const handler = actionMap.get(action);
    if (!handler) throw new Error(`${name} has no action ${action}; it has ${[...actionMap.keys()].join(', ')}`);
    await act(async () => {
      await handler(...args);
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  };
  return { root, exposed, events, update, run, actions: actionMap, unmount: () => view.unmount(), view };
};

export const settle = (ms = 30) => act(() => new Promise((resolve) => setTimeout(resolve, ms)));
