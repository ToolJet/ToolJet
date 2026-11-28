/**
 * The query editor's header is the shared 48px panel header: the query name is its title, Run and
 * Preview sit beside the close button, and Setup, Transformation and Settings sit in a tab strip
 * below it that the keyboard reaches with Tab and moves through with the arrow keys.
 */
import React, { useState } from 'react';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';
import { QueryManagerHeader } from '@/AppBuilder/QueryManager/Components/QueryManagerHeader';
import { ModuleProvider } from '@/AppBuilder/_contexts/ModuleContext';
import { getPanelCloseLabel } from '@/AppBuilder/panelLayout';

const scenario = defineAppBuilderScenario({
  id: 'query-header-panel-header',
  name: 'Query editor header on the panel header',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: { observers: true },
});

const QUERY = { id: 'q1', name: 'restapi1', kind: 'restapi', options: {} };

const Harness = () => {
  const [activeTab, setActiveTab] = useState(1);
  return (
    <ModuleProvider moduleId="canvas" isModuleMode={false}>
      <QueryManagerHeader darkMode={false} activeTab={activeTab} setActiveTab={setActiveTab} />
    </ModuleProvider>
  );
};

let session;

const renderHeader = async () => {
  session = new AppBuilderTestSession({ scenario });
  await session.store.act((state) => {
    state.dataQuery.setQueries([QUERY]);
    state.queryPanel.setSelectedQuery(QUERY.id);
    state.queryPanel.setSelectedDataSource({ id: 'restapi', kind: 'restapi', name: 'restapidefault' });
  });
  await session.store.act('setActiveRightSideBarTab', 'query');
  await session.store.act('setRightSidebarOpen', true);
  const user = userEvent.setup();
  session.render(<Harness />);
  return { user, header: document.querySelector('.tj-panel-header') };
};

// Break this catches: the query header hand-rolls its own 80px grid instead of the panel header,
// or Run and Preview drift back out of the tabs row.
test('renders the query name and close button in the panel header, with Run and Preview in the tabs row', async () => {
  const { header } = await renderHeader();
  const tabsRow = document.querySelector('.query-manager-tabs-row');

  expect(header).not.toBeNull();
  expect(within(header).getByText('restapi1')).toBeInTheDocument();
  expect(within(tabsRow).getByRole('button', { name: 'Run query' })).toBeInTheDocument();
  expect(within(tabsRow).getByRole('button', { name: /Preview/ })).toBeInTheDocument();
  expect(within(header).queryByRole('button', { name: 'Run query' })).toBeNull();
  expect(within(header).getByRole('button', { name: getPanelCloseLabel('query') })).toHaveAttribute(
    'data-cy',
    'query-configuration-close-button'
  );
});

// Break this catches: the close button stops closing the right panel once it moves into the header.
test('closes the query panel from the header', async () => {
  const { user, header } = await renderHeader();

  await user.click(within(header).getByRole('button', { name: getPanelCloseLabel('query') }));

  expect(session.store.read((state) => state.isRightSidebarOpen)).toBe(false);
  expect(session.store.read((state) => state.activeRightSideBarTab)).toBeNull();
});

// Break this catches: the tabs fall back to clickable paragraphs the keyboard cannot reach.
test('puts the query tabs below the header, reachable with Tab and switched with the arrow keys', async () => {
  const { user, header } = await renderHeader();
  const tablist = screen.getByRole('tablist');
  const tab = (name) => within(tablist).getByRole('tab', { name });

  expect(header.contains(tablist)).toBe(false);
  expect(tab('Setup')).toHaveAttribute('data-cy', 'query-tab-setup');
  expect(tab('Transformation')).toHaveAttribute('data-cy', 'query-tab-transformation');
  expect(tab('Settings')).toHaveAttribute('data-cy', 'query-tab-settings');
  expect(tab('Transformation')).toHaveAttribute('tabindex', '-1');

  // One Tab stop for the strip: from the header's last control, Tab lands on the active tab.
  within(header)
    .getByRole('button', { name: getPanelCloseLabel('query') })
    .focus();
  await user.tab();
  expect(tab('Setup')).toHaveFocus();

  await user.keyboard('{ArrowRight}');
  expect(tab('Transformation')).toHaveAttribute('aria-selected', 'true');
  expect(tab('Transformation')).toHaveFocus();

  await user.keyboard('{End}');
  expect(tab('Settings')).toHaveAttribute('aria-selected', 'true');
  await user.keyboard('{ArrowRight}');
  expect(tab('Setup')).toHaveAttribute('aria-selected', 'true');
  expect(tab('Setup')).toHaveAttribute('tabindex', '0');
});
