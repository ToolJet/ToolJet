import React from 'react';

import { AppsPageLayout } from './Layout';
import { PageContainer } from '@/components/AppsPage/PageContainer';
import { AppsPageHeader } from '@/components/AppsPage/AppsPageHeader';
import { AppsList } from '@/components/AppsPage/AppsList';

// Pure presentational Apps page view. No data fetching, no global state.
// Accepts a pre-configured react-table instance and renders the composed layout.

export function AppsPageView({
  title,
  menuItems,
  searchValue,
  onSearch,
  table,
  footer,
  toolbarSlot = null,
  breadcrumbsSlot = null,
  // Tab-scoped empties
  appsEmpty = false,
  modulesEmpty = false,
  emptyAppsSlot = null,
  emptyModulesSlot = null,
  rowActionsSlot = null,
}) {
  return (
    <div className="tw-h-screen tw-bg-background-surface-layer-01">
      <AppsPageLayout searchPlaceholder="Search apps..." searchValue={searchValue} onSearch={onSearch}>
        <PageContainer footer={footer}>
          <div className="tw-space-y-4">
            {breadcrumbsSlot}
            <AppsPageHeader
              title={title}
              onCreateBlankApp={() => {}}
              onBuildWithAI={() => {}}
              createAppMenuItems={menuItems}
            />
            {toolbarSlot}
            {/* AppsList consumes the provided table instance and tab-scoped empties. */}
            <AppsList
              data={table.options.data}
              table={table}
              appsEmpty={appsEmpty}
              modulesEmpty={modulesEmpty}
              emptyAppsSlot={emptyAppsSlot}
              emptyModulesSlot={emptyModulesSlot}
              rowActionsSlot={rowActionsSlot}
            />
          </div>
        </PageContainer>
      </AppsPageLayout>
    </div>
  );
}

export default AppsPageView;


