import React from 'react';
import { TopBarSearch } from '@/components/ui/blocks/TopBarSearch';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageContainer } from '@/components/AppsPage/PageContainer';

// Thin layout shell for Apps: header, search, footer, and content slot
export function AppsShellView({
  searchValue,
  onSearch,
  footer,
  toolbarSlot = null,
  breadcrumbsSlot = null,
  header = null,
  contentSlot,
  topbarRightSlot = null,
  // Workspace switcher props (passed to MainLayout)
  workspaceName,
  workspaces,
  onWorkspaceChange,
  // Sidebar props (passed to MainLayout)
  sidebarUser,
  sidebarTeams,
  sidebarNavMain,
  sidebarProjects,
}) {
  // Search component for topbar
  const searchSlot = onSearch ? (
    <TopBarSearch placeholder="Search apps..." value={searchValue || ''} onChange={onSearch} />
  ) : null;

  return (
    <div className="tw-h-screen tw-bg-background-surface-layer-01">
      <MainLayout
        topbarLeftSlot={searchSlot}
        topbarRightSlot={topbarRightSlot}
        workspaceName={workspaceName}
        workspaces={workspaces}
        onWorkspaceChange={onWorkspaceChange}
        sidebarUser={sidebarUser}
        sidebarTeams={sidebarTeams}
        sidebarNavMain={sidebarNavMain}
        sidebarProjects={sidebarProjects}
      >
        <PageContainer footer={footer}>
          <div className="tw-space-y-4">
            {breadcrumbsSlot}
            {header}
            {toolbarSlot}
            {contentSlot}
          </div>
        </PageContainer>
      </MainLayout>
    </div>
  );
}

export default AppsShellView;
