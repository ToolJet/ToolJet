import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ResourceShellView, EmptyResource, ResourceTableSkeleton } from '@/features/commons/components';
import { datasourcesColumns } from '@/features/commons/columns';
import {
  useResourcePageAdapter,
  useResourceActions,
  useResourcePermissions,
  useResourcePageState,
} from '@/features/commons/hooks';
import { PaginationFooter } from '@/components/ui/blocks/PaginationFooter';
import { ResourcePageHeader } from '@/components/ui/blocks/ResourcePageHeader';
import { ResourceTabs } from '@/components/ui/blocks/ResourceTabs';
import { ResourceErrorBoundary } from '@/components/ui/blocks/ResourceErrorBoundary';
import { ErrorState } from '@/components/ui/blocks/ErrorState';
import { DataTable } from '@/components/ui/blocks/DataTable';
import { Button } from '@/components/ui/Button/Button';
import { CommonDatasourceSheet } from '@/features/datasources/components/CommonDatasourceSheet';
import { CreateDatasourceContent } from '@/features/datasources/components/CreateDatasourceContent';
import { ConfigureDatasourceContent } from '@/features/datasources/components/ConfigureDatasourceContent';
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
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [configSheetOpen, setConfigSheetOpen] = useState(false);
  const [selectedDatasource, setSelectedDatasource] = useState(null);
  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const handleCreateDatasource = () => {
    setCreateSheetOpen(true);
  };

  const handleSelectDatasource = (datasource) => {
    setCreateSheetOpen(false);
    setSelectedDatasource(datasource);
    setConfigSheetOpen(true);
  };

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

  const { activeTab, setActiveTab, isLoading } = useResourcePageState({
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
      configure: (datasource) => {
        setSelectedDatasource(datasource);
        setConfigSheetOpen(true);
      },
      rename: actionsHandlers.handleEdit,
      duplicate: actionsHandlers.handleClone,
      managePermissions: actionsHandlers.handleEdit,
      delete: actionsHandlers.handleDelete,
    }),
    [actionsHandlers]
  );

  const { permissions: computedPerms, canDelete: canDeletePerm } = useResourcePermissions({
    canCreateResource: canCreateDatasource,
    canUpdateResource: canUpdateDatasource,
    canDeleteResource: canDeleteDatasource,
  });

  const finalColumns = useMemo(
    () => datasourcesColumns({ perms: computedPerms, actions, canDelete: canDeletePerm }),
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

  const normalActionButtons = useMemo(() => {
    if (isLimitReached) return null;
    if (!canCreateDatasource || (typeof canCreateDatasource === 'function' && !canCreateDatasource())) return null;

    return (
      <Button variant="secondary" size="default" isLucid leadingIcon="plus" onClick={handleCreateDatasource}>
        Create datasource
      </Button>
    );
  }, [isLimitReached, canCreateDatasource]);

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

  const emptyStateWithButton = (
    <div className="tw-flex tw-flex-col tw-items-center">
      <EmptyResource title="You don't have any datasources yet" />
      {!isLimitReached && canCreateDatasource && (
        <Button variant="primary" size="default" leadingIcon="plus" onClick={handleCreateDatasource} className="tw-mt-4">
          Create datasource
        </Button>
      )}
    </div>
  );

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
      emptyState: emptyStateWithButton,
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
          <ResourceTabs activeTab={activeTab} onTabChange={setActiveTab} tabs={tabs} />
        </ResourceErrorBoundary>
      </ResourceShellView>

      <CommonDatasourceSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        title="Select datasource"
      >
        <CreateDatasourceContent onSelectDatasource={handleSelectDatasource} />
      </CommonDatasourceSheet>

      <CommonDatasourceSheet
        open={configSheetOpen}
        onOpenChange={setConfigSheetOpen}
        title={selectedDatasource ? `Configure ${selectedDatasource.name}` : 'Configure datasource'}
      >
        <ConfigureDatasourceContent datasource={selectedDatasource} />
      </CommonDatasourceSheet>
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
