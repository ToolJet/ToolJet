import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useFetchFolders } from './folderServiceHooks';

export const useAppFilters = () => {
  const { data: folders } = useFetchFolders({ appType: 'workflow' }, {});

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
