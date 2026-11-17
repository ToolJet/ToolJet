import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import useStore from '@/AppBuilder/_stores/store';
import { LibrarySection } from '../../CustomComponentsTab';

// A plain custom library: its components declare no roles (no pack sections).
const library = {
  id: 'lib-counter',
  correlationId: '33333333-3333-3333-3333-333333333333',
  name: 'Counter Button Demo',
  revisions: [{ id: 'rc1', version: 'v1', createdAt: '2024-01-01T00:00:00.000Z' }],
  devBundles: [],
  manifest: {
    components: {
      CounterButton: { displayName: 'Counter Button' },
      ResetButton: { displayName: 'Reset Button' },
    },
  },
};

global.ResizeObserver =
  global.ResizeObserver ||
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

const renderPicked = (searchQuery = '') =>
  render(
    <DndProvider backend={HTML5Backend}>
      <LibrarySection library={library} searchQuery={searchQuery} picked />
    </DndProvider>
  );

describe('a custom library without roles in the palette', () => {
  beforeEach(() => {
    act(() => useStore.getState().setGlobalSettings({ customComponentLibraries: {} }));
  });

  it('[CustomComponentsTab-TILES-001] shows its components as widget tiles in the palette grid, under the Version row', () => {
    // Break this catches: a role-less library falling back to list rows instead of the tile grid the built-in
    // libraries use.
    const { container } = renderPicked();

    const grid = container.querySelector('.custom-library-pack-section .component-card-group-wrapper');
    expect(grid).not.toBeNull();
    const tiles = grid.querySelectorAll('.draggable-box-wrapper');
    expect([...tiles].map((tile) => tile.querySelector('.component-title').textContent)).toEqual([
      'Counter Button',
      'Reset Button',
    ]);
    // One untitled section: the tab already names the library.
    expect(container.querySelector('.custom-library-pack-section-title')).toBeNull();

    const versionRow = container.querySelector('.custom-library-version-row');
    expect(versionRow).toHaveTextContent('Version');
    expect(versionRow.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('[CustomComponentsTab-TILES-002] keeps only the tiles that match the search', () => {
    renderPicked('reset');

    expect(screen.getByText('Reset Button').closest('.draggable-box-wrapper')).not.toBeNull();
    expect(screen.queryByText('Counter Button')).toBeNull();
  });

  it('[CustomComponentsTab-TILES-003] keeps each tile name whole in its tooltip, since the title shows two lines at most', () => {
    // Break this catches: a long component name cut off by the two-line clamp with no way to read the rest.
    const { container } = renderPicked();

    const titles = [...container.querySelectorAll('.draggable-box-wrapper .component-title')];
    expect(titles.map((title) => title.getAttribute('title'))).toEqual(['Counter Button', 'Reset Button']);
  });
});
