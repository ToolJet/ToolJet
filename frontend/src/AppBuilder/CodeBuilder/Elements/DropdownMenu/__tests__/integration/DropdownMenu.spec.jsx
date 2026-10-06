import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import useStore from '@/AppBuilder/_stores/store';
import { DropdownMenu } from '../../DropdownMenu';
import { AppBuilderTestSession, defineAppBuilderScenario } from '@/test/app-builder';

const scenario = defineAppBuilderScenario({
  id: 'dropdown-menu-add-new-query-portal-click',
  name: 'DropdownMenu add-new-query portal click',
  primarySeam: 'rtl',
  surface: 'app-editor',
  edition: 'ce',
  environment: 'development',
  layout: 'desktop',
  version: 'draft',
  transferPath: 'not-applicable',
  access: 'authenticated',
  capabilities: {
    network: [
      {
        method: 'get',
        url: 'http://localhost:3000/api/data-sources/:org/environments/:env/versions/:version',
        json: { data_sources: [{ id: 'ds-rest-1', name: 'rest api 1', kind: 'restapi', type: 'local' }] },
      },
      {
        method: 'post',
        url: 'http://localhost:3000/api/data-queries/data-sources/:dataSourceId/versions/:versionId',
        json: { id: 'query-created-1', name: 'rest api 1' },
      },
    ],
  },
});

describe('DropdownMenu: "Add new query" datasource popover', () => {
  let session;

  beforeEach(() => {
    session = new AppBuilderTestSession({ scenario });
  });

  // Break this catches: the outer click-outside handler (DropdownMenu.jsx) treats any
  // click inside the react-bootstrap-portaled "Add new query" datasource popover as a
  // click outside the dropdown, closing (unmounting) the whole menu on mousedown before
  // the datasource item's own click handler can run — so picking a datasource silently
  // creates no query instead of adding one.
  test('selecting a datasource from the popover creates a query', async () => {
    await session.store.act('fetchGlobalDataSources', 'org-1', 'version-1', 'env-1');
    await waitFor(() => expect(useStore.getState().globalDataSources).toHaveLength(1));

    session.render(<DropdownMenu value={null} onChange={jest.fn()} darkMode={false} meta={{ options: [] }} />);

    fireEvent.click(screen.getByRole('button', { name: /select a source/i }));

    const addNewQueryItem = (await screen.findByText('Add new query')).closest('.dropdown-menu-item');
    fireEvent.mouseEnter(addNewQueryItem);

    const datasourceButton = await screen.findByText('rest api 1');

    // A real click is mousedown -> mouseup -> click on the same target. The outer
    // dropdown's native `mousedown` listener on `document` runs first; reproducing the
    // race means firing both events, not just `click`.
    fireEvent.mouseDown(datasourceButton);
    fireEvent.click(datasourceButton);

    await waitFor(() => expect(useStore.getState().dataQuery.queries.modules.canvas).toHaveLength(1));
    expect(useStore.getState().dataQuery.queries.modules.canvas[0]).toMatchObject({ kind: 'restapi' });
  });
});
