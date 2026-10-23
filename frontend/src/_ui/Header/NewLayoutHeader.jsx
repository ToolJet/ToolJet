import React, { useEffect, useMemo } from 'react';
import { useLocation, useMatch } from 'react-router-dom';
import { debounce } from 'lodash';

import { cn } from '@/lib/utils';
import { WorkspaceGitCTA } from '@/_ui/WorkspaceGitCTA';
import { WorkspaceBranchDropdown } from '@/_ui/WorkspaceBranchDropdown';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import { OrganizationList } from '@/modules/dashboard/components';
import LicenseBanner from '@/modules/common/components/LicenseBanner';
import { useSearchStore } from '@/_stores/searchStore';
import SearchInput from './SearchInput';

const SEARCH_DEBOUNCE_DELAY = 300;

export default function NewLayoutHeader({ featureAccess, showBranchingBtns }) {
  const isHomePageRoute = useMatch('/:workspaceId/home');
  const isAppsRoute = useMatch('/:workspaceId');
  const isModulesRoute = useMatch('/:workspaceId/modules');
  const isWorkflowsRoute = useMatch('/:workspaceId/workflows');

  const searchPlaceholder =
    (isAppsRoute && 'Search for apps and folders') ||
    (isModulesRoute && 'Search for modules and folders') ||
    (isWorkflowsRoute && 'Search for workflows and folders') ||
    'Search';

  const { pathname } = useLocation();
  const setSearchQuery = useSearchStore((state) => state.setSearchQuery);
  const debouncedSetSearchQuery = useMemo(() => debounce(setSearchQuery, SEARCH_DEBOUNCE_DELAY), [setSearchQuery]);

  // A query typed on one page shouldn't filter the next one, including a still-pending debounced one
  useEffect(() => {
    setSearchQuery('');
    return () => debouncedSetSearchQuery.cancel();
  }, [pathname, setSearchQuery, debouncedSetSearchQuery]);

  const clearSearchQuery = () => {
    debouncedSetSearchQuery.cancel();
    setSearchQuery('');
  };

  return (
    <header
      className={cn(
        'tw-grid tw-grid-cols-3 tw-items-center tw-h-12 tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-pl-3 tw-pr-8',
        { 'tw-grid-cols-1': isHomePageRoute }
      )}
    >
      <div className="tw-flex tw-items-center tw-gap-1">
        <OrganizationList variant="new" />

        {Object.keys(featureAccess).length > 0 && (
          <LicenseBanner limits={featureAccess} showNavBarActions={true} showConsultationBtn={isHomePageRoute} />
        )}
      </div>

      {!isHomePageRoute && (
        <>
          {/* Keyed by pathname so the input's own state resets along with the store */}
          <SearchInput
            key={pathname}
            placeholder={searchPlaceholder}
            onChange={debouncedSetSearchQuery}
            onClear={clearSearchQuery}
          />

          {showBranchingBtns && (
            <div className="tw-flex tw-justify-end tw-items-center tw-gap-1">
              <WorkspaceBranchDropdown />

              <Separator orientation="vertical" className="tw-h-4 tw-hidden has-[+*]:tw-block" />

              <WorkspaceGitCTA />
            </div>
          )}
        </>
      )}
    </header>
  );
}
