import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { TJLoader } from '@/_ui/TJLoader/TJLoader';
import { getWorkspaceId } from '@/_helpers/utils';
import { appendBranchName } from '@/_helpers/active-branch';
import { getOrCreateQueryLibrary } from './queryLibraryApp';

// The dashboard "Query library" tab lands here: a workspace has one library, so open it (creating it on first visit).
export default function QueryLibraryRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    const workspaceId = getWorkspaceId();
    let cancelled = false; // a late response must not navigate or toast after the user left
    getOrCreateQueryLibrary()
      .then(({ slug }) => {
        if (!cancelled) navigate(appendBranchName(`/${workspaceId}/apps/${slug}`), { replace: true });
      })
      .catch((err) => {
        if (cancelled) return;
        toast.error(typeof err?.error === 'string' ? err.error : 'Could not open the query library');
        navigate(`/${workspaceId}`, { replace: true }); // so Back doesn't re-enter the redirect
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return <TJLoader />;
}
