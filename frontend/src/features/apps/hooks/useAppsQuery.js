import { useMemo } from 'react';
import data from '../stories/data.json';

// Temporary static query hook. Replace with real data fetching later.
export function useAppsQuery() {
  const value = useMemo(() => ({ data, isLoading: false, error: null }), []);
  return value;
}

export default useAppsQuery;
