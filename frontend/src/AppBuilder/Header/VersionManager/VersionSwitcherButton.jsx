import React from 'react';

const VersionSwitcherButton = ({ version, environment, onClick, showDraftBadge = false, releasedVersionId }) => {
  const isDraft = version?.status === 'DRAFT';
  const isReleased = version?.id === releasedVersionId;

  // Determine dot color based on version status
  const getDotColor = () => {
    if (isDraft) {
      return '#BF4F03'; // Orange for draft
    }
    if (isReleased) {
      return '#1E823B'; // Green for released
    }
    return '#4368E3'; // Blue for published (not released)
  };

  return (
    <button
      className="btn version-switcher-button d-flex align-items-center justify-content-center"
      style={{
        padding: '7px 12px',
        gap: '6px',
        border: '1px solid var(--border-weak)',
        borderRadius: '6px',
        backgroundColor: 'white',
        cursor: 'pointer',
        minWidth: '139px',
      }}
      onClick={onClick}
    >
      <div className="d-flex align-items-center" style={{ gap: '6px' }}>
        {/* Status indicator dot */}
        <div
          className="status-dot"
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: getDotColor(),
          }}
        />

        {/* Version name */}
        <span
          className="tj-text-sm"
          style={{
            color: 'var(--text-default)',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {isDraft && showDraftBadge ? 'Draft' : version?.name || 'v1'}
        </span>

        {/* Divider */}
        <div
          style={{
            width: '1px',
            height: '16px',
            backgroundColor: 'var(--border-weak)',
          }}
        />

        {/* Environment name */}
        <span
          className="tj-text-sm"
          style={{
            color: 'var(--text-placeholder)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {environment?.name || 'Development'}
        </span>
      </div>
    </button>
  );
};

export default VersionSwitcherButton;
