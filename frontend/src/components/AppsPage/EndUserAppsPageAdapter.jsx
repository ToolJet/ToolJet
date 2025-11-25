import React, { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { EndUserShellView } from "./EndUserShellView";
import { EndUserPageContent } from "./EndUserPageContent";
import { appsColumns } from "./AppsPage.columns";
import { useAppsPageAdapter } from "@/features/apps/hooks/useAppsPageAdapter";
import { TablePaginationFooter } from "./TablePaginationFooter";
import { EmptyNoApps } from "@/components/ui/blocks/EmptyNoApps";
import { EndUserHeader } from "@/components/ui/blocks/AppsPageHeader/EndUserHeader";
import { transformAppsToAppRow } from "@/features/apps/adapters/homePageToAppRow";
import { Button } from "@/components/ui/Button/Button";
import { useAppsTableState } from "@/features/apps/hooks/useAppsTableState";
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
  apps,
  isLoading,
  error,
  meta,
  currentFolder,
  appSearchKey,
  pageChanged,
  folderChanged,
  onSearch,
  canCreateApp,
  canDeleteApp,
  canUpdateApp,
  deleteApp,
  cloneApp,
  exportApp,
  navigate,
  workspaceId,
  folders,
  foldersLoading,
  // Workspace switcher props (for Storybook and layouts)
  workspaceName,
  workspaces,
  onWorkspaceChange,
  // Sidebar props (for Storybook and layouts)
  sidebarUser,
  sidebarTeams,
  sidebarNavMain,
  sidebarProjects,
}) {
  // Use React Router's navigate if not provided
  const routerNavigate = useNavigate();
  const navigateToApp = navigate || routerNavigate;

  // View state (list/grid toggle)
  const [viewAs, setViewAs] = useState("list");

  // Tab state (apps/modules) - for end users, default to apps only
  const [activeTab, setActiveTab] = useState("apps");

  // Modules data state
  const [modulesData, setModulesData] = useState({
    data: [],
    isLoading: false,
    error: null,
    meta: {},
  });

  // Mock modules data - simulate loading state on tab switch
  useEffect(() => {
    // Simulate loading
    setModulesData((prev) => ({ ...prev, isLoading: true, error: null }));

    // Simulate async fetch with setTimeout
    setTimeout(() => {
      // Mock modules data in the same format as apps from HomePage
      const mockModules = [
        {
          id: "module-1",
          name: "User Management Module",
          updated_at: new Date().toISOString(),
          user: { name: "John Doe" },
          slug: "user-management",
          icon: null,
          is_public: false,
          folder_id: null,
          user_id: 1,
        },
        {
          id: "module-2",
          name: "Dashboard Module",
          updated_at: new Date().toISOString(),
          user: { name: "Jane Smith" },
          slug: "dashboard",
          icon: null,
          is_public: true,
          folder_id: null,
          user_id: 2,
        },
        {
          id: "module-3",
          name: "Analytics Module",
          updated_at: new Date().toISOString(),
          user: { name: "Bob Wilson" },
          slug: "analytics",
          icon: null,
          is_public: false,
          folder_id: null,
          user_id: 3,
        },
      ];

      setModulesData({
        data: mockModules,
        isLoading: false,
        error: null,
        meta: {
          current_page: 1,
          total_pages: 1,
          total_count: mockModules.length,
          per_page: 10,
        },
      });
    }, 500); // Simulate 500ms loading delay
  }, []);

  // Prop validation with runtime checks (non-blocking, handled in render)
  const isValidApps = Array.isArray(apps);
  if (!isValidApps) {
    console.warn(
      "EndUserAppsPageAdapter: apps must be an array, received:",
      typeof apps
    );
  }

  // Get workspaceId: use prop if provided, otherwise fallback to getWorkspaceId()
  // This allows Storybook to pass workspaceId without importing heavy utils
  const resolvedWorkspaceId = workspaceId || "32434r";

  // folderChanged handler is stored for future use
  // Note: Folder filtering UI is not yet implemented in the new components
  // This handler is ready to be passed to a future FolderFilter component
  // eslint-disable-next-line no-unused-vars
  const folderChangedHandler = folderChanged;

  // Row action handlers with error handling
  const handlePlay = useCallback(
    (appRow) => {
      try {
        const originalApp = appRow?._originalApp;
        if (!originalApp) {
          console.warn("Missing _originalApp in appRow for play action");
          return;
        }

        if (navigateToApp && typeof navigateToApp === "function") {
          navigateToApp(
            `/${resolvedWorkspaceId}/applications/${originalApp.slug}`
          );
        } else {
          window.location.href = `/${resolvedWorkspaceId}/applications/${originalApp.slug}`;
        }
      } catch (err) {
        console.error("Failed to navigate to app (play):", err);
      }
    },
    [navigateToApp, resolvedWorkspaceId]
  );

  const handleEdit = useCallback(
    (appRow) => {
      try {
        const originalApp = appRow?._originalApp;
        if (!originalApp) {
          console.warn("Missing _originalApp in appRow for edit action");
          return;
        }

        if (navigateToApp && typeof navigateToApp === "function") {
          navigateToApp(`/${resolvedWorkspaceId}/apps/${originalApp.slug}`);
        } else {
          window.location.href = `/${resolvedWorkspaceId}/apps/${originalApp.slug}`;
        }
      } catch (err) {
        console.error("Failed to navigate to app (edit):", err);
      }
    },
    [navigateToApp, resolvedWorkspaceId]
  );

  const handleDelete = useCallback(
    (appRow) => {
      try {
        const originalApp = appRow?._originalApp;
        if (!originalApp || !deleteApp) {
          console.warn("Missing _originalApp or deleteApp handler");
          return;
        }

        // Confirm before deleting (HomePage might handle this, but we'll add a safety check)
        if (
          window.confirm(
            `Are you sure you want to delete "${originalApp.name}"?`
          )
        ) {
          deleteApp(originalApp);
        }
      } catch (err) {
        console.error("Failed to delete app:", err);
      }
    },
    [deleteApp]
  );

  const handleClone = useCallback(
    (appRow) => {
      try {
        const originalApp = appRow?._originalApp;
        if (!originalApp || !cloneApp) {
          console.warn("Missing _originalApp or cloneApp handler");
          return;
        }
        // HomePage.cloneApp expects (appName, appId)
        cloneApp(originalApp.name, originalApp.id);
      } catch (err) {
        console.error("Failed to clone app:", err);
      }
    },
    [cloneApp]
  );

  const handleExport = useCallback(
    (appRow) => {
      try {
        const originalApp = appRow?._originalApp;
        if (!originalApp || !exportApp) {
          console.warn("Missing _originalApp or exportApp handler");
          return;
        }
        exportApp(originalApp);
      } catch (err) {
        console.error("Failed to export app:", err);
      }
    },
    [exportApp]
  );

  // Compute permissions first (needed for columns) - we need this before hook call
  const computedPerms = useMemo(() => {
    try {
      const canImport =
        typeof canCreateApp === "function"
          ? canCreateApp()
          : canCreateApp ?? false;
      const canEdit = (appRow) => {
        const originalApp = appRow?._originalApp;
        if (!originalApp) return false;
        try {
          return typeof canUpdateApp === "function"
            ? canUpdateApp(originalApp)
            : false;
        } catch (err) {
          console.error("Permission check failed:", err);
          return false;
        }
      };
      return { canImport, canEdit, canPlay: canEdit };
    } catch (err) {
      console.error("Failed to compute permissions:", err);
      return { canImport: false, canEdit: () => false, canPlay: () => false };
    }
  }, [canCreateApp, canUpdateApp]);

  // Create canDelete function for permission checking
  const canDelete = useCallback(
    (appRow) => {
      try {
        const originalApp = appRow?._originalApp;
        if (!originalApp || !canDeleteApp) return false;
        return typeof canDeleteApp === "function"
          ? canDeleteApp(originalApp)
          : false;
      } catch (err) {
        console.error("Delete permission check failed:", err);
        return false;
      }
    },
    [canDeleteApp]
  );

  // Create columns with permissions and handlers
  const finalColumns = useMemo(() => {
    return appsColumns({
      perms: computedPerms,
      onPlay: handlePlay,
      onEdit: handleEdit,
      onClone: handleClone,
      onDelete: handleDelete,
      onExport: handleExport,
      canDelete: canDelete,
    });
  }, [
    computedPerms,
    handlePlay,
    handleEdit,
    handleClone,
    handleDelete,
    handleExport,
    canDelete,
  ]);

  // Use adapter hook with computed columns
  const {
    appRows: _finalAppRows,
    perms: _hookPerms, // Use hook's perms for consistency (though we computed our own)
    table: finalTable,
    getSearch: finalGetSearch,
    handleSearch: finalHandleSearch,
    handlePaginationChange: _finalHandlePaginationChange,
    appsEmpty: finalAppsEmpty,
    modulesEmpty: _finalModulesEmpty,
    error: adapterError,
    isLoading: adapterIsLoading,
  } = useAppsPageAdapter({
    apps,
    isLoading,
    error,
    meta,
    currentFolder,
    appSearchKey,
    canCreateApp,
    canUpdateApp,
    canDeleteApp,
    pageChanged,
    onSearch,
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
      console.error("Failed to transform modules:", err);
      return [];
    }
  }, [modulesData.data]);

  // Create modules table (only when modules tab is active)
  const modulesTableState = useAppsTableState({
    data: modulesRows,
    columns: finalColumns,
    initial: {
      globalFilter: appSearchKey || "",
      pagination: {
        pageIndex: Math.max(0, (modulesData.meta?.current_page || 1) - 1),
        pageSize: modulesData.meta?.per_page || 10,
      },
    },
  });

  // Calculate modules empty state
  const hasQuery = !!(appSearchKey?.trim() || currentFolder?.id);
  const modulesEmpty =
    modulesData.data.length === 0 && !hasQuery && !modulesData.isLoading;

  // Build breadcrumb items dynamically based on current folder
  const breadcrumbItems = useMemo(() => {
    const currentFolderLabel = currentFolder?.name || "All apps";
    return [
      { label: "Folders", href: "/folders" },
      { label: currentFolderLabel, href: null },
    ];
  }, [currentFolder]);

  // Prop validation error rendering
  if (!isValidApps) {
    return (
      <div className="tw-p-6 tw-text-center" role="alert" aria-live="polite">
        <div className="tw-text-red-500 tw-mb-2">Invalid data</div>
        <div className="tw-text-sm tw-text-muted-foreground">
          Apps data is not in the expected format.
        </div>
      </div>
    );
  }

  // Error state rendering with accessibility
  if (error || adapterError) {
    const errorMessage =
      error?.message || adapterError?.message || "An error occurred";
    return (
      <div
        className="tw-p-6 tw-text-center"
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="tw-text-red-500 tw-mb-2" aria-label="Error message">
          Failed to load apps
        </div>
        <div
          className="tw-text-sm tw-text-muted-foreground"
          id="error-description"
        >
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
          label: "Create app from template",
          onClick: () => console.log("Import template"),
          icon: "app-window",
        },
        {
          label: "Import from device",
          onClick: () => console.log("Import template"),
          icon: "file-down",
        },

        {
          label: "Import app from Git repo",
          onClick: () => console.log("Import template"),
          icon: "folder-git-2",
        },
      ]
    : [];

  const _modulesMenuItems = computedPerms.canImport
    ? [
        {
          label: "Create from template",
          onClick: () => console.log("Import template"),
          icon: "app-window",
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
          title={"Applications"}
          actionButtons={
            <>
              <Button
                variant="secondary"
                size="default"
                isLucid
                leadingIcon="plus"
                onClick={() => {}}
                className=""
              >
                Create blank app
              </Button>

              {/* Build with AI Button */}
              <Button
                variant="outline"
                size="default"
                leadingIcon="tooljetai"
                onClick={() => {}}
              >
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
        <TablePaginationFooter
          table={finalTable}
          isLoading={isLoading || adapterIsLoading || modulesData.isLoading}
        />
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
          onPlay={handlePlay}
          onEdit={handleEdit}
          onClone={handleClone}
          onDelete={handleDelete}
          onExport={handleExport}
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
  apps: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.oneOfType([
    PropTypes.instanceOf(Error),
    PropTypes.string,
    PropTypes.object,
  ]),
  meta: PropTypes.shape({
    current_page: PropTypes.number,
    total_pages: PropTypes.number,
    total_count: PropTypes.number,
    per_page: PropTypes.number,
  }),
  currentFolder: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
  }),
  appSearchKey: PropTypes.string,
  appType: PropTypes.oneOf(["front-end", "module", "workflow"]),
  pageChanged: PropTypes.func,
  folderChanged: PropTypes.func,
  onSearch: PropTypes.func,
  canCreateApp: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  canDeleteApp: PropTypes.func,
  canUpdateApp: PropTypes.func,
  deleteApp: PropTypes.func,
  cloneApp: PropTypes.func,
  exportApp: PropTypes.func,
  navigate: PropTypes.func,
  workspaceId: PropTypes.string,
  folders: PropTypes.arrayOf(PropTypes.object),
  foldersLoading: PropTypes.bool,
  // Workspace switcher props
  workspaceName: PropTypes.string,
  workspaces: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      logo: PropTypes.oneOfType([PropTypes.elementType, PropTypes.node]),
      plan: PropTypes.string,
    })
  ),
  onWorkspaceChange: PropTypes.func,
  // Sidebar props
  sidebarUser: PropTypes.object,
  sidebarTeams: PropTypes.array,
  sidebarNavMain: PropTypes.array,
  sidebarProjects: PropTypes.array,
};

EndUserAppsPageAdapter.defaultProps = {
  apps: [],
  isLoading: false,
  error: null,
  meta: {},
  currentFolder: {},
  appSearchKey: "",
  workspaceId: undefined,
  folders: [],
  foldersLoading: false,
  workspaceName: undefined,
  workspaces: [],
  onWorkspaceChange: undefined,
  sidebarUser: undefined,
  sidebarTeams: undefined,
  sidebarNavMain: undefined,
  sidebarProjects: undefined,
};

export default React.memo(EndUserAppsPageAdapter);
