import { useEffect } from 'react';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { buildManifestCacheKey } from '@/_helpers/customComponentLibrariesStoreUtils';

import type { LibraryManifest } from '@/AppBuilder/types/libraryComponent.types';

// Shared reactive manifest cache — one fetch per (libraryId, revision, devNonce) no
// matter how many components/panels need it (widget runtime, Inspector, component
// manager palette). Because this reads real Zustand state, every consumer re-renders
// automatically once an in-flight fetch resolves.
export const useLibraryManifest = (libraryId?: string, revision?: string): LibraryManifest | null => {
  const devNonce = useCustomComponentLibrariesStore((state: any) =>
    revision?.startsWith?.('dev:') ? state.devBundleUpdatedAt?.[libraryId ?? ''] : undefined
  );
  const key = libraryId && revision ? buildManifestCacheKey(libraryId, revision, devNonce) : undefined;
  const manifest = useCustomComponentLibrariesStore((state: any) => (key ? state.manifests[key] : undefined));

  useEffect(() => {
    if (!libraryId || !revision) return;
    useCustomComponentLibrariesStore.getState().fetchManifest(libraryId, revision, devNonce);
  }, [libraryId, revision, devNonce]);

  return manifest ?? null;
};
