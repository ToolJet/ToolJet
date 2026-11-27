import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { globalDatasourceService } from '@/_services/globalDatasource.service';

import DataSourceBulkDeleteDialog from '../DataSourceBulkDeleteDialog';

const mockClearSelection = jest.fn();

jest.mock('@/_services/globalDatasource.service', () => ({
  globalDatasourceService: { bulkDeleteDataSources: jest.fn(), bulkDeleteDataSourceFolders: jest.fn() },
}));
jest.mock('@/_stores/workspaceBranchesStore', () => ({
  useWorkspaceBranchesStore: (selector) => selector({ activeBranchId: 'b-1' }),
}));
jest.mock('@/_stores/dataSourcesDashboardStore', () => ({
  useDataSourcesDashboardStore: (selector) => selector({ clearSelection: mockClearSelection }),
}));
jest.mock('@/_helpers/appUtils', () => ({ getSvgIcon: () => null }));
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const ROW_IDS = ['data_source:d-1', 'data_source:d-2', 'data_source:d-3'];
const onClose = jest.fn();

const renderDialog = ({ kind = 'data_source', selectedRowIds = ROW_IDS } = {}) => {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  // The blocked list names rows from the loaded list pages.
  queryClient.setQueryData(['dataSourcesV2', { pageNo: 1 }], {
    items: [{ kind: 'data_source', id: 'd-2', name: 'users_db', data_source_kind: 'postgresql', folder: null }],
    folder: null,
  });
  jest.spyOn(queryClient, 'invalidateQueries');
  render(
    <QueryClientProvider client={queryClient}>
      <DataSourceBulkDeleteDialog open kind={kind} selectedRowIds={selectedRowIds} onClose={onClose} />
    </QueryClientProvider>
  );
  return queryClient;
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DataSourceBulkDeleteDialog', () => {
  test('deletes every selected data source, then closes and clears the selection', async () => {
    globalDatasourceService.bulkDeleteDataSources.mockResolvedValue({ blocked_ids: [] });
    const queryClient = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Delete datasources' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(globalDatasourceService.bulkDeleteDataSources).toHaveBeenCalledWith({
      dataSourceIds: ['d-1', 'd-2', 'd-3'],
      branchId: 'b-1',
    });
    expect(toast.success).toHaveBeenCalledWith('3 datasources deleted.');
    expect(mockClearSelection).toHaveBeenCalled();
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dataSourcesV2'] });
  });

  test('lists blocked data sources and resends only the rest', async () => {
    globalDatasourceService.bulkDeleteDataSources
      .mockResolvedValueOnce({ blocked_ids: ['d-2'] })
      .mockResolvedValueOnce({ blocked_ids: [] });
    const queryClient = renderDialog();

    await userEvent.click(screen.getByRole('button', { name: 'Delete datasources' }));

    expect(await screen.findByText("1 of 3 datasources can't be deleted")).toBeInTheDocument();
    expect(screen.getByText('users_db')).toBeInTheDocument();
    // A blocked call wrote nothing, so the list doesn't refetch yet.
    expect(queryClient.invalidateQueries).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Delete remaining (2)' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('2 datasources deleted.'));
    expect(globalDatasourceService.bulkDeleteDataSources).toHaveBeenLastCalledWith({
      dataSourceIds: ['d-1', 'd-3'],
      branchId: 'b-1',
    });
  });

  test('offers only Cancel when every data source is blocked', async () => {
    globalDatasourceService.bulkDeleteDataSources.mockResolvedValue({ blocked_ids: ['d-1'] });
    renderDialog({ selectedRowIds: ['data_source:d-1'] });

    await userEvent.click(screen.getByRole('button', { name: 'Delete datasource' }));

    expect(await screen.findByText("1 of 1 datasource can't be deleted")).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Delete remaining/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('deletes folders only, moving their data sources to root', async () => {
    globalDatasourceService.bulkDeleteDataSourceFolders.mockResolvedValue({ blocked_ids: [] });
    renderDialog({ kind: 'folder', selectedRowIds: ['folder:f-1', 'folder:f-2'] });

    await userEvent.click(screen.getByRole('button', { name: 'Delete folders' }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('2 folders deleted.'));
    expect(globalDatasourceService.bulkDeleteDataSourceFolders).toHaveBeenCalledWith({
      folderIds: ['f-1', 'f-2'],
      mode: 'folder_only',
      branchId: 'b-1',
    });
  });
});
