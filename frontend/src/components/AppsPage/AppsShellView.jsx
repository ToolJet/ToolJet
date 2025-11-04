import React from 'react';

import { AppsPageLayout } from './Layout';
import { PageContainer } from '@/components/AppsPage/PageContainer';
import { AppsPageHeader } from '@/components/AppsPage/AppsPageHeader';

// Thin layout shell for Apps: header, search, footer, and content slot
export function AppsShellView({
  title,
  menuItems,
  searchValue,
  onSearch,
  footer,
  toolbarSlot = null,
  breadcrumbsSlot = null,
  contentSlot,
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
            {contentSlot}
          </div>
        </PageContainer>
      </AppsPageLayout>
    </div>
  );
}

export default AppsShellView;


