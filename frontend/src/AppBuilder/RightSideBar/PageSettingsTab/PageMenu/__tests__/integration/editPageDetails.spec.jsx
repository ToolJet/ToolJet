/**
 * Page 3-dot menu actions and docked "Edit page" panel behavior.
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';
import { PageMenuItem } from '../../PageMenuItem';
import { DeletePageConfirmationModal } from '../../DeletePageConfirmationModal';

const controls = createAppBuilderControls();
const HOME = { id: 'home-1', handle: 'home', name: 'Home', type: 'default', components: {} };
const SECOND = { id: 'page-2', handle: 'second', name: 'Second', type: 'default', components: {} };

beforeEach(() => {
  controls.observers.install();
  const s = useStore.getState();
  act(() => {
    s.initializeDependencySlice('canvas');
    s.setPages([HOME, SECOND], 'canvas');
    s.setCurrentPageId('home-1', 'canvas');
    s.setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'home-1', slug: 'slug-app-1' }, 'canvas');
    s.setPageSettings(s.computePageSettings({}), 'canvas');
    s.setActiveRightSideBarTab(null);
    s.setRightSidebarOpen(false);
  });
});

// Break this catches: opening another row's menu replaces the page being edited and clears its form type.
test('opening and dismissing a page menu preserves the open page configuration', () => {
  const { container, unmount } = render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <PageMenuItem page={HOME} darkMode={false} />
      <PageMenuItem page={SECOND} darkMode={false} />
    </ModuleProvider>
  );
  const [homeRow, secondRow] = container.querySelectorAll('.page-menu-item');
  fireEvent.click(homeRow);

  for (const row of [homeRow, secondRow]) {
    fireEvent.click(row.querySelector('.action-btn-wrapper .icon-btn:last-of-type'));
    expect(screen.getByRole('button', { name: 'Duplicate page' })).toBeInTheDocument();
    fireEvent.click(document.body);
    expect(useStore.getState().editingPage?.id).toBe(HOME.id);
    expect(useStore.getState().newPagePopupConfig).toMatchObject({ mode: 'edit', type: 'default' });
  }
  unmount();
});

test('the Delete dialog targets the menu row and Cancel leaves the open page configuration intact', () => {
  const { container, unmount } = render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <PageMenuItem page={HOME} darkMode={false} />
      <PageMenuItem page={SECOND} darkMode={false} />
      <DeletePageConfirmationModal darkMode={false} />
    </ModuleProvider>
  );
  const [homeRow, secondRow] = container.querySelectorAll('.page-menu-item');
  fireEvent.click(homeRow);
  fireEvent.click(secondRow.querySelector('.action-btn-wrapper .icon-btn:last-of-type'));
  fireEvent.click(screen.getByRole('button', { name: 'Delete page' }));

  expect(screen.getByRole('heading', { name: 'Delete "Second"?' })).toBeInTheDocument();
  expect(useStore.getState().editingPage?.id).toBe(HOME.id);
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
  expect(useStore.getState().editingPage?.id).toBe(HOME.id);
  expect(screen.queryByRole('heading', { name: 'Delete "Second"?' })).not.toBeInTheDocument();
  unmount();
});

afterEach(() => controls.restore());

test('page menu does not include "Edit page details" and clicking a row opens the docked Edit page panel', () => {
  const { container, unmount } = render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <PageMenuItem page={HOME} darkMode={false} />
    </ModuleProvider>
  );

  const buttons = container.querySelectorAll('.action-btn-wrapper .icon-btn');
  fireEvent.click(buttons[buttons.length - 1]);
  expect(screen.getByRole('button', { name: 'Duplicate page' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Edit page details' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Page permission' })).not.toBeInTheDocument();
  fireEvent.click(document.body);

  fireEvent.click(container.querySelector('.page-menu-item'));

  const state = useStore.getState();
  expect(state.editingPage?.id).toBe('home-1');
  expect(state.newPagePopupConfig).toMatchObject({ mode: 'edit', type: 'default' });
  expect(state.activeRightSideBarTab).toBe(RIGHT_SIDE_BAR_TAB.PAGE_CONFIGURATION);
  expect(state.isRightSidebarOpen).toBe(true);
  expect(document.querySelector('#add-new-page-popup')).toBeNull();
  unmount();
});
