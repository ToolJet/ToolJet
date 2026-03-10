import React from 'react';

import { SidebarProvider, SidebarInset } from '@/components/ui/Rocket/sidebar';

import Header from './Header';
import LeftSidebar from './LeftSidebar';

export default function WorkspaceLayout({ children, container: Wrapper = 'main' }) {
  return (
    <div className="tw-flex tw-flex-col tw-h-screen" style={{ '--header-height': '48px' }}>
      <Header />

      <SidebarProvider defaultOpen={false} className="tw-flex-1 tw-min-h-0">
        <LeftSidebar />

        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </div>
  );
}
