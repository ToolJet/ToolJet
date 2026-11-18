// PKB-43: a slot in a hidden pane measures 0; with a fallbackWidth its sub-canvas still mounts, and the real width
// replaces the fallback when shown. Without one it stays unmounted (as before).
import React from 'react';
import { act, render } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import LibrarySlotCanvas from '@/AppBuilder/Widgets/LibraryComponent/LibrarySlotCanvas';

jest.mock('@/AppBuilder/AppCanvas/Container', () => ({
  Container: ({ canvasWidth }) => <div data-cy="sub-canvas" data-width={canvasWidth} />,
}));

let clientWidth = 0;
let fire;
beforeEach(() => {
  clientWidth = 0;
  jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => clientWidth);
  global.ResizeObserver = class {
    constructor(cb) {
      fire = cb;
    }
    observe() {}
    disconnect() {}
  };
});
afterEach(() => jest.restoreAllMocks());

const mount = (props) =>
  render(
    <DndProvider backend={HTML5Backend}>
      <LibrarySlotCanvas id="w-tab_tab2" darkMode={false} {...props} />
    </DndProvider>
  );

it('mounts the sub-canvas at the fallback width while hidden, then at the real width', async () => {
  const { container } = mount({ fallbackWidth: 300 });
  expect(container.querySelector('[data-cy="sub-canvas"]').dataset.width).toBe('300');
  clientWidth = 500;
  await act(async () => fire());
  expect(container.querySelector('[data-cy="sub-canvas"]').dataset.width).toBe('500');
});

it('does not mount without a fallback while hidden', () => {
  const { container } = mount({});
  expect(container.querySelector('[data-cy="sub-canvas"]')).toBeNull();
});
