import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { EndUserResourceShellView, EmptyResource } from '@/features/commons/components';
import { appsColumns } from '@/features/commons/columns';
import {
  useResourcePageAdapter,
  useResourceActions,
  useResourcePermissions,
  useResourcePageState,
} from '@/features/commons/hooks';
import { PaginationFooter } from '@/components/ui/blocks/PaginationFooter';
import { EndUserHeader } from '@/components/ui/blocks/ResourcePageHeader/EndUserHeader';
import { Button } from '@/components/ui/Button/Button';
import { ResourceTabs } from '@/components/ui/blocks/ResourceTabs';
import { ResourceErrorBoundary } from '@/components/ui/blocks/ResourceErrorBoundary';
import { ErrorState } from '@/components/ui/blocks/ErrorState';
import { DataTable } from '@/components/ui/blocks/DataTable';
import { AppsGrid } from '../components/AppsGrid';
import { transformAppsToAppRow } from '../adapters/homePageToAppRow';

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
  const {
    pageChanged,
    folderChanged,
    onSearch,
    deleteApp,
    cloneApp,
    exportApp,
    renameApp,
    customizeIcon,
    moveToFolder,
  } = rawActions;
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
    handlers: {
      deleteApp,
      cloneApp,
      exportApp,
      renameApp,
      customizeIcon,
      moveToFolder,
    },
    getPlayPath: (app) => `/${resolvedWorkspaceId}/applications/${app.slug}`,
    getEditPath: (app) => `/${resolvedWorkspaceId}/apps/${app.slug}`,
  });
  const actions = useMemo(
    () => ({
      play: actionsHandlers.handlePlay,
      edit: actionsHandlers.handleEdit,
      delete: actionsHandlers.handleDelete,
      clone: actionsHandlers.handleClone,
      export: actionsHandlers.handleExport,
      rename: actionsHandlers.handleRename,
      customizeIcon: actionsHandlers.handleCustomizeIcon,
      moveToFolder: actionsHandlers.handleMoveToFolder,
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
    data: { items: apps, isLoading: appsIsLoading, error: appsError, meta },
    filters: { searchKey: appSearchKey, currentFolder },
    actions: { pageChanged, onSearch },
    columns: finalColumns,
    transformFn: transformAppsToAppRow,
  });

  const breadcrumbItems = useMemo(
    () => [
      { label: 'Folders', href: '/folders' },
      { label: currentFolder?.name || 'All apps', href: null },
    ],
    [currentFolder]
  );

  console.log('End user apps table', data, finalTable?.getRowCount());

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

  const tabs = [
    {
      id: 'apps',
      label: 'Apps',
      content: appsContent,
      error: appsError || adapterError,
      errorState:
        appsError || adapterError ? (
          <ErrorState
            title="Failed to load apps"
            error={appsError || adapterError}
            onRetry={() => window.location.reload()}
          />
        ) : null,
      empty: appsEmpty,
      emptyState: <EmptyResource title="You don't have any apps yet" />,
    },
  ];

  return (
    <EndUserResourceShellView
      searchValue={appSearchKey}
      onSearch={onSearch}
      searchPlaceholder="Search apps..."
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
        <ResourceTabs activeTab="apps" onTabChange={() => {}} tabs={tabs} />
      </ResourceErrorBoundary>
    </EndUserResourceShellView>
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
