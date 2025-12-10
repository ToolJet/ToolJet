import React from 'react';
import { TopBarSearch } from '@/components/ui/blocks/TopBarSearch';
import { EndUserLayout } from '@/components/layouts/EndUserLayout';
import { PageContainer } from './PageContainer';

// Thin layout shell for Apps: header, search, footer, and content slot
export function EndUserShellView({
  searchValue,
  onSearch,
  footer,
  header = null,
  children,
  // Workspace switcher props (passed to EndUserLayout)
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
        workspaceName={workspaceName}
        workspaces={workspaces}
        onWorkspaceChange={onWorkspaceChange}
      >
        <PageContainer footer={footer}>
          <div className="tw-space-y-4">
            {header}
            {children}
          </div>
        </PageContainer>
      </EndUserLayout>
    </div>
  );
}

export default EndUserShellView;
