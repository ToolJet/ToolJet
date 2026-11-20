// PF-279: Carousel fired afterChange twice per slide change (and endlessly on a tap mid-animation).
import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
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

jest.setTimeout(20000);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// react-slick's setState callbacks are deferred inside act and hide the bug: run real timers outside act.
beforeAll(() => {
  global.IS_REACT_ACT_ENVIRONMENT = false;
});
let n = 0;
const mount = async (props) => {
  loadLibraryModule.mockResolvedValue(pack);
  n += 1;
  const events = [];
  const seq = [];
  const exposed = {};
  const el = (p) => (
    <InlineLibraryComponent
      bundleUrl="pack.js"
      cssUrl="pack.css"
      cacheKey="car-after"
      componentName="Carousel"
      componentProps={p}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={(k, v) => {
        exposed[k] = v;
      }}
      fireEvent={(e) => {
        events.push(e);
        seq.push(exposed.current);
      }}
      actions={new Map()}
      host={makeHost('Carousel')}
      dataCy={`car-${n}`}
    />
  );
  const view = render(el(props));
  const root = () => document.querySelector(`[data-cy="car-${n}"]`).shadowRoot;
  await waitFor(() => expect(root().querySelector('.slick-dots button')).toBeTruthy());
  await sleep(700);
  const dot = (i) => act(() => root().querySelectorAll('.slick-dots button')[i].click());
  return { events, seq, exposed, dot, rerender: (p) => view.rerender(el(p)), root };
};
afterEach(() => {
  document.body.innerHTML = '';
});

it('(a) one dot tap fires afterChange once, none on mount', async () => {
  const v = await mount({});
  expect(v.events).toHaveLength(0);
  v.dot(1);
  await sleep(2000);
  expect(v.events).toHaveLength(1);
});

it('(b) a second tap mid-animation does not ping-pong', async () => {
  const v = await mount({});
  v.dot(1);
  await sleep(200);
  v.dot(2);
  await sleep(1500);
  expect(v.events.length).toBeLessThanOrEqual(2);
});

it('(c) autoplay reports each slide once', async () => {
  const v = await mount({ autoplay: true, autoplaySpeed: 1000 });
  await sleep(4200);
  expect(v.events.length).toBeLessThanOrEqual(5);
  expect(v.events.length).toBeGreaterThan(0);
  v.seq.forEach((s, i) => i && expect(s).not.toBe(v.seq[i - 1]));
});

it('(d) app-set current moves the carousel and fires afterChange once', async () => {
  const v = await mount({ current: 0 });
  v.rerender({ current: 2 });
  await sleep(2000);
  expect(v.events).toHaveLength(1);
  expect(v.root().querySelectorAll('.slick-dots li')[2].className).toContain('slick-active');
});
