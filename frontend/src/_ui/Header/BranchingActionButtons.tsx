import React from 'react';
import { useLocation } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { WorkspaceBranchDropdown } from '@/_ui/WorkspaceBranchDropdown';
import { WorkspaceGitCTA } from '@/_ui/WorkspaceGitCTA';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import { authenticationService } from '@/_services/authentication.service';
import { isGitSyncLicenseInvalid } from '@/_helpers/gitSyncLicense';
import { useLicenseStore } from '@/_stores/licenseStore';

import type { ILicenseStore } from '@/_stores/types/licenseStore';
import type { IWorkspaceBranchesStore } from '@/_stores/types/workspaceBranchesStore';

import { isWorkspaceGitPage, routes } from './helper';

export default function BranchingActionButtons() {
  const location = useLocation();

  const featureAccess = useLicenseStore((state: ILicenseStore) => state.featureAccess);
  const isBranchStoreInitialized = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.isInitialized);
  const isGitSyncConfigured = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.isGitSyncConfigured);
  const pathname = routes(location?.pathname.split('/').pop() ?? '', location?.pathname);
  // Git set up but the license is expired/invalid → keep the git-sync UI visible but frozen.
  const gitLicenseLocked = isGitSyncConfigured && isGitSyncLicenseInvalid(featureAccess);
  const currentSession = authenticationService.currentSessionValue;
  const isAdmin = !!currentSession?.admin;
  const isBuilder = !!currentSession?.user_permissions?.is_builder;
  const canAccessGitControls = isAdmin || isBuilder;

  const isGitSupportedPage = isWorkspaceGitPage(location.pathname);

  const showBranchingBtns =
    (featureAccess?.gitSync || isGitSyncConfigured) &&
    canAccessGitControls &&
    isBranchStoreInitialized &&
    pathname !== 'Workspace constants' &&
    isGitSupportedPage;

  if (!showBranchingBtns) return null;

  return (
    <div
      className={cn('tw-flex tw-items-center tw-gap-1', {
        'tw-pointer-events-none tw-opacity-50': gitLicenseLocked,
      })}
    >
      <WorkspaceBranchDropdown />

      <Separator orientation="vertical" className="tw-h-4 tw-hidden has-[+*]:tw-block" />

      {/* Single "Pull commit" button. WorkspaceGitCTA decides whether the modal
      offers push based on the page + branch state (push only on the data-sources
      page, and never on the multi-branch default branch). */}
      <WorkspaceGitCTA isDataSourcesPage={location.pathname.split('/').includes('data-sources')} />
    </div>
  );
}
