import React from 'react';
import { act, render, waitFor } from '@testing-library/react';
import InlineLibraryComponent from '@/AppBuilder/Widgets/LibraryComponent/InlineLibraryComponent';
import { loadLibraryModule } from '@/AppBuilder/Widgets/LibraryComponent/inlineRuntime';

// Where a pack's popups and dialogs are drawn, and how they stack against other packs' and ToolJet's (QA PKB-03, -04,
// -05, -06). Every pack drew into one shared layer on document.body, above the whole app: the packs' own z-indexes then
// decided between packs (Rocket 50, Ant 1000-1050, MUI 1300), so an Ant Select in an MUI Dialog opened behind it, and a
// ToolJet Modal (drawn in the canvas, its own stacking context) could never open above a pack dialog.
// A layer now sits in the canvas, as the ToolJet Modal does, at one explicit level; a widget drawn inside another
// dialog (a pack's popup layer or a ToolJet Modal) gets its own layer one level above that dialog.
jest.mock('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime', () => ({
  ...jest.requireActual('@/AppBuilder/Widgets/LibraryComponent/inlineRuntime'),
  loadLibraryModule: jest.fn(),
  loadLibraryCss: jest.fn(() => Promise.resolve(null)),
}));

const Probe = () => null;
loadLibraryModule.mockResolvedValue({ Probe });

let mounts = 0;
const widget = (library) => {
  mounts += 1;
  return (
    <InlineLibraryComponent
      bundleUrl={`${library}.js`}
      cssUrl={`${library}.css`}
      cacheKey={library}
      componentName="Probe"
      componentProps={{}}
      componentStyles={{}}
      renderSlot={() => null}
      setExposedVariable={() => {}}
      fireEvent={() => {}}
      actions={new Map()}
      dataCy={`stack-${mounts}`}
    />
  );
};

// The popup layer a mounted widget draws into: the host of its shadow root's tjOverlay.
const layerOf = (view) => {
  const root = view.container.querySelector('[data-cy^="stack-"]').shadowRoot;
  return root.tjOverlay.getRootNode().host;
};

// Mounts a widget as a child of `parent`, as a dialog body's components are (light-DOM children of the layer host).
const mountIn = async (parent, library) => {
  const container = document.createElement('div');
  parent.appendChild(container);
  const view = render(widget(library), { container });
  await waitFor(() => expect(view.container.querySelector('[data-cy^="stack-"]').shadowRoot?.tjOverlay).toBeTruthy());
  return view;
};

describe('pack popup layers', () => {
  let canvasArea;
  beforeEach(() => {
    canvasArea = document.createElement('div');
    canvasArea.className = 'tj-canvas-area';
    document.body.appendChild(canvasArea);
  });
  afterEach(() => {
    canvasArea.remove();
    document.body.innerHTML = '';
  });

  it('draws in the canvas, as a ToolJet Modal does, not over the whole page', async () => {
    const view = await mountIn(canvasArea, 'antd');
    const layer = layerOf(view);
    expect(layer.parentElement).toBe(canvasArea);
    expect(layer.style.zIndex).toBe('1055');
  });

  it('lets clicks through where it draws nothing, and takes them on its popups', async () => {
    const view = await mountIn(canvasArea, 'antd');
    const layer = layerOf(view);
    expect(layer.style.pointerEvents).toBe('none');
    expect(layer.shadowRoot.querySelector('.tj-cc-overlay').style.pointerEvents).toBe('auto');
  });

  it("stacks a widget in another pack's dialog above that dialog", async () => {
    const mui = layerOf(await mountIn(canvasArea, 'mui'));
    const antInMui = layerOf(await mountIn(mui, 'antd'));
    expect(antInMui).not.toBe(mui);
    expect(antInMui.parentElement).toBe(canvasArea);
    expect(Number(antInMui.style.zIndex)).toBeGreaterThan(Number(mui.style.zIndex));
  });

  it("gives a widget in its own pack's dialog a layer above it, apart from the pack's canvas-level layer", async () => {
    const shadOnCanvas = layerOf(await mountIn(canvasArea, 'shadcn'));
    const shadInDialog = layerOf(await mountIn(shadOnCanvas, 'shadcn'));
    expect(shadInDialog).not.toBe(shadOnCanvas);
    expect(Number(shadInDialog.style.zIndex)).toBeGreaterThan(Number(shadOnCanvas.style.zIndex));
  });

  it('gives the widgets of two different dialogs layers of their own', async () => {
    const firstDialog = layerOf(await mountIn(canvasArea, 'mui'));
    const secondDialog = layerOf(await mountIn(canvasArea, 'shadcn'));
    const inFirst = layerOf(await mountIn(firstDialog, 'antd'));
    const inSecond = layerOf(await mountIn(secondDialog, 'antd'));
    expect(inSecond).not.toBe(inFirst);
  });

  it('shares one layer between the widgets of a pack drawn at the same level', async () => {
    const first = layerOf(await mountIn(canvasArea, 'antd'));
    const second = layerOf(await mountIn(canvasArea, 'antd'));
    expect(second).toBe(first);
  });

  it('stacks a widget in a ToolJet Modal above the modal', async () => {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.zIndex = '1060';
    canvasArea.appendChild(modal);
    const layer = layerOf(await mountIn(modal, 'mui'));
    expect(layer.parentElement).toBe(canvasArea);
    expect(Number(layer.style.zIndex)).toBeGreaterThan(1060);
  });

  // A page taller than the window scrolls the whole canvas inside the app's scroller, so a layer the canvas's size drew
  // a centred dialog half a page down and a drawer past the window's bottom. The layer covers what is visible of the
  // canvas, and is the box its dialogs and drawers fill.
  describe('on a page taller than the window', () => {
    let scroller;
    const rect = (top, height) => () => ({
      top,
      bottom: top + height,
      height,
      left: 0,
      right: 1600,
      width: 1600,
      x: 0,
      y: top,
    });
    beforeEach(() => {
      scroller = document.createElement('div');
      scroller.style.overflowY = 'auto';
      document.body.appendChild(scroller);
      scroller.appendChild(canvasArea);
      // The app's scroller starts under a 33px bar and shows 967px; the canvas is 1640px tall.
      window.innerHeight = 1000;
      scroller.getBoundingClientRect = rect(33, 967);
      canvasArea.getBoundingClientRect = rect(33, 1640);
    });
    afterEach(() => scroller.remove());

    it('covers the visible part of the canvas, and holds its dialogs and drawers', async () => {
      const layer = layerOf(await mountIn(canvasArea, 'antd'));
      expect(layer.style.top).toBe('0px');
      expect(layer.style.height).toBe('967px');
      expect(layer.style.transform).toBe('translateZ(0)');
    });

    it('follows the canvas as the page scrolls', async () => {
      const layer = layerOf(await mountIn(canvasArea, 'antd'));
      canvasArea.getBoundingClientRect = rect(33 - 300, 1640);
      act(() => {
        scroller.dispatchEvent(new Event('scroll'));
      });
      await waitFor(() => expect(layer.style.top).toBe('300px'));
      expect(layer.style.height).toBe('967px');
    });
  });

  // QA item 46: with the editor's right panel open, the canvas scrolls sideways under it (its scroller gets a 300px
  // right border the panel covers), and the layer, as wide as the canvas, drew a right-placed Ant Drawer under the
  // panel, cut off. The layer covers only what is visible of the canvas across, too.
  describe('in the editor with the right panel open', () => {
    let scroller;
    const box =
      (left, width, top = 56, height = 796) =>
      () => ({
        top,
        bottom: top + height,
        height,
        left,
        right: left + width,
        width,
        x: left,
        y: top,
      });
    beforeEach(() => {
      // The editor's canvas scroller: it scrolls across and clips up and down.
      scroller = document.createElement('div');
      scroller.style.overflowX = 'auto';
      scroller.style.overflowY = 'hidden';
      document.body.appendChild(scroller);
      scroller.appendChild(canvasArea);
      window.innerHeight = 900;
      window.innerWidth = 1440;
      // The scroller spans 48 to 1392 with the panel's 300px border inside it: its visible inside ends at 1092. The
      // canvas keeps its full 1328px (56 to 1384), so its right part lies under the panel.
      scroller.getBoundingClientRect = box(48, 1344, 48, 812);
      Object.defineProperty(scroller, 'clientLeft', { configurable: true, value: 0 });
      Object.defineProperty(scroller, 'clientWidth', { configurable: true, value: 1044 });
      canvasArea.getBoundingClientRect = box(56, 1328);
    });
    afterEach(() => scroller.remove());

    it('ends where the panel starts', async () => {
      // Break this catches: a layer as wide as the canvas, so a right-placed drawer opens under the panel.
      const layer = layerOf(await mountIn(canvasArea, 'antd'));
      expect(layer.style.left).toBe('0px');
      expect(layer.style.width).toBe('1036px');
    });

    it('follows the canvas as it scrolls sideways under the panel', async () => {
      // Break this catches: a layer fitted once, left behind when the canvas scrolls across.
      const layer = layerOf(await mountIn(canvasArea, 'antd'));
      canvasArea.getBoundingClientRect = box(56 - 200, 1328);
      act(() => {
        scroller.dispatchEvent(new Event('scroll'));
      });
      await waitFor(() => expect(layer.style.left).toBe('192px'));
      expect(layer.style.width).toBe('1044px');
    });
  });

  it('falls back to the page body outside a canvas', async () => {
    canvasArea.remove();
    const view = await mountIn(document.body, 'antd');
    expect(layerOf(view).parentElement).toBe(document.body);
  });
});
