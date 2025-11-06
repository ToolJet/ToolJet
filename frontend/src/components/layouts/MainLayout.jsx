import React from 'react';
import PropTypes from 'prop-types';
import { SidebarProvider, SidebarInset } from '@/components/ui/Rocket/sidebar';
import { AppSidebar } from '@/components/ui/blocks/Sidebar/app-sidebar';
import { TopBar } from '@/components/ui/TopBar/TopBar';

/**
 * Generic main layout component with sidebar, topbar, and content area.
 * The topbar supports slots for search area (left/center) and actions (right).
 * This layout is reusable across different sections of the app.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Main content area
 * @param {React.ReactNode} [props.topbarLeftSlot] - Search area slot (center of topbar)
 * @param {React.ReactNode} [props.topbarRightSlot] - Actions slot (right side of topbar)
 * @param {React.ReactNode} [props.logo] - Logo component (optional, defaults to ToolJet logo)
 * @param {string} [props.workspaceName] - Workspace name for team switcher
 * @param {Array} [props.workspaces] - Workspaces array for team switcher
 * @param {Function} [props.onWorkspaceChange] - Workspace change handler
 */
export function MainLayout({
  children,
  topbarLeftSlot,
  topbarRightSlot,
  logo,
  workspaceName,
  workspaces,
  onWorkspaceChange,
}) {
  return (
    <SidebarProvider
      defaultOpen={false}
      style={{
        '--sidebar-width': '10rem',
      }}
    >
      <div className="tw-flex tw-flex-col tw-h-screen tw-w-screen">
        <TopBar
          logo={logo}
          workspaceName={workspaceName}
          workspaces={workspaces}
          onWorkspaceChange={onWorkspaceChange}
          topbarLeftSlot={topbarLeftSlot}
          topbarRightSlot={topbarRightSlot}
        />
        <div className="tw-flex tw-flex-1 tw-overflow-hidden">
          <AppSidebar className="tw-bg-background-surface-layer-01 !tw-sticky !tw-h-full" />
          <SidebarInset>
            <main className="tw-flex tw-flex-1 tw-flex-col tw-gap-4 tw-overflow-hidden">{children}</main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}

MainLayout.propTypes = {
  children: PropTypes.node.isRequired,
  topbarLeftSlot: PropTypes.node,
  topbarRightSlot: PropTypes.node,
  logo: PropTypes.node,
  workspaceName: PropTypes.string,
  workspaces: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      id: PropTypes.string,
    })
  ),
  onWorkspaceChange: PropTypes.func,
};

MainLayout.defaultProps = {
  topbarLeftSlot: null,
  topbarRightSlot: null,
  logo: null,
  workspaceName: 'ABC cargo main team',
  workspaces: [],
  onWorkspaceChange: undefined,
};

export default MainLayout;

