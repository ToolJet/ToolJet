import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { globalDatasourceService } from '@/_services/globalDatasource.service';

import DataSourceBulkFolderActionDialog from '../DataSourceBulkFolderActionDialog';

const mockClearSelection = jest.fn();

jest.mock('@/_services/globalDatasource.service', () => ({
  globalDatasourceService: { bulkMoveDataSources: jest.fn(), bulkRemoveDataSources: jest.fn() },
}));
jest.mock('@/_services/dataSourceFolder.service', () => ({
  dataSourceFolderService: {
    getFolders: jest.fn(() => Promise.resolve({ folders: [{ id: 'f-9', name: 'Billing' }] })),
  },
}));
jest.mock('@/_stores/workspaceBranchesStore', () => ({
  useWorkspaceBranchesStore: (selector) => selector({ activeBranchId: 'b-1' }),
}));
jest.mock('@/_stores/dataSourcesDashboardStore', () => ({
  useDataSourcesDashboardStore: (selector) => selector({ clearSelection: mockClearSelection }),
}));
jest.mock('@/_helpers/appUtils', () => ({ getSvgIcon: () => null }));
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));
// A plain list stands in for the Combobox popup: picking an option is all this spec needs.
jest.mock('@/components/ui/Rocket/Combobox/Combobox', () => ({
  Combobox: ({ items, onValueChange }) => (
    <ul aria-label="Folders">
      {items.map((item) => (
        <li key={item.value}>
          <button type="button" onClick={() => onValueChange(item)}>
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  ),
  ComboboxInput: () => null,
  ComboboxContent: () => null,
  ComboboxList: () => null,
  ComboboxItem: () => null,
}));

const ROW_IDS = ['data_source:d-1', 'data_source:d-2'];
const onClose = jest.fn();

const renderDialog = (action) => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false }, queries: { retry: false } } });
  queryClient.setQueryData(['dataSourcesV2', { pageNo: 1 }], {
    items: [
      {
        kind: 'data_source',
        id: 'd-1',
        name: 'orders_db',
        data_source_kind: 'postgresql',
        folder: { id: 'f-1', name: 'Core' },
      },
      { kind: 'data_source', id: 'd-2', name: 'users_db', data_source_kind: 'postgresql', folder: null },
    ],
    folder: null,
  });
  render(
    <QueryClientProvider client={queryClient}>
      <DataSourceBulkFolderActionDialog open action={action} selectedRowIds={ROW_IDS} onClose={onClose} />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DataSourceBulkFolderActionDialog', () => {
  test('lists the data sources with their folders and moves them once a folder is picked', async () => {
    globalDatasourceService.bulkMoveDataSources.mockResolvedValue({ blocked_ids: [] });
    renderDialog('move');

    expect(screen.getByText('orders_db')).toBeInTheDocument();
    expect(screen.getByText('Core')).toBeInTheDocument();
    expect(screen.getByText('No folder')).toBeInTheDocument();
    const submit = screen.getByRole('button', { name: 'Move datasources' });
    expect(submit).toBeDisabled();

    await userEvent.click(await screen.findByRole('button', { name: 'Billing' }));
    await userEvent.click(submit);

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('2 datasources moved to Billing.'));
    expect(globalDatasourceService.bulkMoveDataSources).toHaveBeenCalledWith({
      dataSourceIds: ['d-1', 'd-2'],
      folderId: 'f-9',
      branchId: 'b-1',
    });
    expect(mockClearSelection).toHaveBeenCalled();
  });

  test('drops a data source from the dialog only', async () => {
    globalDatasourceService.bulkRemoveDataSources.mockResolvedValue({ blocked_ids: [] });
    renderDialog('remove');

    await userEvent.click(screen.getByRole('button', { name: 'Remove users_db from the list' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove from folder' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('1 datasource removed from folder.'));
    expect(globalDatasourceService.bulkRemoveDataSources).toHaveBeenCalledWith({
      dataSourceIds: ['d-1'],
      branchId: 'b-1',
    });
  });

  test('shows blocked data sources and removes the rest', async () => {
    globalDatasourceService.bulkRemoveDataSources
      .mockResolvedValueOnce({ blocked_ids: ['d-1'] })
      .mockResolvedValueOnce({ blocked_ids: [] });
    renderDialog('remove');

    await userEvent.click(screen.getByRole('button', { name: 'Remove from folder' }));
    expect(await screen.findByText("1 of 2 datasources can't be removed")).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Remove remaining (1)' }));
    await waitFor(() =>
      expect(globalDatasourceService.bulkRemoveDataSources).toHaveBeenLastCalledWith({
        dataSourceIds: ['d-2'],
        branchId: 'b-1',
      })
    );
  });
});
