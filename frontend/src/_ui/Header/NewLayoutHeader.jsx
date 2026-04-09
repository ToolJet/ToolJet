import React from 'react';
import { useMatch } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { WorkspaceGitCTA } from '@/_ui/WorkspaceGitCTA';
import { WorkspaceBranchDropdown } from '@/_ui/WorkspaceBranchDropdown';
import { Separator } from '@/components/ui/Rocket/shadcn/separator';
import LicenseBanner from '@/modules/common/components/LicenseBanner';

import SearchInput from './SearchInput';
import WorkspaceSelector from './WorkspaceSelector';

export default function NewLayoutHeader({ featureAccess, showBranchingBtns }) {
  const isHomePageRoute = useMatch('/:workspaceId/home');

  return (
    <header
      className={cn(
        'tw-grid tw-grid-cols-3 tw-items-center tw-h-12 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-pl-3 tw-pr-8',
        { 'tw-grid-cols-1': isHomePageRoute }
      )}
    >
      <div className="tw-flex tw-items-center tw-gap-1">
        <WorkspaceSelector />

        <Separator orientation="vertical" className={cn('tw-bg-border-weak tw-h-4 tw-hidden has-[+*]:tw-block')} />

        {Object.keys(featureAccess).length > 0 && (
          <LicenseBanner limits={featureAccess} showNavBarActions={true} showConsultationBtn={isHomePageRoute} />
        )}
      </div>

      {!isHomePageRoute && (
        <>
          <SearchInput classes={{ searchBarContainer: 'tw-mx-auto' }} />

          {showBranchingBtns && (
            <div className="tw-flex tw-justify-end tw-items-center tw-gap-1">
              <WorkspaceBranchDropdown />

              <Separator
                orientation="vertical"
                className={cn('tw-bg-border-weak tw-h-4 tw-hidden has-[+*]:tw-block')}
              />

              <WorkspaceGitCTA />
            </div>
          )}
        </>
      )}
    </header>
  );
}
