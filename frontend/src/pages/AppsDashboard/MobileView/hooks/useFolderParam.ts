import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// The open folder lives in `?folder=<id>`, the same param the desktop grid uses.
export function useFolderParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const folderId = searchParams.get('folder');

  const setFolderId = useCallback(
    (id: string | null) =>
      setSearchParams(
        (current) => {
          // Functional update keeps unrelated params such as `branch`.
          const next = new URLSearchParams(current);
          if (id) next.set('folder', id);
          else next.delete('folder');
          return next;
        },
        { replace: true }
      ),
    [setSearchParams]
  );

  return { folderId, setFolderId };
}
