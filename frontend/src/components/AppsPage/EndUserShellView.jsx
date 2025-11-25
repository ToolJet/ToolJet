import React from 'react';
import { TopBarSearch } from '@/components/ui/blocks/TopBarSearch';
import { EndUserLayout } from '@/components/layouts/EndUserLayout';
import { PageContainer } from '@/components/AppsPage/PageContainer';

// Thin layout shell for Apps: header, search, footer, and content slot
export function EndUserShellView({
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
}) {
  // Search component for topbar
  const searchSlot = onSearch ? (
    <TopBarSearch placeholder="Search apps..." value={searchValue || ''} onChange={onSearch} />
  ) : null;

  return (
    <div className="tw-h-screen tw-bg-background-surface-layer-01">
      <EndUserLayout
        topbarLeftSlot={searchSlot}
        topbarRightSlot={topbarRightSlot}
        workspaceName={workspaceName}
        workspaces={workspaces}
        onWorkspaceChange={onWorkspaceChange}
      >
        <PageContainer footer={footer}>
          <div className="tw-space-y-4">
            {breadcrumbsSlot}
            {header}
            {toolbarSlot}
            {contentSlot}
          </div>
        </PageContainer>
      </EndUserLayout>
    </div>
  );
}

export default EndUserShellView;
