import { useEffect, useMemo } from 'react';

import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { normalizePin } from '@/AppBuilder/Widgets/libraryComponentRevision';
import { fetchEdition } from '@/modules/common/helpers/utils';
import useStore from '@/AppBuilder/_stores/store';

// CCL endpoints are unimplemented on CE (server/src/.../controller.ts is a stub).
const isCclSupportedEdition = () => ['ee', 'cloud'].includes(fetchEdition());

// Keeps CCL dev-bundle live-reload streams in sync with the app's persisted dev pins.
export default function useCustomComponentDevPreviewSync(appId: string | number | undefined) {
  const pins: Record<string, string> | undefined = useStore(
    (state: any) => state.globalSettings?.customComponentLibraries
  );
  const hasCustomComponentLibrariesAccess = useStore(
    (state: any) => state.license?.featureAccess?.customComponentLibraries === true
  );
  const libraries = useCustomComponentLibrariesStore((state: any) => state.libraries);

  const devPinKeys = useMemo(() => {
    return Object.fromEntries(
      Object.entries(pins ?? {})
        .map(([key, value]) => [key, normalizePin(value)])
        .filter(([, value]) => typeof value === 'string' && value.startsWith('dev:'))
    ) as Record<string, string>;
  }, [pins]);

  // Not license-gated — components need the list (name/manifest) regardless of access.
  useEffect(() => {
    if (!isCclSupportedEdition()) return;
    useCustomComponentLibrariesStore.getState().fetchLibraries();
  }, []);

  // syncDevPinStreams reads `libraries` but doesn't fetch it, so it's a dependency here too
  // — otherwise a pin present on mount never reconciles once the fetch above resolves.
  useEffect(() => {
    if (!libraries || !hasCustomComponentLibrariesAccess) return;

    useCustomComponentLibrariesStore.getState().syncDevPinStreams(devPinKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCustomComponentLibrariesAccess, libraries, JSON.stringify(devPinKeys)]);

  // Editor isn't remounted on same-tab app switches, so reset previews and the cached
  // library list manually here — the next app may have a version published while this
  // one was open, so the switch also refetches rather than reusing a stale cache.
  useEffect(() => {
    return () => useCustomComponentLibrariesStore.getState().resetAll();
  }, [appId]);
}
