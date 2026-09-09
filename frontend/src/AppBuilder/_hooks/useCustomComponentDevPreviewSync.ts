import { useEffect, useMemo } from 'react';

import { useCustomComponentLibrariesStore } from '@/_stores/customComponentLibrariesStore';
import { normalizePin } from '@/AppBuilder/Widgets/libraryComponentRevision';
import useStore from '@/AppBuilder/_stores/store';

// Keeps CCL dev-bundle live-reload streams in sync with the app's persisted dev pins.
export default function useCustomComponentDevPreviewSync(appId: string | number | undefined) {
  const pins: Record<string, string> | undefined = useStore(
    (state: any) => state.globalSettings?.customComponentLibraries
  );

  const devPinKeys = useMemo(() => {
    return Object.fromEntries(
      Object.entries(pins ?? {})
        .map(([key, value]) => [key, normalizePin(value)])
        .filter(([, value]) => typeof value === 'string' && value.startsWith('dev:'))
    ) as Record<string, string>;
  }, [pins]);

  useEffect(() => {
    useCustomComponentLibrariesStore.getState().syncDevPinStreams(devPinKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(devPinKeys)]);

  // Editor isn't remounted on same-tab app switches, so reset previews and the cached
  // library list manually here — the next app may have a version published while this
  // one was open, so the switch also refetches rather than reusing a stale cache.
  useEffect(() => {
    return () => useCustomComponentLibrariesStore.getState().resetAll();
  }, [appId]);
}
