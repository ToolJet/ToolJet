/**
 * The canvas and the left panel reserve `queryPanelHeight` at the bottom of the viewport, so it must equal
 * the drawer's height once a drag or an expand ends. The drawer animates its height, so reading the DOM
 * at that moment gets a mid-transition value and leaves a dead strip above the drawer (PL-35).
 */
import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { QueryPanel } from '@/AppBuilder/QueryPanel/QueryPanel';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const drawer = () => document.querySelector('.runtime-panel-content');
const queryPanelHeight = () => useStore.getState().queryPanel.queryPanelHeight;

const renderDrawer = ({ expanded }) => {
  act(() => useStore.getState().queryPanel.setIsQueryPaneExpanded(expanded));
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <QueryPanel darkMode={false} />
    </ModuleProvider>
  );
};

beforeEach(() => {
  controls.observers.install();
  jest.replaceProperty(window, 'innerHeight', 900);
  localStorage.removeItem('runtimePanelPreferences');
});

afterEach(() => {
  jest.restoreAllMocks();
  controls.restore();
});

test('[PL-35] a fast drag reserves the height the drawer was released at', () => {
  renderDrawer({ expanded: true });
  // The drawer opens at 70% of the viewport by default.
  controls.geometry.element(drawer(), { top: 630 });

  fireEvent.mouseMove(document, { clientY: 631 });
  fireEvent.mouseDown(drawer(), { clientY: 631 });
  fireEvent.mouseMove(document, { clientY: 540 });
  expect(queryPanelHeight()).toBe(270);
  // Released in the same frame as the last move, before React re-renders with the dragged height.
  act(() => {
    fireEvent.mouseMove(document, { clientY: 450 });
    fireEvent.mouseUp(document, { clientY: 450 });
  });

  expect(queryPanelHeight()).toBe(450);
  expect(JSON.parse(localStorage.getItem('runtimePanelPreferences'))).toMatchObject({ panelTop: 50 });
});

test('[PL-35] expanding the drawer reserves its full height at once', () => {
  renderDrawer({ expanded: false });
  expect(queryPanelHeight()).toBe(0);

  fireEvent.click(document.querySelector('[data-cy="query-manager-toggle-button"]'));

  expect(queryPanelHeight()).toBe(270);
});

test('[PL-35] resizing the window keeps the reserve equal to the open drawer', () => {
  renderDrawer({ expanded: true });
  expect(queryPanelHeight()).toBe(270);

  jest.replaceProperty(window, 'innerHeight', 600);
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });

  expect(queryPanelHeight()).toBe(180);
});
