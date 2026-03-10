import { useMutation, useQuery } from '@tanstack/react-query';

import { folderService } from '@/_services/folder.service';

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
  });
}

export function useAddAppToFolder() {
  return useMutation({
    mutationFn: ({ appId, folderId }) => folderService.addToFolder(appId, folderId),
  });
}

export function useRemoveAppFromFolder() {
  return useMutation({
    mutationFn: ({ appId, folderId }) => folderService.removeAppFromFolder(appId, folderId),
  });
}
