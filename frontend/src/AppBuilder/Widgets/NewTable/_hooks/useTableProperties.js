import { useMemo } from 'react';

export function useTableProperties(properties) {
  return useMemo(() => {
    let visibility = properties?.visibility ?? true;
    visibility = visibility ? '' : 'none';
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
