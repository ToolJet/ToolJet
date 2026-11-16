// "Create new table" is disabled outside Development; a user blocked by the environment is told
// why. A user who lacks the TJDB permission is blocked for a different reason and is not.
import '@/test/setupMsw';
import React from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { render, screen, act } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TooljetDatabaseContext } from '@/TooljetDatabase';
import { BreadCrumbContext } from '@/App/App';
import CreateTableDrawer from '@/TooljetDatabase/Drawers/CreateTableDrawer';
import { SCHEMA_ENV_TOOLTIP } from '@/TooljetDatabase/constants';

// jsdom has no layout, so focus-trap finds no tabbable node and throws. External adapter, not product logic.
jest.mock(
  'focus-trap-react',
  () =>
    ({ children }) =>
      children
);

function renderDrawer({ canEditTjdb, canEditSchema }) {
  server.use(
    http.get('*/tooljet-db/tables/limits/:organizationId', () =>
      HttpResponse.json({ tablesCount: { current: 1, total: 10 } })
    )
  );
  return render(
    <BreadCrumbContext.Provider value={{ updateSidebarNAV: () => {} }}>
      <TooljetDatabaseContext.Provider
        value={{
          organizationId: 'org-1',
          tables: [],
          setTables: () => {},
          setSelectedTable: () => {},
          canEditTjdb,
          canEditSchema,
        }}
      >
        <CreateTableDrawer
          bannerVisible={false}
          setBannerVisible={() => {}}
          tablesLimit={{ current: 1, total: 10 }}
          setTablesLimit={() => {}}
        />
      </TooljetDatabaseContext.Provider>
    </BreadCrumbContext.Provider>
  );
}

// A disabled button swallows mouse events, so the hover target is the button's own wrapper.
const hoverCreateButton = async () =>
  userEvent.hover((await screen.findByRole('button', { name: 'Create new table' })).parentElement);

// The tooltip opens after a short hover delay, so "never shows" can only be asserted after waiting it out.
const waitForTooltipDelay = () => act(() => new Promise((resolve) => setTimeout(resolve, 300)));

describe('CreateTableDrawer', () => {
  test('should explain the Development-only rule on the disabled button when the environment is the blocker', async () => {
    renderDrawer({ canEditTjdb: true, canEditSchema: false });

    await hoverCreateButton();

    expect(await screen.findByText(SCHEMA_ENV_TOOLTIP)).toBeInTheDocument();
  });

  test('should not show the environment tooltip when the user lacks TJDB permission', async () => {
    renderDrawer({ canEditTjdb: false, canEditSchema: false });

    await hoverCreateButton();
    await waitForTooltipDelay();

    expect(screen.queryByText(SCHEMA_ENV_TOOLTIP)).not.toBeInTheDocument();
  });
});
