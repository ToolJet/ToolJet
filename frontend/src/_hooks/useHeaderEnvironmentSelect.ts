import { useLayoutEffect } from 'react';

import { useHeaderEnvironmentStore, type HeaderEnvironmentSelectConfig } from '@/_stores/headerEnvironmentStore';

// Shows an environment select in the new layout header for the calling page and removes it on unmount. Pass `null`
// while there is nothing to show. Memoise the config: a new object each render would re-set the store each render.
export function useHeaderEnvironmentSelect(select: HeaderEnvironmentSelectConfig | null) {
  const setSelect = useHeaderEnvironmentStore((state) => state.setSelect);

  // Layout effect so the header never paints a frame without the select the page has
  useLayoutEffect(() => {
    setSelect(select);
    return () => setSelect(null);
  }, [select, setSelect]);
}
