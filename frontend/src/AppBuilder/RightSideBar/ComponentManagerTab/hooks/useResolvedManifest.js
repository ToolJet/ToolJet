import { useEffect, useRef, useState } from 'react';
import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { libraryFileUrl } from '@/AppBuilder/Widgets/libraryComponentRevision';

// Fetches manifest.json for whatever revision the palette should currently display, via
// the same per-revision/per-dev-bundle serve routes the widget runtime already uses
// (libraryFileUrl) — no separate manifest API needed. Falls back to the library list's
// latest-revision manifest (already in hand) so the common case needs no network call.
export const useResolvedManifest = (library, current, latest) => {
  const cacheRef = useRef({});

  const devNonce = useCustomComponentLibrariesStore((state) =>
    current?.startsWith?.('dev:') ? state.devBundleUpdatedAt?.[library.id] : undefined
  );

  const [manifest, setManifest] = useState(current === latest ? library.manifest : null);

  const cacheKey = devNonce ? `${current}@${devNonce}` : current;

  useEffect(() => {
    if (current === latest) {
      setManifest(library.manifest);
      return;
    }

    if (cacheRef.current[cacheKey]) {
      setManifest(cacheRef.current[cacheKey]);
      return;
    }

    let cancelled = false;

    fetch(libraryFileUrl(library.id, current, 'manifest.json'))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data) {
          cacheRef.current[cacheKey] = data;
          setManifest(data);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [library.id, library.manifest, current, latest, cacheKey]);

  return manifest;
};
