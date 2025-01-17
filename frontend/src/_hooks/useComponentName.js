import { useMemo } from 'react';

export function useComponentName(componentName) {
  return useMemo(() => {
    return String(componentName).toLowerCase();
  }, [componentName]);
}
