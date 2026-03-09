import React from 'react';
import '@/_styles/locked-branch-banner.scss';

/**
 * LockedBranchBanner - Displays a full-width warning banner when viewing a read-only branch
 * Shows below the editor navigation bar when current branch is locked (merged/released)
 *
 * @param {boolean} isVisible - Whether to show the banner
 * @param {string} branchName - Name of the locked branch
 * @param {string} reason - Reason why branch is locked (e.g., "merged", "released")
 */
const LockedBranchBanner = ({ isVisible = false, branchName = '', reason = 'merged' }) => {
  if (!isVisible) {
    return null;
  }

  const reasonText =
    reason === 'released'
      ? 'This branch has been released and is now read-only'
      : reason === 'main_config_branch'
      ? `${branchName} is locked. Create a branch to make edits.`
      : 'This branch has been merged and is now read-only';

  return (
    <div className="locked-branch-banner">
      <div className="locked-branch-banner-content">
        <svg
          className="locked-branch-banner-icon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.6667 7.33333H12V5.33333C12 3.49238 10.5076 2 8.66667 2C6.82572 2 5.33333 3.49238 5.33333 5.33333V7.33333H4.66667C3.93029 7.33333 3.33333 7.93029 3.33333 8.66667V12.6667C3.33333 13.403 3.93029 14 4.66667 14H12.6667C13.403 14 14 13.403 14 12.6667V8.66667C14 7.93029 13.403 7.33333 12.6667 7.33333ZM6.66667 5.33333C6.66667 4.22876 7.56209 3.33333 8.66667 3.33333C9.77124 3.33333 10.6667 4.22876 10.6667 5.33333V7.33333H6.66667V5.33333Z"
            fill="currentColor"
          />
        </svg>
        <div className="locked-branch-banner-text">
          <span className="locked-branch-banner-message">{reasonText}</span>
          {branchName && (
            <span className="locked-branch-banner-branch">
              Branch: <strong>{branchName}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LockedBranchBanner;
