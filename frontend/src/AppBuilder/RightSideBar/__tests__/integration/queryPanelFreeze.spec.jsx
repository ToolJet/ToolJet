/**
 * A released or read-only version freezes the right sidebar (no clicks reach it). The query panel opts
 * out: its controls apply their own freeze, and Run, Preview and close have to keep working there.
 */
import React from 'react';
import { act, screen } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { RightSideBar } from '@/AppBuilder/RightSideBar/RightSideBar';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const panel = () => document.querySelector('.sub-section > [data-state]');

const renderFrozenSidebarOn = (tab) => {
  act(() => {
    useStore.setState({ isVersionReleased: true });
    useStore.getState().setActiveRightSideBarTab(tab);
    useStore.getState().setRightSidebarOpen(true);
  });
  render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <RightSideBar darkMode={false} />
    </ModuleProvider>
  );
};

beforeEach(() => controls.observers.install());
afterEach(() => {
  act(() => useStore.setState({ isVersionReleased: false }));
  controls.restore();
});

test('the query panel stays clickable on a released version', () => {
  renderFrozenSidebarOn(RIGHT_SIDE_BAR_TAB.QUERY);

  expect(screen.getByRole('button', { name: 'Close query configuration' })).toBeInTheDocument();
  expect(panel()).not.toHaveClass('tw-pointer-events-none');
});

test('component configuration stays frozen on a released version', () => {
  renderFrozenSidebarOn(RIGHT_SIDE_BAR_TAB.CONFIGURATION);

  expect(panel()).toHaveClass('tw-pointer-events-none');
});
