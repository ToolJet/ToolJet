/**
 * UC-21: every rail item is named after the panel it opens. Its accessible name, the panel's title and
 * the panel's close button read one name, and the data-cy hooks Cypress specs click stay frozen.
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
const railHooks = () =>
  [...document.querySelectorAll('[data-cy^="left-sidebar-"][data-cy$="-button"]')].map((button) => button.dataset.cy);

beforeEach(() => {
  controls.observers.install();
  seedApp({});
  act(() => {
    useStore.getState().setCurrentMode('edit', 'canvas');
    useStore.getState().toggleLeftSidebar(false);
  });
});

afterEach(() => controls.restore());

test('keeps the data-cy hook of every rail item', () => {
  render(<BaseLeftSidebar />);

  expect(railHooks()).toEqual([
    'left-sidebar-pages-button',
    'left-sidebar-components-button',
    'left-sidebar-queries-button',
    'left-sidebar-code-search-button',
    'left-sidebar-dependencies-button',
    'left-sidebar-settings-button',
  ]);
});

const RAIL = [
  ['pages', 'Pages', 'Pages'],
  ['components', 'Add', 'Components'],
  ['queries', 'Queries', 'Queries'],
  ['code-search', 'Search', 'Code search'],
  ['dependencies', 'Deps', 'Dependencies'],
  ['settings', 'Settings', 'App settings'],
];
const railItem = (cy) => document.querySelector(`[data-cy="left-sidebar-${cy}-button"]`);

test.each(RAIL)('the %s rail item shows "%s" and is named "%s"', (cy, label, name) => {
  render(<BaseLeftSidebar />);

  expect(railItem(cy)).toHaveAccessibleName(name);
  expect(railItem(cy).querySelector('.left-sidebar-item-label')).toHaveTextContent(label);
});

// Pages and App settings need a loaded app to render; the panels Cypress sweep checks their titles.
test.each(RAIL.filter(([cy]) => !['pages', 'settings'].includes(cy)))(
  'the %s rail item opens a panel titled with its name, closed by "Close <name>"',
  (cy, label, name) => {
    // The Components panel drags widgets onto the canvas.
    render(
      <DndProvider backend={HTML5Backend}>
        <BaseLeftSidebar />
      </DndProvider>
    );

    fireEvent.click(railItem(cy));

    expect(document.querySelector('.left-sidebar-panel-content .tj-panel-header__title')).toHaveTextContent(name);
    expect(screen.getByRole('button', { name: `Close ${name.toLowerCase()}` })).toBeInTheDocument();
  }
);

test('the rail divider carries no name of its own', () => {
  render(<BaseLeftSidebar />);

  expect(document.querySelector('.left-sidebar-section-divider')).not.toHaveAttribute('aria-label');
});
