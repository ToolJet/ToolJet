import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
// eslint-disable-next-line import/no-unresolved
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { handleHttpErrorMessages } from '@/_helpers/utils';
import { folderService } from '@/_services/folder.service';
import { authenticationService } from '@/_services/authentication.service';
import { useAppsStore } from '@/_stores/appsStore';
import { useSearchStore } from '@/_stores/searchStore';
import posthogHelper from '@/modules/common/helpers/posthogHelper';

const defaultFolder = (appType) => ({
  label: `All ${appType === 'front-end' ? 'applications' : `${appType}s`}`,
  value: 'all',
});

const selectFolders = (appType) => (raw) => {
  const formattedFolderList =
    raw?.folders?.map((folder) => ({
      label: folder.name,
      value: folder.id,
      count: folder.count,
      createdBy: folder.created_by,
    })) || [];

  return [defaultFolder(appType), ...formattedFolderList];
};

export function useFetchFolders(queryParams) {
  const { appSearchQuery = '', appType = 'front-end' } = queryParams;

  return useQuery({
    queryKey: ['folders', { appSearchQuery, appType }],
    queryFn: () => folderService.getAll(appSearchQuery, appType),
    select: selectFolders(appType),
    staleTime: Infinity,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  const [, setSearchParams] = useSearchParams();

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

      queryClient.invalidateQueries({ queryKey: ['folders', { appType: variables.appType }] });

      setCurrentPage(1);
      response?.name &&
        setSearchParams((prev) => {
          prev.set('folder', response.name);
          return prev;
        });
    },
  });
}

export function useUpdateFolder() {
  const queryClient = useQueryClient();
  const [, setSearchParams] = useSearchParams();

  return useMutation({
    mutationFn: ({ name, folderId }) => folderService.updateFolder(name, folderId),
    onError: (error) => {
      handleHttpErrorMessages(error, 'folder');
    },
    onSuccess: (response, variables) => {
      toast.success('Folder has been updated.');

      queryClient.invalidateQueries({ queryKey: ['folders', { appType: variables.appType }] });

      setSearchParams((prev) => {
        prev.set('folder', variables.name ?? '');
        return prev;
      });
    },
  });
}

export function useDeleteFolder() {
  const queryClient = useQueryClient();
  const [, setSearchParams] = useSearchParams();

  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);

  return useMutation({
    mutationFn: ({ folderId }) => folderService.deleteFolder(folderId),
    onError: (error) => {
      toast.error(error?.error ?? '');
    },
    onSuccess: (response, variables) => {
      toast.success('Folder has been deleted.');

      queryClient.invalidateQueries({ queryKey: ['folders', { appType: variables.appType }] });

      setCurrentPage(1);
      setSearchParams((prev) => {
        prev.delete('folder');
        return prev;
      });
    },
  });
}

export function useAddAppToFolder() {
  const queryClient = useQueryClient();

  const searchQuery = useSearchStore((state) => state.searchQuery);

  const pageSize = useAppsStore((state) => state.pageSize);
  const currentPage = useAppsStore((state) => state.currentPage);
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);
  const currentFolderId = useAppsStore((state) => state.currentFolderDetails?.value ?? '');

  return useMutation({
    mutationFn: ({ appId, folderId }) => folderService.addToFolder(appId, folderId),
    onError: (error) => {
      toast.error(error?.error ?? '');
    },
    onSuccess: (response, variables) => {
      toast.success('Application added to folder successfully!');

      posthogHelper.captureEvent('click_add_to_folder_button', {
        workspace_id:
          authenticationService?.currentUserValue?.organization_id ||
          authenticationService?.currentSessionValue?.current_organization_id,
        app_id: variables?.appId,
        folder_id: variables?.folderId,
      });

      queryClient.invalidateQueries({ queryKey: ['folders', { appType: variables.appType }] });

      // Case 1: if you are in All apps/modules/workflows folder, then no need to refetch apps as anyways the app will be still shown in All apps/modules/workflows folder
      // Case 2: if you are in a specific folder and you move an app to another folder, then we need to refetch the apps for that specific folder to remove that app from the list
      if (currentFolderId) {
        const currentAppsQueryData = queryClient.getQueryData([
          'apps',
          {
            pageNo: currentPage,
            folderId: currentFolderId,
            appSearchQuery: searchQuery,
            appType: variables.appType,
            pageSize,
          },
        ]);

        const numberOfAppsOnCurrentPageBeforeAction = currentAppsQueryData?.apps?.length ?? 0;

        // If there are no apps left on the current page after moving app to another folder, move back to the previous page (if not on the first page)
        setCurrentPage(
          numberOfAppsOnCurrentPageBeforeAction
            ? numberOfAppsOnCurrentPageBeforeAction === 1 && currentPage > 1
              ? currentPage - 1
              : currentPage
            : 1
        );
        queryClient.invalidateQueries({ queryKey: ['apps', { appType: variables.appType, pageSize }] });
      }
    },
  });
}

export function useRemoveAppFromFolder() {
  const queryClient = useQueryClient();

  const searchQuery = useSearchStore((state) => state.searchQuery);

  const pageSize = useAppsStore((state) => state.pageSize);
  const currentPage = useAppsStore((state) => state.currentPage);
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);
  const currentFolderId = useAppsStore((state) => state.currentFolderDetails?.value ?? '');

  return useMutation({
    mutationFn: ({ appId, folderId }) => folderService.removeAppFromFolder(appId, folderId),
    onError: (error) => {
      toast.error(error?.error ?? '');
    },
    onSuccess: (response, variables) => {
      toast.success('Application removed from folder successfully!');

      queryClient.invalidateQueries({ queryKey: ['folders', { appType: variables.appType }] });

      const currentAppsQueryData = queryClient.getQueryData([
        'apps',
        {
          pageNo: currentPage,
          folderId: currentFolderId,
          appSearchQuery: searchQuery,
          appType: variables.appType,
          pageSize,
        },
      ]);

      const numberOfAppsOnCurrentPageBeforeAction = currentAppsQueryData?.apps?.length ?? 0;

      // If there are no apps left on the current page after removing app from folder, move back to the previous page (if not on the first page)
      setCurrentPage(
        numberOfAppsOnCurrentPageBeforeAction
          ? numberOfAppsOnCurrentPageBeforeAction === 1 && currentPage > 1
            ? currentPage - 1
            : currentPage
          : 1
      );
      queryClient.invalidateQueries({ queryKey: ['apps', { appType: variables.appType, pageSize }] });
    },
  });
}
