import { useEffect } from 'react';
import { usePrevious } from '@dnd-kit/utilities';
import { clearAllPeriodicTimers } from '@/AppBuilder/_stores/slices/componentsSlice';

/**
 * Stops "Run this query periodically" polling when the editor's data context changes: environment,
 * version, or restore. Nothing should keep running against the new context unasked; a fresh Run, or
 * a run-on-page-load query, starts polling again. A hot reload changes none of these, so polling
 * carries on through it.
 *
 * Kept apart from useAppData's reload pipeline because that pipeline skips modules, while the
 * standalone module editor ('canvas') switches environments too. A placed module instance doesn't
 * act on its own: the app holding it stops every timer, its own included, on the same change.
 */
export function useStopPeriodicRunsOnContextChange({
  moduleMode,
  moduleId,
  environmentId,
  versionId,
  selectedVersionId,
  restoreTimestamp,
}) {
  const previousEnvironmentId = usePrevious(environmentId);
  const previousVersionId = usePrevious(versionId);
  const previousRestoreTimestamp = usePrevious(restoreTimestamp);

  useEffect(() => {
    if (moduleMode && moduleId !== 'canvas') return;
    const isEnvChanged = environmentId && previousEnvironmentId && previousEnvironmentId != environmentId;
    // Same agreement check as useAppData's reload: a version id that selectedVersion hasn't caught up
    // with is the stale cross-app window on clone, not a version switch.
    const isVersionChanged =
      versionId && previousVersionId && versionId != previousVersionId && selectedVersionId === versionId;
    const isRestored = restoreTimestamp != previousRestoreTimestamp;
    if (isEnvChanged || isVersionChanged || isRestored) clearAllPeriodicTimers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [environmentId, versionId, restoreTimestamp]);
}
