import React from 'react';
import PropTypes from 'prop-types';
import { SidebarProvider, SidebarInset } from '@/components/Sidebar/sidebar';
import { AppSidebar } from '@/components/Sidebar/app-sidebar';
import { TopBar } from '@/components/ui/TopBar/TopBar';

export function AppsPageLayout({ children, logo, searchPlaceholder, onSearch, searchValue }) {
  return (
    <SidebarProvider
      defaultOpen={false}
      style={{
        '--sidebar-width': '10rem',
      }}
    >
      <div className="tw-flex tw-flex-col tw-h-screen tw-w-screen">
        <TopBar logo={logo} searchPlaceholder={searchPlaceholder} onSearch={onSearch} searchValue={searchValue} />
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

AppsPageLayout.propTypes = {
  children: PropTypes.node,
  logo: PropTypes.node,
  searchPlaceholder: PropTypes.string,
  onSearch: PropTypes.func,
  searchValue: PropTypes.string,
};

AppsPageLayout.defaultProps = {
  searchPlaceholder: 'Search',
  searchValue: '',
};
