import React from 'react';
import { capitalize } from 'lodash';
import { LockKeyhole } from 'lucide-react';

/**
 * LockedBranchBanner - Displays a full-width warning banner when viewing a read-only branch
 * Shows below the editor navigation bar when current branch is locked (merged/released)
 *
 * @param {boolean} isVisible - Whether to show the banner
 * @param {string} branchName - Name of the locked branch
 * @param {string} reason - Reason why branch is locked (e.g., "merged", "released")
 */
const LockedBranchBanner = ({ isVisible = false, branchName = '', reason = 'merged', pageContext = '' }) => {
  if (!isVisible) {
    return null;
  }
  const pageContextText = pageContext ? `edit ${pageContext}` : '';

  const reasonText =
    reason === 'released'
      ? 'This branch has been released and is now read-only'
      : reason === 'main_config_branch'
      ? `${capitalize(branchName) || 'Master'} branch is locked. Create a branch to add or ${pageContextText}.`
      : 'This branch has been merged and is now read-only';

  return (
    <div className="tw-flex tw-justify-center tw-items-center tw-gap-1 tw-py-1.5 tw-px-2.5 tw-bg-interactive-default">
      <LockKeyhole size={14} color="var(--icon-strong)" />

      <p className="tw-text-text-default tw-font-body-default tw-mb-0">{reasonText}</p>
    </div>
  );
};

export default LockedBranchBanner;
