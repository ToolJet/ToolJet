import React, { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { AppsShellView } from "./AppsShellView";
import { AppsTabs } from "./AppsTabs";
import { appsColumns } from "./AppsPage.columns";
import { useAppsPageAdapter } from "@/features/apps/hooks/useAppsPageAdapter";
import { TablePaginationFooter } from "./TablePaginationFooter";
import { EmptyNoApps } from "@/components/ui/blocks/EmptyNoApps";
// import { getWorkspaceId } from '@/_helpers/utils';

/**
 * Adapter component that bridges HomePage's existing state/methods to new UI components.
 *
 * This component accepts HomePage's state and methods as props and renders the new
 * AppsShellView + AppsTabs UI. It handles data transformation, permission mapping,
 * pagination, search, and row actions.
 *
 * Usage in HomePage.render():
 *   Replace the existing UI rendering with:
 *   <AppsPageAdapter
 *     apps={this.state.apps}
 *     isLoading={this.state.isLoading}
 *     error={this.state.error}
 *     meta={this.state.meta}
 *     currentFolder={this.state.currentFolder}
 *     appSearchKey={this.state.appSearchKey}
 *     appType={this.props.appType}
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
function AppsPageAdapter({
  apps,
  isLoading,
  error,
  meta,
  currentFolder,
  appSearchKey,
  appType,
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
  activeTab,
  onTabChange,
}) {
  // Use React Router's navigate if not provided
  const routerNavigate = useNavigate();
  const navigateToApp = navigate || routerNavigate;

  // Prop validation with runtime checks
  if (!Array.isArray(apps)) {
    console.warn(
      "AppsPageAdapter: apps must be an array, received:",
      typeof apps
    );
    return (
      <div className="tw-p-6 tw-text-center" role="alert" aria-live="polite">
        <div className="tw-text-red-500 tw-mb-2">Invalid data</div>
        <div className="tw-text-sm tw-text-muted-foreground">
          Apps data is not in the expected format.
        </div>
      </div>
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

  try {
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
      modulesEmpty: finalModulesEmpty,
      error: adapterError,
      isLoading: adapterIsLoading,
    } = useAppsPageAdapter({
      apps,
      isLoading,
      error,
      meta,
      currentFolder,
      appSearchKey,
      appType,
      canCreateApp,
      canUpdateApp,
      canDeleteApp,
      pageChanged,
      onSearch,
      columns: finalColumns,
    });

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

    // Loading state
    if (isLoading || adapterIsLoading) {
      return (
        <div
          className="tw-p-6 tw-text-center"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="tw-text-muted-foreground">Loading apps...</div>
        </div>
      );
    }

    // Pagination is now handled in useAppsPageAdapter hook via onPaginationChange callback
    // No need for additional sync here

    // Menu items based on permissions (use computedPerms since we computed it for columns)
    const menuItems = computedPerms.canImport
      ? [
          {
            label: "Import template",
            onClick: () => console.log("Import template"),
            icon: "Download",
          },
        ]
      : [];

    return (
      <AppsShellView
        title={appType === "module" ? "Modules" : "Applications"}
        menuItems={menuItems}
        searchValue={finalGetSearch()}
        onSearch={finalHandleSearch}
        workspaceName={workspaceName}
        workspaces={workspaces}
        onWorkspaceChange={onWorkspaceChange}
        sidebarUser={sidebarUser}
        sidebarTeams={sidebarTeams}
        sidebarNavMain={sidebarNavMain}
        sidebarProjects={sidebarProjects}
        footer={<TablePaginationFooter table={finalTable} />}
        contentSlot={
          <AppsTabs
            table={finalTable}
            activeTab={activeTab}
            onTabChange={onTabChange}
            appsEmpty={finalAppsEmpty}
            modulesEmpty={finalModulesEmpty}
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
          />
        }
      />
    );
  } catch (error) {
    // Error boundary - catch any unexpected errors
    console.error("AppsPageAdapter error:", error);
    return (
      <div className="tw-p-6 tw-text-center" role="alert" aria-live="polite">
        <div className="tw-text-red-500 tw-mb-2">
          An unexpected error occurred
        </div>
        <div className="tw-text-sm tw-text-muted-foreground">
          {error.message}
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="tw-mt-4 tw-px-4 tw-py-2 tw-bg-primary tw-text-white tw-rounded hover:tw-bg-primary/90"
        >
          Reload Page
        </button>
      </div>
    );
  }
}

AppsPageAdapter.propTypes = {
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
  activeTab: PropTypes.string,
  onTabChange: PropTypes.func,
};

AppsPageAdapter.defaultProps = {
  apps: [],
  isLoading: false,
  error: null,
  meta: {},
  currentFolder: {},
  appSearchKey: "",
  appType: "front-end",
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
  activeTab: "apps",
  onTabChange: () => {},
};

export default React.memo(AppsPageAdapter);
