import React, { useState } from 'react';
import { Grid2x2, ListTodo } from 'lucide-react';

import { Button } from '@/components/ui/Button/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Rocket/Tabs/Tabs';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import { useIsRootItemsLoading } from '../useIsRootItemsLoading';
import GridView from './GridView';
import ItemsList from '@/HomePage/ItemsList/ItemsList';
import { useItemsListStore } from '@/HomePage/ItemsList/store/itemsListStore';

import type { TAppType } from '../helper';

const VIEW_ACTIONS = [
  // { label: 'Filter', icon: 'funnel' },
  // { label: 'Sort', icon: 'arrow-down-wide-narrow' },
  { id: 'collapse-folder', label: 'Collapse folders', icon: 'list-collapse' },
];

// Actions sit beside TabsList, not inside it: a tablist may only own tabs (ARIA), and
// Radix's arrow-key roving would skip them anyway.
export default function ViewTabs({ appType }: { appType: TAppType }) {
  const isLoading = useIsRootItemsLoading();

  const setExpanded = useItemsListStore(
    (state: { setExpanded: (expanded: Record<string, boolean>) => void }) => state.setExpanded
  );

  const [selectedView, setSelectedView] = useState('grid');

  const handleCollapseFolder = () => {
    setExpanded({});
  };

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
          {VIEW_ACTIONS.map(({ id, label, icon }) => {
            if (id === 'collapse-folder' && selectedView === 'grid') return <></>;

            return (
              <Tooltip arrow key={id} content={label}>
                <Button
                  variant="ghost"
                  size="medium"
                  isLucid
                  iconOnly
                  leadingIcon={icon}
                  aria-label={label}
                  onClick={handleCollapseFolder}
                />
              </Tooltip>
            );
          })}
        </div>
      </div>

      {/* Panels fill the remaining height so only their content scrolls; `data-[state=active]` keeps Radix's `hidden` working. */}
      <TabsContent value="list" className="tw-min-h-0 tw-flex-col data-[state=active]:tw-flex">
        <ItemsList isLoading={isLoading} />
      </TabsContent>

      {/* Content scrolls inside so the footer stays pinned below it, as in the list view. */}
      <TabsContent value="grid" className="tw-min-h-0 tw-flex-col data-[state=active]:tw-flex">
        <GridView isLoading={isLoading} appType={appType} />
      </TabsContent>
    </Tabs>
  );
}
