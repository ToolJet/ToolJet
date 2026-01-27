import React from 'react';
import { ReleaseVersionButton } from '@/modules/common/components/BasePromoteReleaseButton/components';

/**
 * CE Version - Only shows Release button
 * In CE, there's only one environment (development), so versions go from:
 * DRAFT -> (Create Version) -> PUBLISHED -> (Release) -> RELEASED
 */
const VersionActionButtons = ({ version, isDraft, isReleased, onCreateVersion }) => {
  const canCreateVersion = isDraft; // Show create version button for drafts
  const canRelease = !isDraft && !isReleased; // Show release button for published versions

  return (
    <>
      {/* Release button - shown for published versions (not drafts, not released) */}
      {canRelease && <ReleaseVersionButton version={version} variant="inline" />}

      {/* Create version button - shown for drafts */}
      {canCreateVersion && (
        <button
          className="btn btn-sm"
          style={{
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: 500,
            border: '1px solid var(--border-weak)',
            backgroundColor: 'white',
            color: 'var(--text-default)',
            borderRadius: '4px',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onCreateVersion?.(version);
          }}
        >
          Create version
        </button>
      )}
    </>
  );
};

export default VersionActionButtons;
