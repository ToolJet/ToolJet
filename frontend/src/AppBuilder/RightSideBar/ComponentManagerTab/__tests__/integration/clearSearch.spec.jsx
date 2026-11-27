/**
 * LP-32: in the Components panel's no-match state, "Clear search" empties the search box as well as
 * the filter. The box kept the typed text, so the next keystroke filtered on the old term again.
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { BaseLeftSidebar } from '@/AppBuilder/LeftSidebar/LeftSidebar';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const searchBox = () => document.querySelector('[data-cy="widget-search-box-search-bar"]');

beforeEach(() => {
  jest.useFakeTimers();
  controls.observers.install();
  seedApp({});
  act(() => {
    useStore.getState().setCurrentMode('edit', 'canvas');
    useStore.getState().toggleLeftSidebar(false);
  });
  render(
    <DndProvider backend={HTML5Backend}>
      <BaseLeftSidebar />
    </DndProvider>
  );
  fireEvent.click(document.querySelector('[data-cy="left-sidebar-components-button"]'));
});

afterEach(() => {
  controls.restore();
  jest.useRealTimers();
});

// Break this catches: Clear search resets the list but leaves "zzqqxx" in the box.
test('"Clear search" empties the search box and shows every component again', () => {
  fireEvent.change(searchBox(), { target: { value: 'zzqqxx' } });
  act(() => jest.advanceTimersByTime(500));
  expect(screen.getByText(/No matches for/)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));

  expect(searchBox()).toHaveValue('');
  expect(screen.queryByText(/No matches for/)).toBeNull();
});
