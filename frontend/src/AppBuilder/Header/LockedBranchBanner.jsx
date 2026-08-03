import React from 'react';
import '@/_styles/locked-branch-banner.scss';
import SolidIcon from '@/_ui/Icon/SolidIcons';

/**
 * LockedBranchBanner - Displays a full-width warning banner when viewing a read-only branch
 * Shows below the editor navigation bar when current branch is locked (merged/released)
 *
 * @param {boolean} isVisible - Whether to show the banner
 * @param {string} branchName - Name of the locked branch
 * @param {string} reason - Reason why branch is locked (e.g., "merged", "released")
 */
const LockedBranchBanner = ({
  isVisible = false,
  branchName = '',
  reason = 'merged',
  pageContext = '',
  variant = 'inline',
}) => {
  if (!isVisible) {
    return null;
  }
  const pageContextText = pageContext ? `edit ${pageContext}` : '';
  const isLicenseLock = reason === 'git_sync_license_off';

  const reasonText =
    reason === 'released'
      ? 'This branch has been released and is now read-only'
      : isLicenseLock
      ? 'Your plan has expired. Renew your plan or disable git sync to continue.'
      : reason === 'main_config_branch'
      ? `Master is locked. Create a branch to add or ${pageContextText}.`
      : 'This branch has been merged and is now read-only';

  return (
    <div
      className={`locked-branch-banner locked-branch-banner--${variant}${
        isLicenseLock ? ' locked-branch-banner--warning' : ''
      }`}
      data-cy="locked-branch-banner"
    >
      <div className="locked-branch-banner-content">
        <SolidIcon
          name={isLicenseLock ? 'warning' : variant === 'floating' ? 'information' : 'lock'}
          fill={isLicenseLock ? 'var(--icon-warning, #BF4F03)' : 'var(--icon-default)'}
          width="16"
        />
        <div className="locked-branch-banner-text">
          <span className="locked-branch-banner-message">{reasonText}</span>
          {/* {branchName && (
            <span className="locked-branch-banner-branch">
              Branch: <strong>{branchName}</strong>
            </span>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default LockedBranchBanner;
