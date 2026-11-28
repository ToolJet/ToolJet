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
const REPORTS = { id: 'reports-1', handle: 'reports', name: 'Reports', type: 'default', components: {} };
const DOCS = { id: 'nav-1', name: 'Docs', type: 'url', url: 'https://example.com', openIn: 'new_tab' };

beforeEach(() => {
  controls.observers.install();
  const s = useStore.getState();
  act(() => {
    s.initializeDependencySlice('canvas');
    s.setPages([HOME, REPORTS, DOCS], 'canvas');
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

// Opening settings or the options menu for another row must keep the current canvas page highlighted.
test('the highlight follows the current page while another row is being configured', () => {
  const { container, unmount } = render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <PageMenuItem page={HOME} darkMode={false} />
      <PageMenuItem page={REPORTS} darkMode={false} />
      <PageMenuItem page={DOCS} darkMode={false} />
    </ModuleProvider>
  );
  const [homeRow, reportsRow, docsRow] = container.querySelectorAll('.page-menu-item');
  const expectCurrentRow = (row) => {
    expect([...container.querySelectorAll('.page-menu-item.is-selected')]).toEqual([row]);
    expect(row).toHaveAttribute('aria-current', 'page');
  };

  try {
    expectCurrentRow(homeRow);
    fireEvent.click(reportsRow.querySelector('.action-btn-wrapper .icon-btn:last-of-type'));
    expectCurrentRow(homeRow);
    fireEvent.click(document.body);

    fireEvent.click(docsRow);
    expectCurrentRow(homeRow);
    act(() => useStore.getState().setCurrentPageId(REPORTS.id, 'canvas'));
    expectCurrentRow(reportsRow);
    act(() => useStore.getState().setRightSidebarOpen(false));
    expectCurrentRow(reportsRow);
  } finally {
    unmount();
  }
});
