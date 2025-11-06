import React from "react";
import { TopBarSearch } from "@/components/ui/blocks/TopBarSearch";
import { MainLayout } from "@/components/layouts/MainLayout";
import { PageContainer } from "@/components/AppsPage/PageContainer";
import { AppsPageHeader } from "@/components/AppsPage/AppsPageHeader";

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
  topbarRightSlot = null,
}) {
  // Search component for topbar
  const searchSlot = onSearch ? (
    <TopBarSearch
      placeholder="Search apps..."
      value={searchValue || ""}
      onChange={onSearch}
    />
  ) : null;

  return (
    <div className="tw-h-screen tw-bg-background-surface-layer-01">
      <MainLayout topbarLeftSlot={searchSlot} topbarRightSlot={topbarRightSlot}>
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
      </MainLayout>
    </div>
  );
}

export default AppsShellView;
