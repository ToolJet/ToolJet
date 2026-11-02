/**
 * Opening a left panel reserves its width as a left border on the canvas and scrolls the canvas by
 * the same amount, so the widgets stay put under the panel. Both must land in the same frame: if
 * the canvas scrolls before the border is on it, the widgets jump left for a frame and snap back.
 */
import React, { useRef } from 'react';
import { act, render } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import useSidebarMargin from '@/AppBuilder/AppCanvas/Hooks/useSidebarMargin';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';

const scrollCalls = [];

const Canvas = () => {
  const ref = useRef(null);
  const marginLeft = useSidebarMargin(ref);
  return (
    <div
      ref={(node) => {
        if (node && !node.__patched) {
          node.__patched = true;
          node.scrollTo = ({ left }) => scrollCalls.push({ left, border: node.style.borderLeftWidth });
        }
        ref.current = node;
      }}
      style={{ borderLeft: `${marginLeft}px solid` }}
    />
  );
};

beforeEach(() => {
  scrollCalls.length = 0;
  act(() => {
    useStore.getState().setCurrentMode('edit', 'canvas');
    useStore.getState().toggleLeftSidebar(false);
  });
});

const renderCanvas = () =>
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <Canvas />
    </ModuleProvider>
  );

test('scrolls the canvas only once the left panel width is reserved on it', () => {
  renderCanvas();
  scrollCalls.length = 0;

  act(() => {
    useStore.getState().setSelectedSidebarItem('pages');
    useStore.getState().toggleLeftSidebar(true);
  });

  expect(scrollCalls).toEqual([{ left: 350, border: '350px' }]);
});

test('releases the reserved width in the same pass that scrolls the canvas back', () => {
  renderCanvas();
  act(() => {
    useStore.getState().setSelectedSidebarItem('pages');
    useStore.getState().toggleLeftSidebar(true);
  });
  scrollCalls.length = 0;

  act(() => useStore.getState().toggleLeftSidebar(false));

  expect(scrollCalls).toHaveLength(1);
  expect(scrollCalls[0].border).toBe('0px');
});
