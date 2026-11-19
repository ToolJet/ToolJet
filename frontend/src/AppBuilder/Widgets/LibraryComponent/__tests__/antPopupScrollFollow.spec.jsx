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

// Ant's trigger realigns a popup on 'scroll' of the field's scroll parents, found by walking parentElement. The widget
// lives in a shadow root, so the walk never reaches the app canvas scroller: the pack forwards any scroll to its
// .tj-cc-root (which is in that list) as a synthetic scroll event.
let mounts = 0;
const mount = async () => {
  loadLibraryModule.mockResolvedValue(pack);
  mounts += 1;
  const cy = `ant-scroll-${mounts}`;
  const view = render(
    <InlineLibraryComponent
      bundleUrl="antd.js"
      cssUrl="antd.css"
      cacheKey={`ant-scroll-${mounts}`}
      componentName="DatePicker"
      componentProps={{}}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      host={makeHost('DatePicker', {})}
      dataCy={cy}
    />
  );
  const root = () => view.container.querySelector(`[data-cy="${cy}"]`).shadowRoot;
  await waitFor(() => expect(root()?.querySelector('.tj-ant-root')).toBeTruthy());
  return { view, ccRoot: root().querySelector('.tj-cc-root') };
};
const frame = () => act(() => new Promise((r) => requestAnimationFrame(() => r())));
const scrollOutside = () => {
  const div = document.createElement('div');
  document.body.appendChild(div);
  div.dispatchEvent(new Event('scroll'));
  div.remove();
};

describe('Ant popups follow the field when the canvas scrolls', () => {
  test('a scroll outside the widget reaches the pack root as a scroll event', async () => {
    const { ccRoot } = await mount();
    expect(ccRoot).toBeTruthy();
    const seen = jest.fn();
    ccRoot.addEventListener('scroll', seen);
    scrollOutside();
    await frame();
    expect(seen).toHaveBeenCalledTimes(1);
  });

  test('scrolls in one frame are throttled to one dispatch', async () => {
    const { ccRoot } = await mount();
    const seen = jest.fn();
    ccRoot.addEventListener('scroll', seen);
    scrollOutside();
    scrollOutside();
    await frame();
    expect(seen).toHaveBeenCalledTimes(1);
  });

  test('the root own scroll does not loop', async () => {
    const { ccRoot } = await mount();
    const seen = jest.fn();
    ccRoot.addEventListener('scroll', seen);
    ccRoot.dispatchEvent(new Event('scroll'));
    await frame();
    expect(seen).toHaveBeenCalledTimes(1);
  });

  test('after unmount nothing is dispatched', async () => {
    const { view, ccRoot } = await mount();
    const seen = jest.fn();
    ccRoot.addEventListener('scroll', seen);
    view.unmount();
    scrollOutside();
    await frame();
    expect(seen).not.toHaveBeenCalled();
  });
});
