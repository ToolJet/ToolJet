import { useLayoutEffect } from 'react';

import { useSearchStore } from '@/_stores/searchStore';

import type { ISearchConfig } from '@/_stores/types/searchStore';

// Customises the new layout header's search for the calling page and restores the defaults on unmount.
export function useHeaderSearchConfig({ placeholder, debounceMs }: Partial<ISearchConfig>) {
  const setSearchConfig = useSearchStore((state) => state.setSearchConfig);
  const resetSearchConfig = useSearchStore((state) => state.resetSearchConfig);

  // Layout effect so the header never paints the default placeholder before the page's own
  useLayoutEffect(() => {
    setSearchConfig({ placeholder, debounceMs });
    return resetSearchConfig;
  }, [placeholder, debounceMs, setSearchConfig, resetSearchConfig]);
}
