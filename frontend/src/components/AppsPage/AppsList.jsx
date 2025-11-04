import * as React from "react";

import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AppsPageViewHeader } from "./AppsPageViewHeader";
import { AppsTable } from "./AppsTable";
import { AppsGrid } from "./AppsGrid";

/**
 * @deprecated Use `AppsTabs` with `AppsShellView` instead. This component will be removed after migration.
 */
export function AppsList({
  data: _data,
  table,
  appsEmpty = false,
  modulesEmpty = false,
  emptyAppsSlot = null,
  emptyModulesSlot = null,
}) {
  const [viewAs, setViewAs] = React.useState("list");
  const [activeTab, setActiveTab] = React.useState("apps");

  return (
    <Tabs
      defaultValue="apps"
      className="tw-w-full tw-flex-col tw-justify-start tw-gap-6"
    >
      {!(activeTab === "apps" && appsEmpty) &&
        !(activeTab === "modules" && modulesEmpty) && (
          <div className="tw-flex tw-items-center tw-justify-between">
            <AppsPageViewHeader
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab)}
              breadcrumbItems={[
                { label: "Folders", href: "/folders" },
                { label: "All apps", href: null },
              ]}
              viewAs={viewAs}
              onViewChange={(view) => setViewAs(view)}
            />
          </div>
        )}
      <TabsContent
        value="apps"
        className="tw-relative tw-flex tw-flex-col tw-gap-4 tw-overflow-auto tw-mt-0"
      >
        {appsEmpty ? (
          emptyAppsSlot
        ) : viewAs === "list" ? (
          <AppsTable table={table} />
        ) : (
          <AppsGrid table={table} />
        )}
      </TabsContent>
      <TabsContent
        value="modules"
        className="tw-flex tw-flex-col tw-px-4 lg:tw-px-6"
      >
        {modulesEmpty ? (
          emptyModulesSlot
        ) : (
          <div className="tw-aspect-video tw-w-full tw-flex-1 tw-rounded-lg tw-border tw-border-dashed" />
        )}
      </TabsContent>
    </Tabs>
  );
}
