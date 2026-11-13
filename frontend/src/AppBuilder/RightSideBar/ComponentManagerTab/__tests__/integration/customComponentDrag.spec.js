import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import useStore from '@/AppBuilder/_stores/store';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { CustomComponentsTab } from '../../CustomComponentsTab';

const library = {
  id: 'lib-beta',
  correlationId: '22222222-2222-2222-2222-222222222222',
  name: 'Beta',
  revisions: [{ id: 'rb1', version: 'v1', createdAt: '2024-01-01T00:00:00.000Z' }],
  devBundles: [],
  manifest: { components: { Button: { displayName: 'Button' } } },
};

// jsdom has no ResizeObserver — OverflowTooltip (wrapping the library title) mounts one.
global.ResizeObserver =
  global.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

const dataTransfer = () => ({ setData() {}, getData() {}, setDragImage() {}, types: [], effectAllowed: 'all' });

describe('dragging a custom component card', () => {
  beforeEach(() => {
    useCustomComponentLibrariesStore.setState({ libraries: [library], loadFailed: false });
    act(() => useStore.setState({ isRightSidebarOpen: true, isRightSidebarPinned: false }));
  });

  afterEach(() => {
    act(() => useCustomComponentLibrariesStore.setState({ libraries: null, loadFailed: false }));
  });

  it('[CustomComponentsTab-DRAG-001] keeps the unpinned component panel open while a card is dragged', () => {
    // Break this catches: closing the panel when a drag starts. The panel unmounts with it, taking the
    // dragged card out of the DOM, so the browser never fires dragend and react-dnd only finishes the drop
    // on the next mouse move — the drop lands late, after the user nudges the cursor.
    render(
      <DndProvider backend={HTML5Backend}>
        <CustomComponentsTab />
      </DndProvider>
    );
    const card = screen.getByText('Button').closest('.custom-component-card');

    act(() => {
      fireEvent.dragStart(card, { dataTransfer: dataTransfer() });
    });

    expect(useStore.getState().isRightSidebarOpen).toBe(true);
  });
});
