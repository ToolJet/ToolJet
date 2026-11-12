/**
 * Clicking a row in the Pages panel opens its configuration in the right panel. Only a page row also
 * switches the canvas: a URL, app or custom nav item must not run its navigation (open the URL, leave the
 * editor, fire its events) just because the builder selected it to edit.
 */
import React from 'react';
import { act, fireEvent } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';
import { PageMenuItem } from '../../PageMenuItem';

const controls = createAppBuilderControls();
const HOME = { id: 'home-1', handle: 'home', name: 'Home', components: {} };
const DOCS = { id: 'nav-1', name: 'Docs', type: 'url', url: 'https://example.com', openIn: 'new_tab' };

beforeEach(() => {
  controls.observers.install();
  const s = useStore.getState();
  act(() => {
    s.initializeDependencySlice('canvas');
    s.setPages([HOME, DOCS], 'canvas');
    s.setCurrentPageId('home-1', 'canvas');
    s.setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'home-1', slug: 'slug-app-1' }, 'canvas');
    s.setPageSettings(s.computePageSettings({}), 'canvas');
    s.setActiveRightSideBarTab(null);
    s.setRightSidebarOpen(false);
  });
});

afterEach(() => controls.restore());

test('clicking a URL nav item opens its configuration without opening the URL', () => {
  const open = jest.spyOn(window, 'open').mockImplementation(() => null);
  const { container, unmount } = render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <PageMenuItem page={DOCS} darkMode={false} />
    </ModuleProvider>
  );

  fireEvent.click(container.querySelector('.page-menu-item'));

  expect(open).not.toHaveBeenCalled();
  const state = useStore.getState();
  expect(state.editingPage?.id).toBe('nav-1');
  expect(state.newPagePopupConfig).toMatchObject({ mode: 'edit', type: 'url' });
  expect(state.activeRightSideBarTab).toBe(RIGHT_SIDE_BAR_TAB.PAGE_CONFIGURATION);
  expect(state.isRightSidebarOpen).toBe(true);
  unmount();
  open.mockRestore();
});
