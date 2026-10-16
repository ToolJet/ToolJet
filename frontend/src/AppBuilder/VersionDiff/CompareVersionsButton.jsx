import React, { useEffect, useState } from 'react';
import { GitCompareArrows } from 'lucide-react';
import { ToolTip } from '@/_components/ToolTip';
import useStore from '@/AppBuilder/_stores/store';
import { useModuleContext } from '@/AppBuilder/_contexts/ModuleContext';
import { useVersionDiffStore } from './useVersionDiffStore';
import { VersionDiffDialog } from './VersionDiffDialog';
import { reviewService } from './reviewService';

// Header entry point. The dialog is mounted here once and opened through the
// store, so the release dialog and the AI chat can open it too. A dot shows
// when a version of this app is waiting for review; clicking opens it.
export const CompareVersionsButton = ({ darkMode }) => {
  const { moduleId } = useModuleContext();
  const appId = useStore((state) => state.appStore.modules[moduleId]?.app?.appId);
  const { openCompare, isOpen } = useVersionDiffStore();
  const [waiting, setWaiting] = useState([]);

  useEffect(() => {
    if (!appId || isOpen) return;
    let cancelled = false;
    const load = () =>
      reviewService
        .list(appId, 'open', { brief: true })
        .then(({ reviews = [] }) => !cancelled && setWaiting(reviews))
        .catch(() => {});
    load();
    // Only a visible tab checks for waiting reviews; a hidden one catches up when shown.
    const timer = setInterval(() => document.visibilityState === 'visible' && load(), 60000);
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [appId, isOpen]);

  const label = waiting.length
    ? `${waiting.length} version${waiting.length === 1 ? '' : 's'} waiting for review`
    : 'Compare versions (Beta)';

  return (
    <>
      <ToolTip message={label} placement="bottom">
        <button
          type="button"
          className="vd-header-button"
          onClick={() =>
            waiting.length
              ? openCompare({ source: 'review', reviewId: waiting[0].id })
              : openCompare({ source: 'header' })
          }
          aria-label={label}
          data-cy="compare-versions-button"
        >
          <GitCompareArrows size={16} strokeWidth={1.75} />
          {waiting.length > 0 && <span className="vd-header-button__dot" aria-hidden="true" />}
        </button>
      </ToolTip>
      <VersionDiffDialog darkMode={darkMode} />
    </>
  );
};

export default CompareVersionsButton;
