/**
 * Which rail items show for an app's build mode and plan.
 * - LP-M05: a React builder (Code mode) app has no visual canvas, so its rail shows no Pages or
 *   Components item (main's rail never had them). Queries stay, as main keeps the query pane.
 * - No Style item: product decided there is no Style panel (reverses LP-M11).
 * - LP-M08: App history shows on every plan; below Pro it carries the upgrade note.
 */
import React from 'react';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BaseLeftSidebar } from '@/AppBuilder/LeftSidebar/LeftSidebar';
import useStore from '@/AppBuilder/_stores/store';
import { seedApp } from '@/test/app-builder';
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

// Break this catches: the removed Style item (product decided there is no Style panel) comes back. A React
// builder app opens its properties from a selection on the canvas only.
test.each(['code', 'visual'])('a %s app has no Style item on the rail', (buildMode) => {
  setup(buildMode);

  expect(screen.queryByRole('button', { name: 'Style inspector' })).toBeNull();
  expect(railItem('style-inspector')).toBeNull();
});

// Break this catches (LP-M08): below Pro the App history item disappears, and with it the upgrade prompt.
eeTest('App history shows below Pro, with the upgrade note', async () => {
  setup('visual', { featureAccess: { appHistory: false } });

  const item = railItem('app-history');
  expect(item).toBeInTheDocument();

  await userEvent.hover(item);

  expect(await screen.findByText('App history · Available on Pro and above')).toBeInTheDocument();
});
