import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ResourceShellView, EmptyResource, ResourceTableSkeleton } from '@/features/commons/components';
import { workflowsColumns } from '@/features/commons/columns';
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
import { ResourceViewHeader } from '@/components/ui/blocks/ResourceViewHeader';
import { WorkflowsGrid } from '@/features/workflows/WorkflowsGrid';
import { ErrorState } from '@/components/ui/blocks/ErrorState';
import { DataTable } from '@/components/ui/blocks/DataTable';
import { Button } from '@/components/ui/Button/Button';
import { CommonWorkflowSheet } from '@/features/workflows/components/CommonWorkflowSheet';
import { CreateWorkflowContent } from '@/features/workflows/components/CreateWorkflowContent';
import { ConfigureWorkflowContent } from '@/features/workflows/components/ConfigureWorkflowContent';
import { homePageToWorkflowRows } from './homePageToWorkflowRow';

import { toast } from 'react-hot-toast';

function WorkflowsPageAdapter({
  data = {},
  filters = {},
  actions: rawActions = {},
  permissions = {},
  navigation = {},
  layout = {},
  ui = {},
  subscriptionLimits = {},
}) {
  const { workflows = [], isLoading: workflowsIsLoading, error: workflowsError, meta = {} } = data;

  const { workflowSearchKey = '', currentFolder = {}, folders = [], foldersLoading = false } = filters;

  const {
    pageChanged,
    folderChanged,
    onSearch,
    deleteWorkflow,
    runWorkflow,
    reloadWorkflows,
    duplicateWorkflow,
    createWorkflow,
  } = rawActions;

  const { workflowsLimit } = subscriptionLimits;
  const { canCreateWorkflow, canDeleteWorkflow, canUpdateWorkflow } = permissions;
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
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  const handleCreateWorkflow = () => {
    setCreateSheetOpen(true);
  };

  const handleSelectTemplate = (template) => {
    setCreateSheetOpen(false);
    setSelectedTemplate(template);
    setConfigSheetOpen(true);
  };

  const handleConfigureWorkflow = async (workflowConfig) => {
    try {
      // Call the createWorkflow action with the configuration
      if (createWorkflow) {
        await createWorkflow({
          ...workflowConfig,
          template: selectedTemplate?.id,
        });
        toast.success('Workflow created successfully');
        setConfigSheetOpen(false);
        setSelectedTemplate(null);

        // Reload workflows to show the new one
        if (reloadWorkflows) {
          reloadWorkflows();
        }
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      toast.error('Failed to create workflow');
    }
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

  const { activeTab, setActiveTab, viewMode, setViewMode, isLoading } = useResourcePageState({
    initialTab: 'workflows',
    loadingStates: {
      workflows: workflowsIsLoading,
      folders: foldersLoading,
    },
  });

  // Check limit
  const isLimitReached = useMemo(() => {
    return workflowsLimit && !workflowsLimit.canAddUnlimited && workflowsLimit.percentage >= 100;
  }, [workflowsLimit]);

  const resolvedWorkspaceId = workspaceId || '';

  const actionsHandlers = useResourceActions({
    navigate,
    workspaceId: resolvedWorkspaceId,
    handlers: {
      deleteApp: deleteWorkflow,
      cloneApp: duplicateWorkflow,
      exportApp: runWorkflow,
      renameApp: reloadWorkflows,
    },
    getPlayPath: (workflow) => `/${resolvedWorkspaceId}/workflows/${workflow.id}/editor`,
    getEditPath: (workflow) => `/${resolvedWorkspaceId}/workflows/${workflow.id}/editor`,
  });

  const actions = useMemo(
    () => ({
      run: async (workflow) => {
        try {
          if (runWorkflow) {
            await runWorkflow(workflow);
            toast.success('Workflow execution started');
          }
        } catch (error) {
          console.error('Error running workflow:', error);
          toast.error('Failed to run workflow');
        }
      },
      edit: (workflow) => {
        const workflowId = workflow._workflowId || workflow.id;
        navigate(`/${resolvedWorkspaceId}/workflows/${workflowId}/editor`);
      },
      duplicate: actionsHandlers.handleClone,
      rename: actionsHandlers.handleEdit,
      viewHistory: (workflow) => {
        const workflowId = workflow._workflowId || workflow.id;
        navigate(`/${resolvedWorkspaceId}/workflows/${workflowId}/history`);
      },
      settings: (workflow) => {
        const workflowId = workflow._workflowId || workflow.id;
        navigate(`/${resolvedWorkspaceId}/workflows/${workflowId}/settings`);
      },
      delete: actionsHandlers.handleDelete,
    }),
    [actionsHandlers, navigate, resolvedWorkspaceId, runWorkflow]
  );

  const { permissions: computedPerms, canDelete: canDeletePerm } = useResourcePermissions({
    canCreateResource: canCreateWorkflow,
    canUpdateResource: canUpdateWorkflow,
    canDeleteResource: canDeleteWorkflow,
  });

  const finalColumns = useMemo(
    () => workflowsColumns({ perms: computedPerms, actions, canDelete: canDeletePerm }),
    [computedPerms, actions, canDeletePerm]
  );

  const {
    table: workflowsTable,
    isEmpty: workflowsEmpty,
    error: adapterError,
  } = useResourcePageAdapter({
    data: { items: workflows, isLoading: workflowsIsLoading, error: workflowsError, meta },
    filters: { searchKey: workflowSearchKey, currentFolder },
    actions: { pageChanged, onSearch },
    columns: finalColumns,
    transformFn: homePageToWorkflowRows,
  });

  const breadcrumbItems = useMemo(
    () => [
      { label: 'Folders', href: '/folders' },
      { label: currentFolder?.name || 'All workflows', href: null },
    ],
    [currentFolder]
  );

  const tabsConfig = [];

  const normalActionButtons = useMemo(() => {
    if (isLimitReached) return null;
    if (!canCreateWorkflow || (typeof canCreateWorkflow === 'function' && !canCreateWorkflow())) return null;

    return (
      <Button variant="secondary" size="default" isLucid leadingIcon="plus" onClick={handleCreateWorkflow}>
        Create workflow
      </Button>
    );
  }, [isLimitReached, canCreateWorkflow]);

  const workflowsMenuItems = [
    {
      label: 'Import workflow',
      onClick: () => toast.info('Import functionality coming soon'),
      icon: 'file-down',
    },
    {
      label: 'View templates',
      onClick: handleCreateWorkflow,
      icon: 'layout-template',
    },
  ];

  const pageIndex = workflowsTable.getState().pagination.pageIndex;

  const workflowsError_ = workflowsError || adapterError;

  const emptyStateWithButton = (
    <div className="tw-flex tw-flex-col tw-items-center">
      <EmptyResource
        title="You don't have any workflows yet"
        description="Create your first workflow to automate tasks"
      />
      {!isLimitReached && canCreateWorkflow && (
        <Button variant="primary" size="default" leadingIcon="plus" onClick={handleCreateWorkflow} className="tw-mt-4">
          Create workflow
        </Button>
      )}
    </div>
  );
  // Generic helper to render content based on view mode
  const renderContentView = (table, isLoading) => {
    // Use pageIndex as key to force re-render when pagination changes
    const pageIndex = table.getState().pagination.pageIndex;
    return viewMode === 'list' ? (
      <DataTable
        key={`table-page-${pageIndex}`}
        table={workflowsTable}
        isLoading={workflowsIsLoading}
        skeleton={<ResourceTableSkeleton />}
      />
    ) : (
      <WorkflowsGrid table={table} actions={actions} perms={computedPerms} canDelete={canDeletePerm} />
    );
  };

  const workflowsContent = renderContentView(workflowsTable, workflowsIsLoading);

  const tabs = [
    {
      id: 'workflows',
      label: 'Workflows',
      content: workflowsContent,
      error: workflowsError_,
      errorState: workflowsError_ ? (
        <ErrorState title="Failed to load workflows" error={workflowsError_} onRetry={() => window.location.reload()} />
      ) : null,
      empty: workflowsEmpty,
      emptyState: emptyStateWithButton,
    },
  ];

  const currentPage = workflowsTable.getState().pagination.pageIndex + 1;

  return (
    <>
      <ResourceShellView
        searchValue={workflowSearchKey}
        onSearch={onSearch}
        searchPlaceholder="Search workflows..."
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
          <ResourcePageHeader title="Workflows" rightSlot={normalActionButtons} contextMenuItems={workflowsMenuItems} />
        }
        footer={<PaginationFooter table={workflowsTable} isLoading={isLoading} currentPage={currentPage} />}
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

      <CommonWorkflowSheet open={createSheetOpen} onOpenChange={setCreateSheetOpen} title="Select workflow template">
        <CreateWorkflowContent onSelectTemplate={handleSelectTemplate} />
      </CommonWorkflowSheet>

      <CommonWorkflowSheet
        open={configSheetOpen}
        onOpenChange={setConfigSheetOpen}
        title={selectedTemplate ? `Create ${selectedTemplate.name}` : 'Create workflow'}
      >
        <ConfigureWorkflowContent template={selectedTemplate} onSubmit={handleConfigureWorkflow} />
      </CommonWorkflowSheet>
    </>
  );
}

WorkflowsPageAdapter.propTypes = {
  data: PropTypes.object,
  filters: PropTypes.object,
  actions: PropTypes.object,
  permissions: PropTypes.object,
  navigation: PropTypes.object,
  layout: PropTypes.object,
  ui: PropTypes.object,
  subscriptionLimits: PropTypes.object,
};

export default React.memo(WorkflowsPageAdapter);
