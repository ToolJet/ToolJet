import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
// eslint-disable-next-line import/no-unresolved
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { handleHttpErrorMessages } from '@/_helpers/utils';
import { folderService } from '@/_services/folder.service';
import { authenticationService } from '@/_services/authentication.service';
import { useAppsStore } from '@/_stores/appsStore';
import { useAppsFilter } from '@/pages/shared/hooks/useAppsFilter';
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
  const { appSearchQuery = '', appType = 'front-end' } = queryParams;
  const { enabled = true } = options; // Will be required on modules page

  return useQuery({
    queryKey: ['folders', { appSearchQuery, appType }],
    queryFn: () => folderService.getAll('', appType),
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
    onSuccess: (response, variables) => {
      toast.success('Folder created.');
      queryClient.invalidateQueries({ queryKey: ['folders', { appType: variables.appType }] });

      posthogHelper.captureEvent('create_folder', {
        workspace_id:
          authenticationService?.currentUserValue?.organization_id ||
          authenticationService?.currentSessionValue?.current_organization_id,
        folder_id: response?.id,
      });
    },
  });
}

export function useUpdateFolder({ appType }) {
  const { setFilters } = useAppsFilter({ appType });
  const queryClient = useQueryClient();
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);

  // const [setSearchParams] = useSearchParams();

  return useMutation({
    mutationFn: ({ name, folderId }) => folderService.updateFolder(name, folderId),
    onError: (error) => {
      handleHttpErrorMessages(error, 'folder');
    },
    onSuccess: (response, variables) => {
      toast.success('Folder has been updated.');

      setCurrentPage(1);
      setFilters({ folderName: variables.name ?? '' });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      // setSearchParams({ folder: variables.name }); // TODO: Should we reset pagination??
    },
  });
}

export function useDeleteFolder({ appType }) {
  const { setFilters } = useAppsFilter({ appType });
  const queryClient = useQueryClient();
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);

  return useMutation({
    mutationFn: (folderId) => folderService.deleteFolder(folderId),
    onError: (error) => {
      toast.error(error?.error ?? '');
    },
    onSuccess: () => {
      toast.success('Folder has been deleted.');

      setCurrentPage(1);
      setFilters({ folderName: '' });
      queryClient.invalidateQueries({ queryKey: ['folders'] });

      // setSearchParams(undefined); // TODO: Navigate to all folder, Should we reset pagination??
    },
  });
}

export function useAddAppToFolder({ appType }) {
  const { folderId } = useAppsFilter({ appType });
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);

  return useMutation({
    mutationFn: ({ appId, folderId }) => folderService.addToFolder(appId, folderId),
    onError: (error) => {
      toast.error(error?.error ?? '');
    },
    onSuccess: (response, variables) => {
      toast.success('Added to folder.');

      if (folderId) {
        setCurrentPage(1);
      }

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

export function useRemoveAppFromFolder({ appType }) {
  const { folderId } = useAppsFilter({ appType });
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);

  return useMutation({
    mutationFn: ({ appId, folderId }) => folderService.removeAppFromFolder(appId, folderId),
    onError: (error) => {
      toast.error(error?.error ?? '');
    },
    onSuccess: () => {
      toast.success('Removed from folder.');

      if (folderId) {
        setCurrentPage(1);
      }
    },
  });
}
