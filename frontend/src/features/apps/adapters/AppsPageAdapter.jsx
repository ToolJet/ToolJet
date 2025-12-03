import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AppsShellView } from '../components/AppsShellView';
import { appsColumns } from '@/features/apps/columns';
import { useResourcePageAdapter } from '@/features/apps/hooks/useResourcePageAdapter';
import { useResourceActions } from '@/features/apps/hooks/useResourceActions';
import { useResourcePermissions } from '@/features/apps/hooks/useResourcePermissions';
import { PaginationFooter } from '@/components/ui/blocks/PaginationFooter';
import { EmptyNoApps } from '../components/EmptyNoApps';
import { AppsPageHeader } from '@/components/ui/blocks/AppsPageHeader';
import { MOCK_MODULES_DATA, MOCK_MODULES_META } from '../stories/mockData';
import { useResourcePageState } from '@/features/apps/hooks/useResourcePageState';
import { ResourceViewHeader } from '@/components/ui/blocks/ResourceViewHeader';
import { ResourceTabs } from '@/components/ui/blocks/ResourceTabs';
import { ResourceErrorBoundary } from '@/components/ui/blocks/ResourceErrorBoundary';
import { ErrorState } from '@/components/ui/blocks/ErrorState';
import { DataTable } from '@/components/ui/blocks/DataTable';
import { AppsTableSkeleton } from '@/features/apps/components/AppsTableSkeleton';
import { AppsGrid } from '../components/AppsGrid';
import { UpgradePromptDialog } from '@/components/ui/blocks/UpgradePromptDialog/UpgradePromptDialog';
import { Button } from '@/components/ui/Button/Button';
import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

function AppsPageAdapter({
  data = {},
  filters = {},
  actions: rawActions = {},
  permissions = {},
  navigation = {},
  layout = {},
  ui = {},
  subscriptionLimits = {},
}) {
  const { apps = [], isLoading: appsIsLoading, error: appsError, meta = {} } = data;
  const { appSearchKey = '', currentFolder = {}, folders = [], foldersLoading = false } = filters;
  const { pageChanged, folderChanged, onSearch, deleteApp, cloneApp, exportApp, onUpgrade } = rawActions;
  const { appsLimit } = subscriptionLimits;
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

  const [modulesData, setModulesData] = useState({
    data: [],
    isLoading: false,
    error: null,
    meta: {},
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  // Check if limit is reached
  const isLimitReached = appsLimit && !appsLimit.canAddUnlimited && appsLimit.percentage >= 100;

  // Open dialog automatically when limit is reached on page load
  useEffect(() => {
    if (isLimitReached) {
      setDialogOpen(true);
    }
  }, [isLimitReached]);

  // Handler for opening dialog
  const handleOpenDialog = React.useCallback(() => {
    setDialogOpen(true);
  }, []);

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

  const resolvedWorkspaceId = workspaceId || '';
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

  const {
    table: modulesTable,
    isEmpty: modulesEmpty,
    error: modulesAdapterError,
  } = useResourcePageAdapter({
    data: {
      apps: modulesData.data,
      isLoading: modulesData.isLoading,
      error: modulesData.error,
      meta: modulesData.meta,
    },
    filters: { appSearchKey, currentFolder },
    actions: { pageChanged: undefined, onSearch },
    columns: finalColumns,
  });

  const breadcrumbItems = useMemo(
    () => [
      { label: 'Folders', href: '/folders' },
      { label: currentFolder?.name || 'All apps', href: null },
    ],
    [currentFolder]
  );

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

  // Upgrade banner component
  const upgradeBanner = useMemo(() => {
    if (!isLimitReached) return null;

    const currentCount = appsLimit?.current || 0;

    return (
      <div
        className={cn('tw-flex tw-items-center tw-gap-3 tw-pl-3 tw-pr-3 tw-py-3 tw-rounded-xl')}
        style={{
          background:
            'linear-gradient(98deg, rgba(255, 255, 255, 0.04) 1.67%, rgba(142, 78, 198, 0.04) 39.08%, rgba(252, 95, 112, 0.04) 73.14%, rgba(252, 162, 63, 0.04) 100%)',
        }}
      >
        <span className="tw-font-title-default tw-text-text-default">
          {currentCount} apps built! Upgrade for more apps.
        </span>
        <Button variant="outline" size="default" isLucid={true} onClick={handleOpenDialog}>
          <Crown width={14} height={14} className="tw-text-background-premium" />
          Upgrade
        </Button>
      </div>
    );
  }, [isLimitReached, appsLimit, handleOpenDialog]);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    }
    setDialogOpen(false);
  };

  // Generic helper to render content based on view mode
  const renderContentView = (table, isLoading) => {
    // Use pageIndex as key to force re-render when pagination changes
    const pageIndex = table.getState().pagination.pageIndex;
    return viewMode === 'list' ? (
      <DataTable key={`table-page-${pageIndex}`} table={table} isLoading={isLoading} skeleton={<AppsTableSkeleton />} />
    ) : (
      <AppsGrid table={table} actions={actions} perms={computedPerms} canDelete={canDeletePerm} />
    );
  };

  const appsContent = renderContentView(finalTable, appsIsLoading);
  const modulesContent = renderContentView(modulesTable, modulesData.isLoading);

  // Get current page from table state to ensure PaginationFooter re-renders when it changes
  // Use the correct table based on active tab
  const activeTable = activeTab === 'modules' ? modulesTable : finalTable;
  const currentPage = activeTable.getState().pagination.pageIndex + 1;

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
      emptyState: <EmptyNoApps />,
    },
    {
      id: 'modules',
      label: 'Modules',
      content: modulesContent,
      error: modulesAdapterError,
      errorState: modulesAdapterError ? (
        <ErrorState
          title="Failed to load modules"
          error={modulesAdapterError}
          onRetry={() => window.location.reload()}
        />
      ) : null,
      empty: modulesEmpty,
      emptyState: <EmptyNoApps />,
    },
  ];

  return (
    <>
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
        sidebarUserMenuItems={sidebarUserMenuItems}
        sidebarPlatformVersion={sidebarPlatformVersion}
        darkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        header={
          <AppsPageHeader title={activeTab === 'apps' ? 'Applications' : 'Modules'} actionButtons={upgradeBanner} />
        }
        footer={<PaginationFooter table={activeTable} isLoading={isLoading} currentPage={currentPage} />}
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
      {isLimitReached && (
        <UpgradePromptDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          currentCount={appsLimit?.current || 0}
          maxCount={appsLimit?.total || 0}
          onUpgrade={handleUpgrade}
          hideBackdrop={true}
        />
      )}
    </>
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
  subscriptionLimits: PropTypes.object,
};

export default React.memo(AppsPageAdapter);
