import { useEffect } from 'react';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { buildManifestCacheKey } from '@/_helpers/customComponentLibrariesStoreUtils';

import type { LibraryManifest } from '@/AppBuilder/types/libraryComponent.types';

// Shared reactive manifest cache — one fetch per (libraryId, revision) no matter how
// many components/panels need it. Reads real Zustand state, so every consumer re-renders
// once an in-flight fetch resolves.
export const useLibraryManifest = (libraryId?: string, revision?: string): LibraryManifest | null => {
    // const currentMode = useStore((state) => state.modeStore?.modules?.canvas?.currentMode ?? 'view');
    // const hasCustomComponentLibrariesAccess = useStore(
    //   (state) => state.license?.featureAccess?.customComponentLibraries === true
    // );

  // Not part of the cache key — only here to re-trigger the fetch after a live push
  // invalidates the manifest.
  const devNonce = useCustomComponentLibrariesStore((state: any) =>
    revision?.startsWith?.('dev:') ? state.devBundleUpdatedAt?.[libraryId ?? ''] : undefined
  );
  const key = libraryId && revision ? buildManifestCacheKey(libraryId, revision) : undefined;
  const manifest = useCustomComponentLibrariesStore((state: any) => (key ? state.manifests[key] : undefined));

  useEffect(() => {
    if (!libraryId || !revision) return;
    useCustomComponentLibrariesStore.getState().fetchManifest(libraryId, revision);
  }, [libraryId, revision, devNonce]);

  return manifest ?? null;
};
