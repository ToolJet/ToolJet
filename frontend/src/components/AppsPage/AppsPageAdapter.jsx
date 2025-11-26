import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AppsShellView } from './AppsShellView';
import { appsColumns } from '@/features/apps/columns';
import { useAppsPageAdapter } from '@/features/apps/hooks/useAppsPageAdapter';
import { useResourceActions } from '@/features/apps/hooks/useResourceActions';
import { useResourcePermissions } from '@/features/apps/hooks/useResourcePermissions';
import { PaginationFooter } from '@/components/ui/blocks/PaginationFooter';
import { EmptyNoApps } from '@/components/ui/blocks/EmptyNoApps';
import { AppsPageHeader } from '@/components/ui/blocks/AppsPageHeader';
import { transformAppsToAppRow } from '@/features/apps/adapters/homePageToAppRow';
import { useAppsTableState } from '@/features/apps/hooks/useAppsTableState';
import { MOCK_MODULES_DATA, MOCK_MODULES_META } from './stories/mockData';
import { useResourcePageState } from '@/features/apps/hooks/useResourcePageState';
import { ResourceViewHeader } from '@/components/ui/blocks/ResourceViewHeader/ResourceViewHeader';
import { ResourceTabs } from '@/components/ui/blocks/ResourceTabs/ResourceTabs';
import { ResourceErrorBoundary } from '@/components/ui/blocks/ResourceErrorBoundary/ResourceErrorBoundary';
import { ErrorState } from '@/components/ui/blocks/ErrorState/ErrorState';
import { DataTable } from '@/components/ui/blocks/DataTable/DataTable';
import { AppsGrid } from './AppsGrid';

function AppsPageAdapter({
  data = {},
  filters = {},
  actions: rawActions = {},
  permissions = {},
  navigation = {},
  layout = {},
  ui = {},
}) {
  const { apps = [], isLoading: appsIsLoading, error: appsError, meta = {} } = data;
  const { appSearchKey = '', currentFolder = {}, folders = [], foldersLoading = false } = filters;
  const { pageChanged, folderChanged, onSearch, deleteApp, cloneApp, exportApp } = rawActions;
  const { canCreateApp, canDeleteApp, canUpdateApp } = permissions;
  const { navigate, workspaceId, appType = 'front-end' } = navigation;
  const {
    workspaceName,
    workspaces = [],
    onWorkspaceChange,
    sidebarUser,
    sidebarTeams = [],
    sidebarNavMain = [],
    sidebarProjects = [],
  } = layout;
  const { darkMode: initialDarkMode } = ui;

  const [isDarkMode, setIsDarkMode] = useState(initialDarkMode ?? false);
  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  useEffect(() => {
    const body = document.body;
    const root = document.documentElement;
    if (isDarkMode) {
      body.classList.add('dark-theme');
      root.classList.add('dark-theme');
    } else {
      body.classList.remove('dark-theme');
      root.classList.remove('dark-theme');
    }
    return () => {
      body.classList.remove('dark-theme');
      root.classList.remove('dark-theme');
    };
  }, [isDarkMode]);

  const [modulesData, setModulesData] = useState({
    data: [],
    isLoading: false,
    error: null,
    meta: {},
  });

  const { activeTab, setActiveTab, viewMode, setViewMode, isLoading } = useResourcePageState({
    initialTab: appType === 'module' ? 'modules' : 'apps',
    loadingStates: {
      apps: appsIsLoading,
      modules: modulesData.isLoading,
      folders: foldersLoading,
    },
  });

  useEffect(() => {
    if (activeTab === 'modules') {
      setModulesData((prev) => ({ ...prev, isLoading: true, error: null }));
      setTimeout(() => {
        setModulesData({
          data: MOCK_MODULES_DATA,
          isLoading: false,
          error: null,
          meta: MOCK_MODULES_META,
        });
      }, 500);
    }
  }, [activeTab]);

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

  // TODO: Show errorstate within the Apps
  if (appsError || adapterError) {
    return (
      <ErrorState
        title="Failed to load apps"
        error={appsError || adapterError}
        onRetry={() => window.location.reload()}
      />
    );
  }

  const tabsConfig = [
    {
      id: 'apps',
      label: 'Apps',
      count: meta?.total_count || 0,
      loading: appsIsLoading,
    },
    {
      id: 'modules',
      label: 'Modules',
      count: modulesData.meta?.total_count || 0,
      loading: modulesData.isLoading,
    },
  ];

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
    {
      id: 'apps',
      content: appsContent,
      error: appsError,
      empty: appsEmpty,
      emptyState: <EmptyNoApps />,
    },
    {
      id: 'modules',
      content: modulesContent,
      error: modulesData.error,
      empty: modulesEmpty,
      emptyState: <EmptyNoApps />,
    },
  ];

  return (
    <AppsShellView
      searchValue={appSearchKey}
      onSearch={onSearch}
      workspaceName={workspaceName}
      workspaces={workspaces}
      onWorkspaceChange={onWorkspaceChange}
      sidebarUser={sidebarUser}
      sidebarTeams={sidebarTeams}
      sidebarNavMain={sidebarNavMain}
      sidebarProjects={sidebarProjects}
      darkMode={isDarkMode}
      onToggleDarkMode={toggleDarkMode}
      header={<AppsPageHeader title={activeTab === 'apps' ? 'Applications' : 'Modules'} />}
      footer={<PaginationFooter table={finalTable} isLoading={isLoading} />}
    >
      <ResourceErrorBoundary>
        <ResourceViewHeader
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabsConfig={tabsConfig}
          breadcrumbItems={breadcrumbItems}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          folders={folders}
          currentFolder={currentFolder}
          onFolderChange={folderChanged}
          foldersLoading={foldersLoading}
        />
        <ResourceTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
      </ResourceErrorBoundary>
    </AppsShellView>
  );
}

AppsPageAdapter.propTypes = {
  data: PropTypes.object,
  filters: PropTypes.object,
  actions: PropTypes.object,
  permissions: PropTypes.object,
  navigation: PropTypes.object,
  layout: PropTypes.object,
  ui: PropTypes.object,
};

export default React.memo(AppsPageAdapter);
