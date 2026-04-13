import React from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button/Button';
import { useSearchStore } from '@/_stores/searchStore';
import TooltipComp from '@/components/ui/Rocket/Tooltip';
import EmptyFolderIllustration from '@/pages/shared/illustrations/EmptyFolder';
import NoSearchResultIllustration from '@/pages/shared/illustrations/NoSearchResult';

import EmptyState from '../../shared/components/EmptyState';
import CreateAppButton from '../../shared/components/CreateAppButton';
import AppsEmptyState from '../illustrations/AppsEmptyState';
import ModulesEmptyState from '../illustrations/ModulesEmptyState';

export default function EmptyStates({
  appType,
  canCreateApp,
  moduleEnabled,
  selectedFolderId,
  appsLength,
  searchQuery,
  isCreationDisabled,
  isWorkspaceBranchLocked,
}) {
  const { t } = useTranslation();

  const setClearSearchQuery = useSearchStore((state) => state.setClearSearchQuery);

  const showEmptyFolderState = selectedFolderId && appsLength === 0;
  const showEmptySearchState = searchQuery?.length > 0 && appsLength === 0;

  const handleClearSearchTerm = () => {
    setClearSearchQuery(true);
  };

  return (
    <EmptyState
      illustrationSlot={
        showEmptySearchState ? (
          <NoSearchResultIllustration width="174" height="120" />
        ) : showEmptyFolderState ? (
          <EmptyFolderIllustration width="174" height="120" />
        ) : appType === 'module' ? (
          <ModulesEmptyState width="174" height="120" />
        ) : (
          <AppsEmptyState width="174" height="120" />
        )
      }
      resourceType={appType}
      title={
        selectedFolderId && !searchQuery?.length
          ? `No ${appType === 'front-end' ? 'apps' : 'modules'} found in this folder`
          : searchQuery?.length
          ? `No results found for "${searchQuery}"`
          : appType === 'front-end'
          ? 'You don’t have any apps yet'
          : 'You don’t have any modules yet'
      }
      description={
        searchQuery?.length || selectedFolderId
          ? ''
          : appType === 'front-end'
          ? 'You can start building from a blank canvas, use a pre-built template, or generate an app using AI. Choose the option that best fits your workflow'
          : 'Create reusable groups of components and queries via modules.'
      }
    >
      {selectedFolderId && !searchQuery?.length ? (
        <></>
      ) : searchQuery?.length ? (
        <Button size="large" variant="ghost" onClick={handleClearSearchTerm}>
          Clear search
        </Button>
      ) : appType === 'module' ? (
        <TooltipComp
          content={!moduleEnabled ? 'Modules are not available on your current plan.' : ''}
          isTooltipForInteractiveDisabledElement={isCreationDisabled}
        >
          <CreateAppButton
            label="Create new module"
            appType={appType}
            disabled={isCreationDisabled}
            isWorkspaceBranchLocked={isWorkspaceBranchLocked}
          />
        </TooltipComp>
      ) : appType === 'front-end' && canCreateApp ? (
        <CreateAppButton
          label={t('homePage.header.createNewApplication', 'Create new app')}
          appType={appType}
          disabled={isCreationDisabled}
          isWorkspaceBranchLocked={isWorkspaceBranchLocked}
        />
      ) : (
        <></>
      )}
    </EmptyState>
  );
}
