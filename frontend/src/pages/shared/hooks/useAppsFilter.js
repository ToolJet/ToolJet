import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useFetchFolders } from '@/_services/hooks/foldersServiceHooks'; // TODO: Circular dependency, foldersServiceHooks import useAppsFilter

export const useAppsFilter = ({ appType = 'front-end' } = {}) => {
  const { data: folders } = useFetchFolders({ appType }, {});

  const [searchParams, setSearchParams] = useSearchParams();

  const folderName = searchParams.get('folder') || '';
  const currentSelectedFolder =
    folders?.find((folder) => folder.label?.toLowerCase() === folderName?.toLowerCase()) ?? null;
  const selectedFolderId = currentSelectedFolder?.value ?? '';

  const setFilters = useCallback((filters) => {
    setSearchParams(
      (params) => {
        filters.folderName ? params.set('folder', filters.folderName) : params.delete('folder');

        return params;
      },
      { replace: true }
    );
  }, []);

  return { folderName, folderId: selectedFolderId, setFilters };
};
