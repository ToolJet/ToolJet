import React, { useState } from 'react';
import { Grid2x2, ListTodo } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Rocket/Tabs/Tabs';
import { withEditionSpecificComponent } from '@/modules/common/helpers/withEditionSpecificComponent';
import ItemsList from '@/pages/AppsDashboard/ItemsList/ItemsList';
import CollapseFoldersButton from './CollapseFoldersButton';
import GridView from './GridView';

import type { TAppType } from '../helper';

// Actions sit beside TabsList, not inside it: a tablist may only own tabs (ARIA), and
// Radix's arrow-key roving would skip them anyway.
function ListAndGridTabs({ appType }: { appType: TAppType }) {
  const [selectedView, setSelectedView] = useState('list');

  return (
    <Tabs value={selectedView} onValueChange={setSelectedView} className="tw-min-h-0 tw-flex-1 tw-gap-2.5">
      <div className="tw-mx-[4.375rem] tw-flex tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-solid tw-border-border-weak">
        {/* The row owns the full-width border; the active indicator overlaps it. */}
        <TabsList aria-label="View" className="tw-border-b-0 tw-pl-0">
          <TabsTrigger value="list" leadingVisual={<ListTodo />}>
            List view
          </TabsTrigger>
          <TabsTrigger value="grid" leadingVisual={<Grid2x2 />}>
            Grid view
          </TabsTrigger>
        </TabsList>

        <div role="group" aria-label="View options" className="tw-flex tw-items-center tw-gap-1">
          {selectedView === 'list' && <CollapseFoldersButton />}
        </div>
      </div>

      {/* Panels fill the remaining height so only their content scrolls; `data-[state=active]` keeps Radix's `hidden` working. */}
      <TabsContent value="list" className="tw-min-h-0 tw-flex-col data-[state=active]:tw-flex">
        <ItemsList appType={appType} />
      </TabsContent>

      {/* Content scrolls inside so the footer stays pinned below it, as in the list view. */}
      <TabsContent value="grid" className="tw-min-h-0 tw-flex-col data-[state=active]:tw-flex">
        <GridView appType={appType} />
      </TabsContent>
    </Tabs>
  );
}

// EE swaps this for its Workflows / Approvals / Executions tabs.
function WorkflowsTabs() {
  return <ListAndGridTabs appType="workflow" />;
}

const EditionWorkflowsTabs = withEditionSpecificComponent(WorkflowsTabs, 'Workflows');

export default function ViewTabs({ appType }: { appType: TAppType }) {
  if (appType === 'workflow') return <EditionWorkflowsTabs />;
  return <ListAndGridTabs appType={appType} />;
}
