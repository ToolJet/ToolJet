import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTjdbStore } from '../_stores/tjdbStore';

const ENV_PARAM = 'env';
// Priority 1 is development by backend convention; it is the default, so it never appears in the URL.
const DEVELOPMENT_PRIORITY = 1;

// Keeps `?env=` on the selected environment so a refresh or a shared link opens the same one.
// Returns the environment id the page opened with: pass it to `loadEnvironments`, which checks it against the
// workspace's environments. Nothing is written until an environment is selected, so the opening value is not erased
// before it is read; a locked or unknown one is replaced by whatever the store selects instead.
export function useEnvironmentUrl(): string | null {
  const [searchParams, setSearchParams] = useSearchParams();
  const openedWithRef = useRef(searchParams.get(ENV_PARAM));
  const selectedEnvironment = useTjdbStore(
    (state: { selectedEnvironment: { id: string; priority: number } | null }) => state.selectedEnvironment
  );

  useEffect(() => {
    if (!selectedEnvironment) return;
    setSearchParams(
      (previous) => {
        const params = new URLSearchParams(previous);
        if (selectedEnvironment.priority === DEVELOPMENT_PRIORITY) params.delete(ENV_PARAM);
        else params.set(ENV_PARAM, selectedEnvironment.id);
        return params;
      },
      { replace: true }
    );
  }, [selectedEnvironment, setSearchParams]);

  return openedWithRef.current;
}
