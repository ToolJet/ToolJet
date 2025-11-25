import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { EndUserShellView } from './EndUserShellView';
import { EndUserPageContent } from './EndUserPageContent';
import { appsColumns } from './AppsPage.columns';
import { useAppsPageAdapter } from '@/features/apps/hooks/useAppsPageAdapter';
import { useResourceActions } from '@/features/apps/hooks/useResourceActions';
import { useResourcePermissions } from '@/features/apps/hooks/useResourcePermissions';
import { TablePaginationFooter } from './TablePaginationFooter';
import { EmptyNoApps } from '@/components/ui/blocks/EmptyNoApps';
import { EndUserHeader } from '@/components/ui/blocks/AppsPageHeader/EndUserHeader';
import { transformAppsToAppRow } from '@/features/apps/adapters/homePageToAppRow';
import { Button } from '@/components/ui/Button/Button';
import { useAppsTableState } from '@/features/apps/hooks/useAppsTableState';
// import { getWorkspaceId } from '@/_helpers/utils';

/**
 * Adapter component that bridges HomePage's existing state/methods to new UI components.
 *
 * This component accepts HomePage's state and methods as props and renders the new
 * EndUserShellView + AppsTabs UI. It handles data transformation, permission mapping,
 * pagination, search, and row actions.
 *
 * Usage in HomePage.render():
 *   Replace the existing UI rendering with:
 *   <EndUserAppsPageAdapter
 *     apps={this.state.apps}
 *     isLoading={this.state.isLoading}
 *     error={this.state.error}
 *     meta={this.state.meta}
 *     currentFolder={this.state.currentFolder}
 *     appSearchKey={this.state.appSearchKey}
 *     pageChanged={this.pageChanged}
 *     folderChanged={this.folderChanged}
 *     onSearch={(key) => this.fetchApps(1, this.state.currentFolder.id, key)}
 *     canCreateApp={this.canCreateApp}
 *     canDeleteApp={this.canDeleteApp}
 *     canUpdateApp={this.canUpdateApp}
 *     deleteApp={this.deleteApp}
 *     cloneApp={this.cloneApp}
 *     exportApp={this.exportApp}
 *     navigate={this.props.navigate}
 *     folders={this.state.folders}
 *     foldersLoading={this.state.foldersLoading}
 *   />
 *
 * @component
 */
function EndUserAppsPageAdapter({
  data = {},
  filters = {},
  actions = {},
  permissions = {},
  navigation = {},
  layout = {},
  ui = {},
}) {
  // Destructure grouped props with defaults
  const { apps = [], isLoading = false, error = null, meta = {} } = data;

  const { appSearchKey = '', currentFolder = {}, folders = [], foldersLoading = false } = filters;

  const { pageChanged, folderChanged, onSearch, deleteApp, cloneApp, exportApp } = actions;

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

  // View state (list/grid toggle)
  const [viewAs, setViewAs] = useState('list');

  // Tab state (apps/modules) - for end users, default to apps only
  const [activeTab, setActiveTab] = useState('apps');

  // Modules data state - will be passed as props in Storybook
  const modulesData = {
    data: [],
    isLoading: false,
    error: null,
    meta: {},
  };

  // Prop validation with runtime checks (non-blocking, handled in render)
  const isValidApps = Array.isArray(apps);
  if (!isValidApps) {
    console.warn('EndUserAppsPageAdapter: apps must be an array, received:', typeof apps);
  }

  // Get workspaceId: use prop if provided, otherwise fallback to getWorkspaceId()
  // This allows Storybook to pass workspaceId without importing heavy utils
  const resolvedWorkspaceId = workspaceId || '32434r';

  // Use resource actions hook
  const actionsHandlers = useResourceActions({
    navigate,
    workspaceId: resolvedWorkspaceId,
    handlers: { deleteApp, cloneApp, exportApp },
  });

  // Use resource permissions hook
  const { permissions: computedPerms, canDelete } = useResourcePermissions({
    canCreateApp,
    canUpdateApp,
    canDeleteApp,
  });

  // Create columns with permissions and handlers
  const finalColumns = useMemo(() => {
    return appsColumns({
      perms: computedPerms,
      onPlay: actionsHandlers.handlePlay,
      onEdit: actionsHandlers.handleEdit,
      onClone: actionsHandlers.handleClone,
      onDelete: actionsHandlers.handleDelete,
      onExport: actionsHandlers.handleExport,
      canDelete: canDelete,
    });
  }, [computedPerms, actionsHandlers, canDelete]);

  // Use adapter hook with computed columns
  const {
    appRows: _finalAppRows,
    table: finalTable,
    getSearch: finalGetSearch,
    handleSearch: finalHandleSearch,
    handlePaginationChange: _finalHandlePaginationChange,
    appsEmpty: finalAppsEmpty,
    error: adapterError,
    isLoading: adapterIsLoading,
  } = useAppsPageAdapter({
    data: { apps, isLoading, error, meta },
    filters: { appSearchKey, currentFolder },
    actions: { pageChanged, onSearch },
    columns: finalColumns,
  });

  // Transform modules data
  const modulesRows = useMemo(() => {
    if (!modulesData.data || !Array.isArray(modulesData.data)) {
      return [];
    }
    try {
      return transformAppsToAppRow(modulesData.data);
    } catch (err) {
      console.error('Failed to transform modules:', err);
      return [];
    }
  }, [modulesData.data]);

  // Create modules table (only when modules tab is active)
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

  // Calculate modules empty state
  const hasQuery = !!(appSearchKey?.trim() || currentFolder?.id);
  const modulesEmpty = modulesData.data.length === 0 && !hasQuery && !modulesData.isLoading;

  // Build breadcrumb items dynamically based on current folder
  const breadcrumbItems = useMemo(() => {
    const currentFolderLabel = currentFolder?.name || 'All apps';
    return [
      { label: 'Folders', href: '/folders' },
      { label: currentFolderLabel, href: null },
    ];
  }, [currentFolder]);

  // Prop validation error rendering
  if (!isValidApps) {
    return (
      <div className="tw-p-6 tw-text-center" role="alert" aria-live="polite">
        <div className="tw-text-red-500 tw-mb-2">Invalid data</div>
        <div className="tw-text-sm tw-text-muted-foreground">Apps data is not in the expected format.</div>
      </div>
    );
  }

  // Error state rendering with accessibility
  if (error || adapterError) {
    const errorMessage = error?.message || adapterError?.message || 'An error occurred';
    return (
      <div className="tw-p-6 tw-text-center" role="alert" aria-live="polite" aria-atomic="true">
        <div className="tw-text-red-500 tw-mb-2" aria-label="Error message">
          Failed to load apps
        </div>
        <div className="tw-text-sm tw-text-muted-foreground" id="error-description">
          {errorMessage}
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="tw-mt-4 tw-px-4 tw-py-2 tw-bg-primary tw-text-white tw-rounded hover:tw-bg-primary/90"
          aria-label="Retry loading apps"
        >
          Retry
        </button>
      </div>
    );
  }

  // Pagination is now handled in useAppsPageAdapter hook via onPaginationChange callback
  // No need for additional sync here

  // Menu items based on permissions (use computedPerms since we computed it for columns)
  const appsMenuItems = computedPerms.canImport
    ? [
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
      ]
    : [];

  const _modulesMenuItems = computedPerms.canImport
    ? [
        {
          label: 'Create from template',
          onClick: () => console.log('Import template'),
          icon: 'app-window',
        },
      ]
    : [];

  return (
    <EndUserShellView
      searchValue={finalGetSearch()}
      onSearch={finalHandleSearch}
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
              <Button variant="secondary" size="default" isLucid leadingIcon="plus" onClick={() => {}} className="">
                Create blank app
              </Button>

              {/* Build with AI Button */}
              <Button variant="outline" size="default" leadingIcon="tooljetai" onClick={() => {}}>
                Build with AI assistant
              </Button>
            </>
          }
          createAppMenuItems={appsMenuItems}
          breadcrumbItems={breadcrumbItems}
          isLoading={foldersLoading}
          viewAs={viewAs}
          onViewChange={setViewAs}
          folders={folders}
          currentFolder={currentFolder}
          onFolderChange={folderChanged}
          foldersLoading={foldersLoading}
        />
      }
      footer={
        <TablePaginationFooter table={finalTable} isLoading={isLoading || adapterIsLoading || modulesData.isLoading} />
      }
      contentSlot={
        <EndUserPageContent
          appsTable={finalTable}
          modulesTable={modulesTableState.table}
          appsLoading={isLoading || adapterIsLoading}
          modulesLoading={modulesData.isLoading}
          appsError={error || adapterError}
          modulesError={modulesData.error}
          appsCount={meta?.total_count || 0}
          modulesCount={modulesData.meta?.total_count || 0}
          appsEmpty={finalAppsEmpty}
          modulesEmpty={modulesEmpty}
          emptyAppsSlot={<EmptyNoApps />}
          emptyModulesSlot={<EmptyNoApps />}
          folders={folders}
          currentFolder={currentFolder}
          onFolderChange={folderChanged}
          foldersLoading={foldersLoading}
          onPlay={actionsHandlers.handlePlay}
          onEdit={actionsHandlers.handleEdit}
          onClone={actionsHandlers.handleClone}
          onDelete={actionsHandlers.handleDelete}
          onExport={actionsHandlers.handleExport}
          perms={computedPerms}
          canDelete={canDelete}
          viewAs={viewAs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      }
    />
  );
}

EndUserAppsPageAdapter.propTypes = {
  data: PropTypes.shape({
    apps: PropTypes.arrayOf(PropTypes.object).isRequired,
    isLoading: PropTypes.bool,
    error: PropTypes.oneOfType([PropTypes.instanceOf(Error), PropTypes.string, PropTypes.object]),
    meta: PropTypes.shape({
      current_page: PropTypes.number,
      total_pages: PropTypes.number,
      total_count: PropTypes.number,
      per_page: PropTypes.number,
    }),
  }).isRequired,
  filters: PropTypes.shape({
    appSearchKey: PropTypes.string,
    currentFolder: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    }),
    folders: PropTypes.arrayOf(PropTypes.object),
    foldersLoading: PropTypes.bool,
  }),
  actions: PropTypes.shape({
    pageChanged: PropTypes.func,
    folderChanged: PropTypes.func,
    onSearch: PropTypes.func,
    deleteApp: PropTypes.func,
    cloneApp: PropTypes.func,
    exportApp: PropTypes.func,
  }),
  permissions: PropTypes.shape({
    canCreateApp: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
    canDeleteApp: PropTypes.func,
    canUpdateApp: PropTypes.func,
  }),
  navigation: PropTypes.shape({
    navigate: PropTypes.func,
    workspaceId: PropTypes.string,
    appType: PropTypes.oneOf(['front-end', 'module', 'workflow']),
  }),
  layout: PropTypes.shape({
    workspaceName: PropTypes.string,
    workspaces: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        logo: PropTypes.oneOfType([PropTypes.elementType, PropTypes.node]),
        plan: PropTypes.string,
      })
    ),
    onWorkspaceChange: PropTypes.func,
    sidebarUser: PropTypes.object,
    sidebarTeams: PropTypes.array,
    sidebarNavMain: PropTypes.array,
    sidebarProjects: PropTypes.array,
  }),
  ui: PropTypes.shape({
    darkMode: PropTypes.bool,
  }),
};

EndUserAppsPageAdapter.defaultProps = {
  data: {
    apps: [],
    isLoading: false,
    error: null,
    meta: {},
  },
  filters: {
    appSearchKey: '',
    currentFolder: {},
    folders: [],
    foldersLoading: false,
  },
  actions: {},
  permissions: {},
  navigation: {
    appType: 'front-end',
  },
  layout: {},
  ui: {},
};

export default React.memo(EndUserAppsPageAdapter);
