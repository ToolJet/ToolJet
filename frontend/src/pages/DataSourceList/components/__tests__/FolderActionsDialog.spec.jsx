import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { dataSourceFolderService } from '@/_services/dataSourceFolder.service';
import { useDataSourcesDashboardStore } from '@/_stores/dataSourcesDashboardStore';

import FolderActionsDialog from '../FolderActionsDialog';

jest.mock('@/_services/dataSourceFolder.service', () => ({
  dataSourceFolderService: { createFolder: jest.fn(), renameFolder: jest.fn(), deleteFolder: jest.fn() },
}));
jest.mock('@/_stores/workspaceBranchesStore', () => ({
  useWorkspaceBranchesStore: (selector) => selector({ orgGitConfig: { default_git_branch: 'main' } }),
}));
jest.mock('react-hot-toast', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const openDialog = (state) => useDataSourcesDashboardStore.getState().setFolderDialogState(state);
const currentType = () => useDataSourcesDashboardStore.getState().folderDialogState.type;

let queryClient;
const renderDialog = () => {
  queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  jest.spyOn(queryClient, 'invalidateQueries');
  return render(
    <QueryClientProvider client={queryClient}>
      <FolderActionsDialog open />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  useDataSourcesDashboardStore.getState().resetFolderDialogState();
});

describe('data source FolderActionsDialog', () => {
  describe('create folder', () => {
    beforeEach(() => openDialog({ type: 'create-folder' }));

    test('keeps the submit button off until a name is typed', async () => {
      renderDialog();
      const submit = screen.getByRole('button', { name: 'Create folder' });
      expect(submit).toBeDisabled();

      await userEvent.type(screen.getByLabelText('Folder name'), 'Core databases');
      expect(submit).toBeEnabled();
    });

    test('creates the folder with a trimmed, single-spaced name, then refetches the list and closes', async () => {
      dataSourceFolderService.createFolder.mockResolvedValue({});
      renderDialog();

      await userEvent.type(screen.getByLabelText('Folder name'), '  Core   databases ');
      await userEvent.click(screen.getByRole('button', { name: 'Create folder' }));

      await waitFor(() => expect(currentType()).toBe(''));
      expect(dataSourceFolderService.createFolder).toHaveBeenCalledWith('Core databases');
      expect(toast.success).toHaveBeenCalledWith('Folder created successfully!');
      expect(queryClient.invalidateQueries).toHaveBeenCalledWith({ queryKey: ['dataSourcesV2'] });
    });

    test('stays open when the request fails', async () => {
      dataSourceFolderService.createFolder.mockRejectedValue({ statusCode: 409, error: 'Folder exists' });
      renderDialog();

      await userEvent.type(screen.getByLabelText('Folder name'), 'Core');
      await userEvent.click(screen.getByRole('button', { name: 'Create folder' }));

      await waitFor(() => expect(dataSourceFolderService.createFolder).toHaveBeenCalled());
      expect(currentType()).toBe('create-folder');
    });
  });

  describe('rename folder', () => {
    beforeEach(() => openDialog({ type: 'rename-folder', folderDetails: { id: 'f-1', name: 'Core' } }));

    test('is pre-filled and disabled while the name is unchanged', () => {
      renderDialog();
      expect(screen.getByLabelText('Folder name')).toHaveValue('Core');
      expect(screen.getByRole('button', { name: 'Rename folder' })).toBeDisabled();
    });

    test('renames the folder by id', async () => {
      dataSourceFolderService.renameFolder.mockResolvedValue({});
      renderDialog();

      await userEvent.type(screen.getByLabelText('Folder name'), ' 2');
      await userEvent.click(screen.getByRole('button', { name: 'Rename folder' }));

      await waitFor(() => expect(currentType()).toBe(''));
      expect(dataSourceFolderService.renameFolder).toHaveBeenCalledWith('Core 2', 'f-1');
      expect(toast.success).toHaveBeenCalledWith('Folder renamed successfully!');
    });
  });

  describe('delete folder', () => {
    beforeEach(() => openDialog({ type: 'delete-folder', folderDetails: { id: 'f-1', name: 'Core' } }));

    test('deletes the folder after confirming', async () => {
      dataSourceFolderService.deleteFolder.mockResolvedValue({});
      renderDialog();

      expect(screen.getByText('Delete folder "Core"')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Delete folder' }));

      await waitFor(() => expect(currentType()).toBe(''));
      expect(dataSourceFolderService.deleteFolder).toHaveBeenCalledWith('f-1');
      expect(toast.success).toHaveBeenCalledWith('Folder deleted successfully!');
    });

    test('shows the branches that still hold data sources when the server refuses', async () => {
      dataSourceFolderService.deleteFolder.mockRejectedValue({
        statusCode: 400,
        error: JSON.stringify({ message: 'blocked', branches: ['main', 'feature-x'] }),
      });
      renderDialog();

      await userEvent.click(screen.getByRole('button', { name: 'Delete folder' }));

      expect(await screen.findByText('Folder with data sources cannot be deleted')).toBeInTheDocument();
      expect(screen.getByText('main', { selector: 'li' })).toBeInTheDocument();
      expect(screen.getByText('feature-x')).toBeInTheDocument();
      expect(toast.error).not.toHaveBeenCalled();

      await userEvent.click(screen.getByRole('button', { name: 'I understand' }));
      expect(currentType()).toBe('');
    });

    test('toasts the message for any other failure and keeps the dialog', async () => {
      dataSourceFolderService.deleteFolder.mockRejectedValue({ statusCode: 403, error: 'Not allowed' });
      renderDialog();

      await userEvent.click(screen.getByRole('button', { name: 'Delete folder' }));

      await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Not allowed'));
      expect(currentType()).toBe('delete-folder');
    });
  });
});
