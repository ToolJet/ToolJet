import React from 'react';
import { TopBarSearch } from '@/components/ui/blocks/TopBarSearch';
import { EndUserLayout } from '@/components/layouts/EndUserLayout';
import { PageContainer } from './PageContainer';

// Generic layout shell for end-user resources: header, search, footer, and content slot
export function EndUserResourceShellView({
  searchValue,
  onSearch,
  footer,
  header = null,
  children,
  searchPlaceholder = 'Search resources...',
  // Workspace switcher props (passed to EndUserLayout)
  workspaceName,
  workspaces,
  onWorkspaceChange,
}) {
  // Search component for topbar
  const searchSlot = onSearch ? (
    <TopBarSearch placeholder={searchPlaceholder} value={searchValue || ''} onChange={onSearch} />
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

export default EndUserResourceShellView;
