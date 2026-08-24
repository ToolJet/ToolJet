import { useEffect, useMemo } from 'react';

import { useCustomComponentPreviewStore } from '@/_stores/customComponentPreviewStore';
import { normalizePin } from '@/AppBuilder/Widgets/libraryComponentRevision';
import useStore from '@/AppBuilder/_stores/store';

// Keeps CCL dev-bundle live-reload streams in sync with the app's persisted dev pins.
// Pin state, not a UI click, drives this - see customComponentPreviewStore.syncDevPinStreams.
export default function useCustomComponentDevPreviewSync(appId) {
  const pins = useStore((state) => state.globalSettings?.customComponentLibraries);

  const devPinKeys = useMemo(() => {
    return Object.fromEntries(
      Object.entries(pins ?? {})
        .map(([key, value]) => [key, normalizePin(value)])
        .filter(([, value]) => typeof value === 'string' && value.startsWith('dev:'))
    );
  }, [pins]);

  useEffect(() => {
    useCustomComponentPreviewStore.getState().syncDevPinStreams(devPinKeys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(devPinKeys)]);

  // Editor isn't remounted on same-tab app switches, so preview state/streams
  // must be reset manually on appId change.
  useEffect(() => {
    return () => useCustomComponentPreviewStore.getState().resetAllDevPreviews();
  }, [appId]);
}
