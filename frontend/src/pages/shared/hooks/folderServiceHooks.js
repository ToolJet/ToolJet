import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { handleHttpErrorMessages } from '@/_helpers/utils';
import { folderService } from '@/_services/folder.service';
import { authenticationService } from '@/_services/authentication.service';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

const defaultFolder = (appType) => ({
  label: `All ${appType === 'workflow' ? 'workflows' : 'applications'}`,
  value: 'all',
});

const selectFolders = (appType) => (raw) => {
  const formattedFolderList =
    raw?.folders?.map((folder) => ({ label: folder.name, value: folder.id, count: folder.count })) || [];

  return [defaultFolder(appType), ...formattedFolderList];
};

export function useFetchFolders(queryParams, options) {
  const { searchKey = '', appType = 'front-end' } = queryParams;
  const { enabled = true } = options; // TODO: remove this later on if not required

  return useQuery({
    queryKey: ['folders', { searchKey, appType }],
    queryFn: () => folderService.getAll(searchKey, appType),
    select: selectFolders(appType),
    enabled,
    staleTime: Infinity,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, appType }) => folderService.create(name, appType),
    onError: (error) => {
      handleHttpErrorMessages(error, 'folder');
    },
    onSuccess: (response) => {
      toast.success('Folder created.');
      queryClient.invalidateQueries({ queryKey: ['folders'] });

      posthogHelper.captureEvent('create_folder', {
        workspace_id:
          authenticationService?.currentUserValue?.organization_id ||
          authenticationService?.currentSessionValue?.current_organization_id,
        folder_id: response?.id,
      });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
  const [setSearchParams] = useSearchParams();

  return useMutation({
    mutationFn: ({ name, folderId }) => folderService.updateFolder(name, folderId),
    onError: (error) => {
      handleHttpErrorMessages(error, 'folder');
    },
    onSuccess: (response, variables) => {
      toast.success('Folder has been updated.');

      setSearchParams({ folder: variables.name }); // TODO: Should we reset pagination??
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  const [setSearchParams] = useSearchParams();

  return useMutation({
    mutationFn: (folderId) => folderService.deleteFolder(folderId),
    onError: (error) => {
      toast.error(error?.error ?? '');
    },
    onSuccess: () => {
      toast.success('Folder has been deleted.');

      setSearchParams(undefined); // TODO: Navigate to all folder, Should we reset pagination??
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
  });
}

export function useAddAppToFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appId, folderId }) => folderService.addToFolder(appId, folderId),
    onError: (error) => {
      toast.error(error?.error ?? '');
    },
    onSuccess: (response, variables) => {
      toast.success('Added to folder.');

      queryClient.invalidateQueries({ queryKey: ['folders'] });
      // TODO: Reset pagination??
      posthogHelper.captureEvent('click_add_to_folder_button', {
        workspace_id:
          authenticationService?.currentUserValue?.organization_id ||
          authenticationService?.currentSessionValue?.current_organization_id,
        app_id: variables?.appId,
        folder_id: variables?.folderId,
      });
    },
  });
}

export function useRemoveAppFromFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ appId, folderId }) => folderService.removeAppFromFolder(appId, folderId),
    onError: (error) => {
      toast.error(error?.error ?? '');
    },
    onSuccess: (response, variables) => {
      toast.success('Removed from folder.');

      queryClient.invalidateQueries({ queryKey: ['folders'] });
      // TODO: Reset pagination??
    },
  });
}
