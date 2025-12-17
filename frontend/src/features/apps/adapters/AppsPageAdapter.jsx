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
import { MOCK_MODULES_DATA, MOCK_MODULES_META } from '../stories/mockData';
import { transformAppsToAppRow } from '../adapters/homePageToAppRow';
import { ResourceViewHeader } from '@/components/ui/blocks/ResourceViewHeader';
import { ResourceTabs } from '@/components/ui/blocks/ResourceTabs';
import { ResourceErrorBoundary } from '@/components/ui/blocks/ResourceErrorBoundary';
import { ErrorState } from '@/components/ui/blocks/ErrorState';
import { DataTable } from '@/components/ui/blocks/DataTable';
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
    onUpgrade,
    onCreateBlankApp,
    onBuildWithAI,
    onCreateModule,
  } = rawActions;
  const { appsLimit, modulesLimit } = subscriptionLimits;
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

  const { activeTab, setActiveTab, viewMode, setViewMode, isLoading } = useResourcePageState({
    initialTab: appType === 'module' ? 'modules' : 'apps',
    loadingStates: {
      apps: appsIsLoading,
      modules: modulesData.isLoading,
      folders: foldersLoading,
    },
  });

  // Check limit based on active tab
  const isLimitReached = useMemo(() => {
    if (activeTab === 'modules') {
      return modulesLimit && !modulesLimit.canAddUnlimited && modulesLimit.percentage >= 100;
    }
    return appsLimit && !appsLimit.canAddUnlimited && appsLimit.percentage >= 100;
  }, [activeTab, appsLimit, modulesLimit]);

  // Get the current limit based on active tab
  const currentLimit = activeTab === 'modules' ? modulesLimit : appsLimit;

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
    table: appsTable,
    isEmpty: appsEmpty,
    error: adapterError,
  } = useResourcePageAdapter({
    data: { items: apps, isLoading: appsIsLoading, error: appsError, meta },
    filters: { searchKey: appSearchKey, currentFolder },
    actions: { pageChanged, onSearch },
    columns: finalColumns,
    transformFn: transformAppsToAppRow,
  });

  const {
    table: modulesTable,
    isEmpty: modulesEmpty,
    error: modulesAdapterError,
  } = useResourcePageAdapter({
    data: {
      items: modulesData.data,
      isLoading: modulesData.isLoading,
      error: modulesData.error,
      meta: modulesData.meta,
    },
    filters: { searchKey: appSearchKey, currentFolder },
    actions: { pageChanged: undefined, onSearch },
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

  // Upgrade banner component (shows for both apps and modules)
  const upgradeBanner = useMemo(() => {
    if (!isLimitReached) return null;

    const currentCount = currentLimit?.current || 0;
    const resourceType = activeTab === 'modules' ? 'modules' : 'apps';

    return (
      <div
        className={cn('tw-flex tw-items-center tw-gap-3 tw-pl-3 tw-pr-3 tw-py-3 tw-rounded-xl')}
        style={{
          background:
            'linear-gradient(98deg, rgba(255, 255, 255, 0.04) 1.67%, rgba(142, 78, 198, 0.04) 39.08%, rgba(252, 95, 112, 0.04) 73.14%, rgba(252, 162, 63, 0.04) 100%)',
        }}
      >
        <span className="tw-font-title-default tw-text-text-default">
          {currentCount} {resourceType} built! Upgrade for more {resourceType}.
        </span>
        <Button variant="outline" size="default" isLucid={true} onClick={handleOpenDialog}>
          <Crown width={14} height={14} className="tw-text-background-premium" />
          Upgrade
        </Button>
      </div>
    );
  }, [isLimitReached, currentLimit, activeTab, handleOpenDialog]);

  // Normal action buttons (when limit not reached)
  const normalActionButtons = useMemo(() => {
    if (isLimitReached) return null;

    if (activeTab === 'modules') {
      // Module creation button
      if (!onCreateModule) return null;
      if (canCreateApp && typeof canCreateApp === 'function' && !canCreateApp()) return null;

      return (
        <Button variant="secondary" size="default" isLucid leadingIcon="plus" onClick={onCreateModule} className="">
          Create module
        </Button>
      );
    }

    // Apps tab buttons
    if (!onCreateBlankApp && !onBuildWithAI) return null;
    if (canCreateApp && typeof canCreateApp === 'function' && !canCreateApp()) return null;

    return (
      <>
        {onCreateBlankApp && (
          <Button variant="secondary" size="default" isLucid leadingIcon="plus" onClick={onCreateBlankApp} className="">
            Create blank app
          </Button>
        )}
        {onBuildWithAI && (
          <Button variant="outline" size="default" leadingIcon="tooljetai" onClick={onBuildWithAI}>
            Build with AI assistant
          </Button>
        )}
      </>
    );
  }, [isLimitReached, activeTab, onCreateModule, onCreateBlankApp, onBuildWithAI, canCreateApp]);

  const appsMenuItems = [
    {
      label: 'Create app from template',
      onClick: () => console.log('Import template'),
      icon: 'app-window',
    },
    {
      label: 'Import from device',
      onClick: () => console.log('Import template'),
      icon: 'file-down',
    },

    {
      label: 'Import app from Git repo',
      onClick: () => console.log('Import template'),
      icon: 'folder-git-2',
    },
  ];

  const modulesMenuItems = [
    {
      label: 'Create from template',
      onClick: () => console.log('Import template'),
      icon: 'app-window',
    },
  ];

  const contextMenuItems = activeTab === 'apps' ? appsMenuItems : modulesMenuItems;

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
      <DataTable
        key={`table-page-${pageIndex}`}
        table={table}
        isLoading={isLoading}
        skeleton={<ResourceTableSkeleton />}
      />
    ) : (
      <AppsGrid table={table} actions={actions} perms={computedPerms} canDelete={canDeletePerm} />
    );
  };

  const appsContent = renderContentView(appsTable, appsIsLoading);
  const modulesContent = renderContentView(modulesTable, modulesData.isLoading);

  // Get current page from table state to ensure PaginationFooter re-renders when it changes
  // Use the correct table based on active tab
  const activeTable = activeTab === 'modules' ? modulesTable : appsTable;
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
      emptyState: <EmptyResource title="You don't have any apps yet" />,
    },
    {
      id: 'modules',
      label: 'Modules',
      content: modulesContent,
      error: modulesAdapterError,
      errorState: modulesAdapterError ? (
        <EmptyResource
          title="Failed to load modules"
          description="Unable to fetch modules. Please try again."
          resourceType="modules"
          isError={true}
        >
          <Button variant="outline" size="default" onClick={() => window.location.reload()} className="tw-mt-4">
            Retry
          </Button>
        </EmptyResource>
      ) : null,
      empty: modulesEmpty,
      emptyState: (
        <EmptyResource
          title="You don't have any modules yet"
          description="Create reusable modules to use across multiple applications"
          resourceType="modules"
        />
      ),
    },
  ];

  // Determine header content: upgrade banner OR normal buttons
  const rightSlot = isLimitReached ? upgradeBanner : normalActionButtons;

  return (
    <>
      <ResourceShellView
        searchValue={appSearchKey}
        onSearch={onSearch}
        searchPlaceholder="Search apps..."
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
            title={activeTab === 'apps' ? 'Applications' : 'Modules'}
            rightSlot={rightSlot}
            contextMenuItems={contextMenuItems}
          />
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
      </ResourceShellView>
      {isLimitReached && (
        <UpgradePromptDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          currentCount={currentLimit?.current || 0}
          maxCount={currentLimit?.total || 0}
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
