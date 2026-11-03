import { toast } from 'react-hot-toast';
import { capitalize } from 'lodash';
// eslint-disable-next-line import/no-unresolved
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { handleHttpErrorMessages } from '@/_helpers/utils';
import { folderService } from '@/_services/folder.service';
import { authenticationService } from '@/_services/authentication.service';
import { useAppsStore } from '@/_stores/appsStore';
import posthogHelper from '@/modules/common/helpers/posthogHelper';
import { appTypeToDisplayNameMapping } from '@/pages/AppsDashboard/helper';

const selectFolders = (raw) => {
  const formattedFolderList =
    raw?.folders?.map((folder) => ({
      label: folder.name,
      value: folder.id,
      count: folder.count,
      createdBy: folder.created_by,
    })) || [];

  return formattedFolderList;
};

export function useFetchFolders(queryParams) {
  const { appSearchQuery = '', appType = 'front-end' } = queryParams;

  return useQuery({
    queryKey: ['folders', { appSearchQuery, appType }],
    queryFn: () => folderService.getAll(appSearchQuery, appType),
    select: selectFolders,
    // staleTime: Infinity,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);

  return useMutation({
    mutationFn: ({ name, appType }) => folderService.create(name, appType),
    onError: (error) => {
      handleHttpErrorMessages(error, 'folder');
    },
    onSuccess: (response, variables) => {
      toast.success('Folder created.');

      posthogHelper.captureEvent('create_folder', {
        workspace_id:
          authenticationService?.currentUserValue?.organization_id ||
          authenticationService?.currentSessionValue?.current_organization_id,
        folder_id: response?.id,
      });

      queryClient.invalidateQueries({ queryKey: ['appsV2', { appType: variables.appType }] });

      setCurrentPage(1);
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, folderId }) => folderService.updateFolder(name, folderId),
    onError: (error) => {
      handleHttpErrorMessages(error, 'folder');
    },
    onSuccess: (response, variables) => {
      toast.success('Folder has been updated.');

      queryClient.invalidateQueries({ queryKey: ['appsV2', { appType: variables.appType }] });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);

  return useMutation({
    mutationFn: ({ folderId }) => folderService.deleteFolder(folderId),
    onSuccess: (response, variables) => {
      toast.success('Folder has been deleted.');

      queryClient.invalidateQueries({ queryKey: ['appsV2', { appType: variables.appType }] });

      setCurrentPage(1);
    },
  });
}

export function useAddAppToFolder() {
  const queryClient = useQueryClient();

  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);

  return useMutation({
    mutationFn: ({ appId, folderId }) => folderService.addToFolder(appId, folderId),
    onError: (error) => {
      toast.error(error?.error ?? '');
    },
    onSuccess: (response, variables) => {
      setCurrentPage(1);

      toast.success(`${capitalize(appTypeToDisplayNameMapping[variables.appType])} added to folder successfully!`);

      posthogHelper.captureEvent('click_add_to_folder_button', {
        workspace_id:
          authenticationService?.currentUserValue?.organization_id ||
          authenticationService?.currentSessionValue?.current_organization_id,
        app_id: variables?.appId,
        folder_id: variables?.folderId,
      });

      queryClient.invalidateQueries({ queryKey: ['appsV2', { appType: variables.appType }] });
    },
  });
}

export function useRemoveAppFromFolder() {
  const queryClient = useQueryClient();

  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);

  return useMutation({
    mutationFn: ({ appId, folderId }) => folderService.removeAppFromFolder(appId, folderId),
    onError: (error) => {
      toast.error(error?.error ?? '');
    },
    onSuccess: (response, variables) => {
      setCurrentPage(1);

      toast.success(`${capitalize(appTypeToDisplayNameMapping[variables.appType])} removed from folder successfully!`);

      queryClient.invalidateQueries({ queryKey: ['appsV2', { appType: variables.appType }] });
    },
  });
}
