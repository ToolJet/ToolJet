/**
 * "Edit page details" in a page's 3-dot menu opens the same docked "Edit page" panel a row click does.
 * Break this catches: the menu also opened a floating copy of the form beside the Pages panel, so two
 * "Edit page" panels showed at once and the floating one covered the header at narrow widths.
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';
import { PageMenuItem } from '../../PageMenuItem';

const controls = createAppBuilderControls();
const HOME = { id: 'home-1', handle: 'home', name: 'Home', type: 'default', components: {} };

beforeEach(() => {
  controls.observers.install();
  const s = useStore.getState();
  act(() => {
    s.initializeDependencySlice('canvas');
    s.setPages([HOME], 'canvas');
    s.setCurrentPageId('home-1', 'canvas');
    s.setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'home-1', slug: 'slug-app-1' }, 'canvas');
    s.setPageSettings(s.computePageSettings({}), 'canvas');
    s.setActiveRightSideBarTab(null);
    s.setRightSidebarOpen(false);
  });
});

afterEach(() => controls.restore());

test('"Edit page details" opens the docked Edit page panel and no floating copy', () => {
  const { container, unmount } = render(
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <PageMenuItem page={HOME} darkMode={false} />
    </ModuleProvider>
  );

  const buttons = container.querySelectorAll('.action-btn-wrapper .icon-btn');
  fireEvent.click(buttons[buttons.length - 1]);
  fireEvent.click(screen.getByText('Edit page details'));

  const state = useStore.getState();
  expect(state.editingPage?.id).toBe('home-1');
  expect(state.newPagePopupConfig).toMatchObject({ mode: 'edit', type: 'default' });
  expect(state.activeRightSideBarTab).toBe(RIGHT_SIDE_BAR_TAB.PAGE_CONFIGURATION);
  expect(state.isRightSidebarOpen).toBe(true);
  expect(document.querySelector('#add-new-page-popup')).toBeNull();
  unmount();
});
