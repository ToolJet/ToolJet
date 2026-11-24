/**
 * Which rail items show for an app's build mode and plan.
 * - LP-M05: a React builder (Code mode) app has no visual canvas, so its rail shows no Pages or
 *   Components item (main's rail never had them). Queries stay, as main keeps the query pane.
 * - LP-M11: a React builder app gets its Style inspector item, the inspector's one entry point.
 * - LP-M08: App history shows on every plan; below Pro it carries the upgrade note.
 */
import React from 'react';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BaseLeftSidebar } from '@/AppBuilder/LeftSidebar/LeftSidebar';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';
import { RIGHT_SIDE_BAR_TAB } from '@/AppBuilder/RightSideBar/rightSidebarConstants';
import { createAppBuilderControls } from '@/test/app-builder/controls';
import { render } from '@/test/test-utils';

const controls = createAppBuilderControls();
const railItem = (cy) => document.querySelector(`[data-cy="left-sidebar-${cy}-button"]`);

const eeTest = process.env.TOOLJET_EDITION === 'ee' ? test : test.skip;

const setup = (buildMode, license) => {
  controls.observers.install();
  seedApp({});
  act(() => {
    useStore.getState().setApp({ appId: 'app-1', appName: 'Test app', homePageId: 'page-1', buildMode });
    useStore.getState().setCurrentMode('edit', 'canvas');
    useStore.getState().toggleLeftSidebar(false);
    if (license) useStore.setState((state) => void (state.license = license));
  });
  render(<BaseLeftSidebar />);
};

afterEach(() => controls.restore());

// Break this catches: the React builder rail offers the widget palette, so a drop turns the app visual.
test('a React builder app shows no Pages or Components rail item', () => {
  setup('code');

  expect(railItem('pages')).toBeNull();
  expect(railItem('components')).toBeNull();
  expect(railItem('queries')).toBeInTheDocument();
});

// Break this catches: the gate hides the items from visual apps too.
test('a visual app keeps its Pages and Components rail items', () => {
  setup('visual');

  expect(railItem('pages')).toBeInTheDocument();
  expect(railItem('components')).toBeInTheDocument();
});

// Break this catches (LP-M11): the redesign dropped the right rail, the style inspector's only entry point.
test('a React builder app shows a Style inspector item that opens the inspector', () => {
  setup('code');

  const item = screen.getByRole('button', { name: 'Style inspector' });
  expect(item).toHaveAttribute('aria-pressed', 'false');

  fireEvent.click(item);

  expect(useStore.getState().isRightSidebarOpen).toBe(true);
  expect(screen.getByRole('button', { name: 'Style inspector' })).toHaveAttribute('aria-pressed', 'true');
});

// Break this catches (review B2): with the query editor in the right panel, Style reads as active and its
// click closes the query editor instead of opening the inspector.
test('with the query editor open on the right, Style opens the inspector instead of closing the panel', () => {
  setup('code');
  act(() => {
    useStore.getState().setActiveRightSideBarTab(RIGHT_SIDE_BAR_TAB.QUERY);
    useStore.getState().setRightSidebarOpen(true);
  });

  const item = screen.getByRole('button', { name: 'Style inspector' });
  expect(item).toHaveAttribute('aria-pressed', 'false');

  fireEvent.click(item);

  expect(useStore.getState().isRightSidebarOpen).toBe(true);
  expect(useStore.getState().activeRightSideBarTab).toBe(RIGHT_SIDE_BAR_TAB.CONFIGURATION);
  expect(screen.getByRole('button', { name: 'Style inspector' })).toHaveAttribute('aria-pressed', 'true');
});

test('a visual app has no Style inspector item', () => {
  setup('visual');

  expect(screen.queryByRole('button', { name: 'Style inspector' })).toBeNull();
});

// Break this catches (LP-M08): below Pro the App history item disappears, and with it the upgrade prompt.
eeTest('App history shows below Pro, with the upgrade note', async () => {
  setup('visual', { featureAccess: { appHistory: false } });

  const item = railItem('app-history');
  expect(item).toBeInTheDocument();

  await userEvent.hover(item);

  expect(await screen.findByText('App history · Available on Pro and above')).toBeInTheDocument();
});
