import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';
import { installBrowserStubs, makeHost } from './fuzz/packTestEnv';

installBrowserStubs();

// QA item 20: On hover never fired on a pack Button, Text, Heading, Link or Icon when the pointer came straight from
// the canvas. A pack draws into ToolJet's own React tree through a shadow root, and React works out an enter from the
// element the pointer left: the canvas is one of ToolJet's elements, so React left the enter to the canvas's
// listener, which can't see into the shadow root. Here the canvas is a React element around the widget, as in the
// editor and the viewer; the pack components and the host renderer are the real ones.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const packs = {
  shadcn: require('../../../../../../packs/shadcn/src/index.ts'),
  antd: require('../../../../../../packs/antd/src/index.ts'),
};

let mounts = 0;
const mount = async (pack, name, props = {}) => {
  loadLibraryModule.mockResolvedValue(packs[pack]);
  mounts += 1;
  const events = [];
  const view = render(
    <div data-testid="canvas" className="real-canvas">
      <InlineLibraryComponent
        bundleUrl={`${pack}.js`}
        cssUrl={`${pack}.css`}
        cacheKey={`pointer-in-${pack}`}
        componentName={name}
        componentProps={props}
        componentStyles={{}}
        renderSlot={() => null}
        setExposedVariable={() => {}}
        fireEvent={(event) => events.push(event)}
        actions={new Map()}
        host={makeHost(name, {})}
        dataCy={`hover-${mounts}`}
      />
    </div>
  );
  const shadow = () => view.container.querySelector(`[data-cy="hover-${mounts}"]`).shadowRoot;
  await waitFor(() => expect(shadow()?.querySelector('.tj-cc-root')?.childElementCount).toBeGreaterThan(0));
  const canvas = view.getByTestId('canvas');
  // The innermost element the pointer lands on: the first leaf of the drawn component.
  let leaf = shadow().querySelector('.tj-cc-root').firstElementChild;
  while (leaf.firstElementChild) leaf = leaf.firstElementChild;
  return { canvas, leaf, events: () => events.filter((e) => e === 'onHover') };
};

// The events a browser sends when the pointer moves from `from` onto `to`.
const pointerMove = (from, to) =>
  act(() => {
    from.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, composed: true, relatedTarget: to }));
    to.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, composed: true, relatedTarget: from }));
  });

describe('On hover of a pack component reached from the canvas', () => {
  it.each([
    ['shadcn', 'Button'],
    ['shadcn', 'Text'],
    ['shadcn', 'Heading'],
    ['shadcn', 'Link'],
    ['shadcn', 'Icon'],
    ['antd', 'Link'],
    ['antd', 'Icon'],
  ])('%s %s fires once', async (pack, name) => {
    const { canvas, leaf, events } = await mount(pack, name);
    pointerMove(canvas, leaf);
    expect(events()).toHaveLength(1);
  });

  it('does not fire again as the pointer moves within the component', async () => {
    // The Ant Icon's glyph: an svg and its path, inside the element that fires On hover.
    const { canvas, leaf, events } = await mount('antd', 'Icon');
    const glyph = leaf.parentElement;
    expect(glyph.closest('svg')).toBeTruthy();
    pointerMove(canvas, leaf);
    pointerMove(leaf, glyph);
    pointerMove(glyph, leaf);
    expect(events()).toHaveLength(1);
  });

  it('fires again once the pointer has left and comes back', async () => {
    const { canvas, leaf, events } = await mount('antd', 'Icon');
    pointerMove(canvas, leaf);
    pointerMove(leaf, canvas);
    pointerMove(canvas, leaf);
    expect(events()).toHaveLength(2);
  });
});
