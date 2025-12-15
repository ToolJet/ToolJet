import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ResourceShellView, EmptyResource, ResourceTableSkeleton } from '@/features/commons/components';
import { appsColumns } from '@/features/commons/columns';
import {
  useResourcePageAdapter,
  useResourceActions,
  useResourcePermissions,
  useResourcePageState,
} from '@/features/commons/hooks';
import { PaginationFooter } from '@/components/ui/blocks/PaginationFooter';
import { ResourcePageHeader } from '@/components/ui/blocks/ResourcePageHeader';
import { ResourceViewHeader } from '@/components/ui/blocks/ResourceViewHeader';
import { ResourceTabs } from '@/components/ui/blocks/ResourceTabs';
import { ResourceErrorBoundary } from '@/components/ui/blocks/ResourceErrorBoundary';
import { ErrorState } from '@/components/ui/blocks/ErrorState';
import { DataTable } from '@/components/ui/blocks/DataTable';
import { Button } from '@/components/ui/Button/Button';
import { transformDatasourcesToDatasourceRow } from './homePageToDatasourceRow';

function DatasourcesPageAdapter({
  data = {},
  filters = {},
  actions: rawActions = {},
  permissions = {},
  navigation = {},
  layout = {},
  ui = {},
  subscriptionLimits = {},
}) {
  const { datasources = [], isLoading: datasourcesIsLoading, error: datasourcesError, meta = {} } = data;

  const {
    datasourceSearchKey = '',
    currentEnvironment = null,
    environments = [],
    environmentsLoading = false,
  } = filters;

  const {
    pageChanged,
    environmentChanged,
    onSearch,
    deleteDatasource,
    testConnection,
    reloadDatasources,
    duplicateDatasource,
    createDatasource,
  } = rawActions;

  const { datasourcesLimit } = subscriptionLimits;
  const { canCreateDatasource, canDeleteDatasource, canUpdateDatasource } = permissions;
  const { navigate, workspaceId } = navigation;

  const {
    workspaceName,
    workspaces = [],
    onWorkspaceChange,
    sidebarUser,
    sidebarTeams = [],
    sidebarNavMain = [],
    sidebarProjects = [],
    sidebarUserMenuItems,
    sidebarPlatformVersion,
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

  const { activeTab, setActiveTab, viewMode, setViewMode, isLoading } = useResourcePageState({
    initialTab: 'datasources',
    loadingStates: {
      datasources: datasourcesIsLoading,
      environments: environmentsLoading,
    },
  });

  // Check limit
  const isLimitReached = useMemo(() => {
    return datasourcesLimit && !datasourcesLimit.canAddUnlimited && datasourcesLimit.percentage >= 100;
  }, [datasourcesLimit]);

  const resolvedWorkspaceId = workspaceId || '';

  const actionsHandlers = useResourceActions({
    navigate,
    workspaceId: resolvedWorkspaceId,
    handlers: {
      deleteApp: deleteDatasource,
      cloneApp: duplicateDatasource,
      exportApp: testConnection,
      renameApp: reloadDatasources,
    },
    getPlayPath: (datasource) => `/${resolvedWorkspaceId}/datasources/${datasource.id}/edit`,
    getEditPath: (datasource) => `/${resolvedWorkspaceId}/datasources/${datasource.id}/edit`,
  });

  const actions = useMemo(
    () => ({
      edit: actionsHandlers.handleEdit,
      delete: actionsHandlers.handleDelete,
      duplicate: actionsHandlers.handleClone,
      testConnection: actionsHandlers.handleExport,
    }),
    [actionsHandlers]
  );

  const { permissions: computedPerms, canDelete: canDeletePerm } = useResourcePermissions({
    canCreateResource: canCreateDatasource,
    canUpdateResource: canUpdateDatasource,
    canDeleteResource: canDeleteDatasource,
  });

  const finalColumns = useMemo(
    () => appsColumns({ perms: computedPerms, actions, canDelete: canDeletePerm }),
    [computedPerms, actions, canDeletePerm]
  );

  const {
    table: datasourcesTable,
    isEmpty: datasourcesEmpty,
    error: adapterError,
  } = useResourcePageAdapter({
    data: { items: datasources, isLoading: datasourcesIsLoading, error: datasourcesError, meta },
    filters: { searchKey: datasourceSearchKey, currentFolder: currentEnvironment },
    actions: { pageChanged, onSearch },
    columns: finalColumns,
    transformFn: transformDatasourcesToDatasourceRow,
  });

  const breadcrumbItems = useMemo(
    () => [
      { label: 'Data sources', href: null },
      { label: currentEnvironment?.name || 'All environments', href: null },
    ],
    [currentEnvironment]
  );

  const tabsConfig = [
    {
      id: 'datasources',
      label: 'Datasources',
      count: meta?.total_count || 0,
      loading: datasourcesIsLoading,
    },
  ];

  const normalActionButtons = useMemo(() => {
    if (isLimitReached) return null;
    if (!canCreateDatasource || (typeof canCreateDatasource === 'function' && !canCreateDatasource())) return null;

    return (
      <Button variant="secondary" size="default" isLucid leadingIcon="plus" onClick={createDatasource}>
        Create datasource
      </Button>
    );
  }, [isLimitReached, createDatasource, canCreateDatasource]);

  const datasourcesMenuItems = [
    {
      label: 'Import from existing',
      onClick: () => console.log('Import datasource'),
      icon: 'file-down',
    },
  ];

  const pageIndex = datasourcesTable.getState().pagination.pageIndex;

  const datasourcesContent = (
    <DataTable
      key={`table-page-${pageIndex}`}
      table={datasourcesTable}
      isLoading={datasourcesIsLoading}
      skeleton={<ResourceTableSkeleton />}
    />
  );

  const datasourcesError_ = datasourcesError || adapterError;

  const tabs = [
    {
      id: 'datasources',
      label: 'Datasources',
      content: datasourcesContent,
      error: datasourcesError_,
      errorState: datasourcesError_ ? (
        <ErrorState
          title="Failed to load datasources"
          error={datasourcesError_}
          onRetry={() => window.location.reload()}
        />
      ) : null,
      empty: datasourcesEmpty,
      emptyState: <EmptyResource title="You don't have any datasources yet" />,
    },
  ];

  const currentPage = datasourcesTable.getState().pagination.pageIndex + 1;

  return (
    <>
      <ResourceShellView
        searchValue={datasourceSearchKey}
        onSearch={onSearch}
        searchPlaceholder="Search datasources..."
        workspaceName={workspaceName}
        workspaces={workspaces}
        onWorkspaceChange={onWorkspaceChange}
        sidebarUser={sidebarUser}
        sidebarTeams={sidebarTeams}
        sidebarNavMain={sidebarNavMain}
        sidebarProjects={sidebarProjects}
        sidebarUserMenuItems={sidebarUserMenuItems}
        sidebarPlatformVersion={sidebarPlatformVersion}
        darkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        header={
          <ResourcePageHeader
            title="Data sources"
            rightSlot={normalActionButtons}
            contextMenuItems={datasourcesMenuItems}
          />
        }
        footer={<PaginationFooter table={datasourcesTable} isLoading={isLoading} currentPage={currentPage} />}
      >
        <ResourceErrorBoundary>
          <ResourceViewHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabsConfig={tabsConfig}
            breadcrumbItems={breadcrumbItems}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            folders={environments}
            currentFolder={currentEnvironment}
            onFolderChange={environmentChanged}
            foldersLoading={environmentsLoading}
          />
          <ResourceTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
        </ResourceErrorBoundary>
      </ResourceShellView>
    </>
  );
}

DatasourcesPageAdapter.propTypes = {
  data: PropTypes.object,
  filters: PropTypes.object,
  actions: PropTypes.object,
  permissions: PropTypes.object,
  navigation: PropTypes.object,
  layout: PropTypes.object,
  ui: PropTypes.object,
  subscriptionLimits: PropTypes.object,
};

export default React.memo(DatasourcesPageAdapter);
