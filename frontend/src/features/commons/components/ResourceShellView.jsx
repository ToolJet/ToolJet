import React from 'react';
import { TopBarSearch } from '@/components/ui/blocks/TopBarSearch';
import { MainLayout } from '@/components/layouts/MainLayout';
import { PageContainer } from './PageContainer';

// Generic layout shell for resources: header, search, footer, and children (content)
export function ResourceShellView({
  searchValue,
  onSearch,
  footer,
  header = null,
  children,
  searchPlaceholder = 'Search resources...',
  // Workspace switcher props (passed to MainLayout)
  workspaceName,
  workspaces,
  onWorkspaceChange,
  // Sidebar props (passed to MainLayout)
  sidebarUser,
  sidebarTeams,
  sidebarNavMain,
  sidebarProjects,
  sidebarUserMenuItems,
  sidebarPlatformVersion,
  // Dark mode props (passed to MainLayout)
  darkMode,
  onToggleDarkMode,
}) {
  // Search component for topbar
  const searchSlot = onSearch ? (
    <TopBarSearch placeholder={searchPlaceholder} value={searchValue || ''} onChange={onSearch} />
  ) : null;

  return (
    <div className="tw-h-screen tw-bg-background-surface-layer-01">
      <MainLayout
        topbarLeftSlot={searchSlot}
        workspaceName={workspaceName}
        workspaces={workspaces}
        onWorkspaceChange={onWorkspaceChange}
        sidebarUser={sidebarUser}
        sidebarTeams={sidebarTeams}
        sidebarNavMain={sidebarNavMain}
        sidebarProjects={sidebarProjects}
        sidebarUserMenuItems={sidebarUserMenuItems}
        sidebarPlatformVersion={sidebarPlatformVersion}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
      >
        <PageContainer footer={footer}>
          <div className="tw-space-y-0">
            {header}
            {children}
          </div>
        </PageContainer>
      </MainLayout>
    </div>
  );
}

export default ResourceShellView;
