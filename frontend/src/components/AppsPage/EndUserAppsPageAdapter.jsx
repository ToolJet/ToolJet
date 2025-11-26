import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { EndUserShellView } from './EndUserShellView';
import { appsColumns } from '@/features/apps/columns';
import { useAppsPageAdapter } from '@/features/apps/hooks/useAppsPageAdapter';
import { useResourceActions } from '@/features/apps/hooks/useResourceActions';
import { useResourcePermissions } from '@/features/apps/hooks/useResourcePermissions';
import { PaginationFooter } from '@/components/ui/blocks/PaginationFooter';
import { EmptyNoApps } from '@/components/ui/blocks/EmptyNoApps';
import { EndUserHeader } from '@/components/ui/blocks/AppsPageHeader/EndUserHeader';
import { transformAppsToAppRow } from '@/features/apps/adapters/homePageToAppRow';
import { Button } from '@/components/ui/Button/Button';
import { useAppsTableState } from '@/features/apps/hooks/useAppsTableState';
import { useResourcePageState } from '@/features/apps/hooks/useResourcePageState';
import { ResourceTabs } from '@/components/ui/blocks/ResourceTabs/ResourceTabs';
import { ResourceErrorBoundary } from '@/components/ui/blocks/ResourceErrorBoundary/ResourceErrorBoundary';
import { ErrorState } from '@/components/ui/blocks/ErrorState/ErrorState';
import { DataTable } from '../ui/blocks/DataTable/DataTable';
import { AppsGrid } from './AppsGrid';

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
  const {
    workspaceName,
    workspaces = [],
    onWorkspaceChange,
    sidebarUser,
    sidebarTeams = [],
    sidebarNavMain = [],
    sidebarProjects = [],
  } = layout;

  const [modulesData] = useState({ data: [], isLoading: false, error: null, meta: {} });

  const { activeTab, setActiveTab, viewMode, setViewMode, isLoading } = useResourcePageState({
    initialTab: 'apps',
    loadingStates: { apps: appsIsLoading, modules: modulesData.isLoading, folders: foldersLoading },
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
    appsEmpty,
    error: adapterError,
  } = useAppsPageAdapter({
    data: { apps, isLoading: appsIsLoading, error: appsError, meta },
    filters: { appSearchKey, currentFolder },
    actions: { pageChanged, onSearch },
    columns: finalColumns,
  });

  const modulesRows = useMemo(() => {
    if (!modulesData.data?.length) return [];
    return transformAppsToAppRow(modulesData.data);
  }, [modulesData.data]);

  const modulesTableState = useAppsTableState({
    data: modulesRows,
    columns: finalColumns,
    initial: {
      globalFilter: appSearchKey || '',
      pagination: {
        pageIndex: Math.max(0, (modulesData.meta?.current_page || 1) - 1),
        pageSize: modulesData.meta?.per_page || 10,
      },
    },
  });

  const hasQuery = !!(appSearchKey?.trim() || currentFolder?.id);
  const modulesEmpty = modulesData.data.length === 0 && !hasQuery && !modulesData.isLoading;

  const breadcrumbItems = useMemo(
    () => [
      { label: 'Folders', href: '/folders' },
      { label: currentFolder?.name || 'All apps', href: null },
    ],
    [currentFolder]
  );

  const appsMenuItems = computedPerms.canImport
    ? [{ label: 'Create app from template', onClick: () => console.log('Import template'), icon: 'app-window' }]
    : [];

  if (appsError || adapterError) {
    return (
      <ErrorState
        title="Failed to load apps"
        error={appsError || adapterError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const appsContent =
    viewMode === 'list' ? (
      <DataTable table={finalTable} isLoading={appsIsLoading} />
    ) : (
      <AppsGrid table={finalTable} actions={actions} perms={computedPerms} canDelete={canDeletePerm} />
    );

  const modulesContent =
    viewMode === 'list' ? (
      <DataTable table={modulesTableState.table} isLoading={modulesData.isLoading} />
    ) : (
      <AppsGrid table={modulesTableState.table} actions={actions} perms={computedPerms} canDelete={canDeletePerm} />
    );

  const tabs = [
    { id: 'apps', content: appsContent, error: appsError, empty: appsEmpty, emptyState: <EmptyNoApps /> },
    {
      id: 'modules',
      content: modulesContent,
      error: modulesData.error,
      empty: modulesEmpty,
      emptyState: <EmptyNoApps />,
    },
  ];

  return (
    <EndUserShellView
      searchValue={appSearchKey}
      onSearch={onSearch}
      workspaceName={workspaceName}
      workspaces={workspaces}
      onWorkspaceChange={onWorkspaceChange}
      sidebarUser={sidebarUser}
      sidebarTeams={sidebarTeams}
      sidebarNavMain={sidebarNavMain}
      sidebarProjects={sidebarProjects}
      header={
        <EndUserHeader
          title={'Applications'}
          actionButtons={
            <>
              <Button variant="secondary" size="default" isLucid leadingIcon="plus" onClick={() => {}}>
                Create blank app
              </Button>
              <Button variant="outline" size="default" leadingIcon="tooljetai" onClick={() => {}}>
                Build with AI assistant
              </Button>
            </>
          }
          createAppMenuItems={appsMenuItems}
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
      footer={<PaginationFooter table={finalTable} isLoading={isLoading} />}
    >
      <ResourceErrorBoundary>
        <ResourceTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs.filter((t) => t.id === 'apps')} />
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
