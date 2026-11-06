import React from 'react';
import { render, waitFor } from '@testing-library/react';
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

  it('falls back to the page body outside a canvas', async () => {
    canvasArea.remove();
    const view = await mountIn(document.body, 'antd');
    expect(layerOf(view).parentElement).toBe(document.body);
  });
});
