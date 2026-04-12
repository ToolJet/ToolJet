import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
// eslint-disable-next-line import/no-unresolved
import { useQueryClient } from '@tanstack/react-query';

import { useAppsStore } from '@/_stores/appsStore';
import { useSearchStore } from '@/_stores/searchStore';
import { useFetchFolders } from '@/_services/hooks/foldersServiceHooks';
import { useFetchApps } from '@/_services/hooks/appsServiceHooks';

export default function useFetchFolderAndApps({ appType }) {
  const queryClient = useQueryClient();

  const [searchParams] = useSearchParams();

  const searchQuery = useSearchStore((state) => state.searchQuery);

  const currentPage = useAppsStore((state) => state.currentPage);
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);
  const setCurrentFolderDetails = useAppsStore((state) => state.setCurrentFolderDetails);

  const {
    data: folders,
    isLoading: isLoadingFolders,
    isFetching: isFetchingFolders,
  } = useFetchFolders({ appType, appSearchQuery: searchQuery });

  const folderQueryParam = searchParams.get('folder') || '';
  const currentFolderDetails =
    folders?.find((folder) => folder.label?.toLowerCase() === folderQueryParam?.toLowerCase()) ?? null;
  const selectedFolderId = currentFolderDetails?.value ?? '';

  const { data: apps, isLoading: isLoadingApps } = useFetchApps(
    { appType, folderId: selectedFolderId, appSearchQuery: searchQuery, pageNo: currentPage },
    { enabled: !isFetchingFolders }
  );

  useEffect(() => {
    setCurrentFolderDetails(currentFolderDetails);
  }, [currentFolderDetails, setCurrentFolderDetails]);

  useEffect(
    () => () => {
      setCurrentPage(1);
      // Invalidate folders query when page unmounts to ensure folder list is refetched when user comes back to this page. This is required because staleTime for folders query is set to Infinity to avoid unnecessary refetched.
      queryClient.invalidateQueries({ queryKey: ['folders', { appType }] });
    },
    [appType, setCurrentPage, queryClient]
  );

  return { folders, isLoadingFolders, apps, isLoadingApps, currentFolderDetails };
}
