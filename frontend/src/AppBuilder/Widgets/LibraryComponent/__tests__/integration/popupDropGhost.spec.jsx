import React from 'react';
import { act, render } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import useStore from '@/AppBuilder/_stores/store';
import LibrarySlotCanvas from '@/AppBuilder/Widgets/LibraryComponent/LibrarySlotCanvas';

// A drop area inside a pack popup (a Rocket Dialog body) lives in the popup layer above the canvas, so the editor's
// landing box, drawn in the main canvas, is hidden behind the dialog. The drop area draws a copy over itself.
jest.mock('@/AppBuilder/AppCanvas/Container', () => ({ Container: () => <div data-cy="sub-canvas" /> }));
jest.mock('@/AppBuilder/Widgets/LibraryComponent/useMeasuredWidth', () => ({ useMeasuredWidth: () => 300 }));

const rect = (left, top, width, height) => () => ({
  left,
  top,
  width,
  height,
  right: left + width,
  bottom: top + height,
  x: left,
  y: top,
});

const frames = () => act(() => new Promise((resolve) => setTimeout(resolve, 50)));

afterEach(() => {
  act(() => useStore.setState({ draggingComponentId: null }));
  document.body.innerHTML = '';
});

const mountInPopupLayer = (className = 'tj-cc-popup-host') => {
  const layer = document.createElement('div');
  layer.className = className;
  document.body.appendChild(layer);
  const view = render(
    <DndProvider backend={HTML5Backend}>
      <LibrarySlotCanvas id="dialog1-body" darkMode={false} />
    </DndProvider>,
    { container: layer }
  );
  const area = layer.querySelector('[data-cy="sub-canvas"]').parentElement;
  area.getBoundingClientRect = rect(400, 300, 300, 200);
  const ghost = document.createElement('div');
  ghost.id = 'moveable-ghost-widget';
  ghost.getBoundingClientRect = rect(450, 340, 120, 40);
  document.body.appendChild(ghost);
  return { view, layer };
};

describe('a pack popup drop area', () => {
  it('draws the landing box over itself while a component is dragged into it', async () => {
    const { layer } = mountInPopupLayer();
    act(() => useStore.setState({ draggingComponentId: 'button1' }));
    await frames();
    const copy = layer.querySelector('[data-cy="popup-drop-ghost"]');
    expect(copy).toBeTruthy();
    expect([copy.style.left, copy.style.top, copy.style.width, copy.style.height]).toEqual([
      '50px',
      '40px',
      '120px',
      '40px',
    ]);
  });

  it('draws nothing in a slot on the canvas, where the landing box of the editor shows', async () => {
    const { layer } = mountInPopupLayer('canvas-container');
    act(() => useStore.setState({ draggingComponentId: 'button1' }));
    await frames();
    expect(layer.querySelector('[data-cy="popup-drop-ghost"]')).toBeNull();
  });

  it('draws nothing when no drag is running', async () => {
    const { layer } = mountInPopupLayer();
    await frames();
    expect(layer.querySelector('[data-cy="popup-drop-ghost"]')).toBeNull();
  });
});
