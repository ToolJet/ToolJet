import React from 'react';
import cx from 'classnames';
import './version-switcher-button.scss';

const VersionSwitcherButton = ({ version, environment, onClick, releasedVersionId, isOpen, darkMode }) => {
  const isDraft = version?.status === 'DRAFT';
  const isReleased = version?.id === releasedVersionId;

  const capitalizeFirstLetter = (str) => {
    if (!str) return 'Development';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Determine dot status class based on version status
  const getDotClass = () => {
    if (isDraft) {
      return 'draft';
    }
    if (isReleased) {
      return 'released';
    }
    return 'published';
  };

  return (
    <button
      className={cx('btn version-switcher-button', {
        opened: isOpen,
        'theme-dark': darkMode,
      })}
      onClick={onClick}
      data-cy="version-switcher-button"
    >
      <div className="button-content">
        {/* Status indicator dot */}
        <div className={cx('status-dot', getDotClass())} data-cy="version-status-dot" />

        {/* Version name */}
        <span className="version-name" data-cy="version-name">
          {version?.name}
        </span>

        {/* Divider */}
        <div className="divider" />

        {/* Environment name */}
        <span className="environment-name" data-cy={`${environment?.name}-environment-name`}>
          {capitalizeFirstLetter(environment?.name)}
        </span>
      </div>
    </button>
  );
};

export default VersionSwitcherButton;
