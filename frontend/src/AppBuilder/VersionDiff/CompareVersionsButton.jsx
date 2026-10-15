import React from 'react';
import { GitCompareArrows } from 'lucide-react';
import { ToolTip } from '@/_components/ToolTip';
import { useVersionDiffStore } from './useVersionDiffStore';
import { VersionDiffDialog } from './VersionDiffDialog';

// Header entry point. The dialog is mounted here once and opened through the
// store, so the release dialog and the AI chat can open it too.
export const CompareVersionsButton = ({ darkMode }) => {
  const openCompare = useVersionDiffStore((state) => state.openCompare);
  return (
    <>
      <ToolTip message="Compare versions" placement="bottom">
        <button
          type="button"
          className="vd-header-button"
          onClick={() => openCompare({ source: 'header' })}
          aria-label="Compare versions"
          data-cy="compare-versions-button"
        >
          <GitCompareArrows size={16} strokeWidth={1.75} />
        </button>
      </ToolTip>
      <VersionDiffDialog darkMode={darkMode} />
    </>
  );
};

export default CompareVersionsButton;
