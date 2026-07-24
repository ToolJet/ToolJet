import { useMemo } from 'react';

export function useTableProperties(properties) {
  return useMemo(() => {
    const visibility = properties?.visibility ?? true;
    const disabledState = properties?.disabledState ?? false;
    const displaySearchBox = properties?.displaySearchBox ?? true;
    const showFilterButton = properties?.showFilterButton ?? true;

    return {
      visibility,
      disabledState,
      displaySearchBox,
      showFilterButton,
    };
  }, [properties]);
}
