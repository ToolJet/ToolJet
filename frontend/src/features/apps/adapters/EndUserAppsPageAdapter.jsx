import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { EndUserShellView } from '../components/EndUserShellView';
import { appsColumns } from '@/features/apps/columns';
import { useResourcePageAdapter } from '@/features/apps/hooks/useResourcePageAdapter';
import { useResourceActions } from '@/features/apps/hooks/useResourceActions';
import { useResourcePermissions } from '@/features/apps/hooks/useResourcePermissions';
import { PaginationFooter } from '@/components/ui/blocks/PaginationFooter';
import { EmptyNoApps } from '../components/EmptyNoApps';
import { EndUserHeader } from '@/components/ui/blocks/AppsPageHeader/EndUserHeader';
import { Button } from '@/components/ui/Button/Button';
import { useResourcePageState } from '@/features/apps/hooks/useResourcePageState';
import { ResourceTabs } from '@/components/ui/blocks/ResourceTabs';
import { ResourceErrorBoundary } from '@/components/ui/blocks/ResourceErrorBoundary';
import { ErrorState } from '@/components/ui/blocks/ErrorState';
import { DataTable } from '@/components/ui/blocks/DataTable';
import { AppsGrid } from '../components/AppsGrid';

function EndUserAppsPageAdapter({
  data = {},
  filters = {},
  actions: rawActions = {},
  permissions = {},
  navigation = {},
  layout = {},
}) {
  const { apps = [], isLoading: appsIsLoading, error: appsError, meta = {} } = data;
  const { appSearchKey = '', currentFolder = {}, folders = [], foldersLoading = false } = filters;
  const { pageChanged, folderChanged, onSearch, deleteApp, cloneApp, exportApp } = rawActions;
  const { canCreateApp, canDeleteApp, canUpdateApp } = permissions;
  const { navigate, workspaceId } = navigation;
  const { workspaceName, workspaces = [], onWorkspaceChange } = layout;

  const { viewMode, setViewMode, isLoading } = useResourcePageState({
    loadingStates: { apps: appsIsLoading, folders: foldersLoading },
  });

  const resolvedWorkspaceId = workspaceId || '32434r';
  const actionsHandlers = useResourceActions({
    navigate,
    workspaceId: resolvedWorkspaceId,
    handlers: { deleteApp, cloneApp, exportApp },
  });
  const actions = useMemo(
    () => ({
      play: actionsHandlers.handlePlay,
      edit: actionsHandlers.handleEdit,
      delete: actionsHandlers.handleDelete,
      clone: actionsHandlers.handleClone,
      export: actionsHandlers.handleExport,
    }),
    [actionsHandlers]
  );

  const { permissions: computedPerms, canDelete: canDeletePerm } = useResourcePermissions({
    canCreateApp,
    canUpdateApp,
    canDeleteApp,
  });
  const finalColumns = useMemo(
    () => appsColumns({ perms: computedPerms, actions, canDelete: canDeletePerm }),
    [computedPerms, actions, canDeletePerm]
  );

  const {
    table: finalTable,
    isEmpty: appsEmpty,
    error: adapterError,
  } = useResourcePageAdapter({
    data: { apps, isLoading: appsIsLoading, error: appsError, meta },
    filters: { appSearchKey, currentFolder },
    actions: { pageChanged, onSearch },
    columns: finalColumns,
  });

  const breadcrumbItems = useMemo(
    () => [
      { label: 'Folders', href: '/folders' },
      { label: currentFolder?.name || 'All apps', href: null },
    ],
    [currentFolder]
  );

  console.log('End user apps table', data, finalTable?.getRowCount());
  if (appsError || adapterError) {
    return (
      <ErrorState
        title="Failed to load apps"
        error={appsError || adapterError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Generic helper to render content based on view mode
  const renderContentView = (table, isLoading) => {
    // Use pageIndex as key to force re-render when pagination changes
    const pageIndex = table.getState().pagination.pageIndex;
    return viewMode === 'list' ? (
      <DataTable key={`table-page-${pageIndex}`} table={table} isLoading={isLoading} />
    ) : (
      <AppsGrid table={table} actions={actions} perms={computedPerms} canDelete={canDeletePerm} />
    );
  };

  const appsContent = renderContentView(finalTable, appsIsLoading);

  // Get current page from table state to ensure PaginationFooter re-renders when it changes
  const currentPage = finalTable.getState().pagination.pageIndex + 1;

  const appsContentWrapper = {
    id: 'apps',
    label: 'Apps',
    content: appsContent,
    error: appsError,
    empty: appsEmpty,
    emptyState: <EmptyNoApps />,
  };

  return (
    <EndUserShellView
      searchValue={appSearchKey}
      onSearch={onSearch}
      workspaceName={workspaceName}
      workspaces={workspaces}
      onWorkspaceChange={onWorkspaceChange}
      header={
        <EndUserHeader
          title={'Applications'}
          breadcrumbItems={breadcrumbItems}
          isLoading={foldersLoading}
          viewAs={viewMode}
          onViewChange={setViewMode}
          folders={folders}
          currentFolder={currentFolder}
          onFolderChange={folderChanged}
          foldersLoading={foldersLoading}
        />
      }
      footer={<PaginationFooter table={finalTable} isLoading={isLoading} currentPage={currentPage} />}
    >
      <ResourceErrorBoundary>
        {appsContentWrapper.error ? (
          <div className="tw-p-6 tw-text-center" role="alert" aria-live="polite">
            <div className="tw-text-red-500 tw-mb-2">Failed to load {appsContentWrapper.label}</div>
            <div className="tw-text-sm tw-text-muted-foreground">
              {appsContentWrapper.error.message || 'An error occurred'}
            </div>
          </div>
        ) : appsContentWrapper.empty ? (
          appsContentWrapper.emptyState
        ) : (
          appsContentWrapper.content
        )}
      </ResourceErrorBoundary>
    </EndUserShellView>
  );
}

EndUserAppsPageAdapter.propTypes = {
  data: PropTypes.object,
  filters: PropTypes.object,
  actions: PropTypes.object,
  permissions: PropTypes.object,
  navigation: PropTypes.object,
  layout: PropTypes.object,
};

export default React.memo(EndUserAppsPageAdapter);
