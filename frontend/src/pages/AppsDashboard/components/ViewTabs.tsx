import React, { useEffect, useRef, useState } from 'react';
import { Grid2x2, ListTodo } from 'lucide-react';

import { Button } from '@/components/ui/Button/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Rocket/Tabs/Tabs';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import { NoMatchesFound } from './EmptyStates';
import { FooterLoading, GridViewLoading } from './LoadingStates';
import GridView from './GridView';
import ItemsList from '@/HomePage/ItemsList/ItemsList';
import ListFooter from '@/HomePage/ItemsList/ListFooter';
import { useItemsListStore } from '@/HomePage/ItemsList/store/itemsListStore';

const VIEW_ACTIONS = [
  // { label: 'Filter', icon: 'funnel' },
  // { label: 'Sort', icon: 'arrow-down-wide-narrow' },
  { id: 'collapse-folder', label: 'Collapse folders', icon: 'list-collapse' },
];

// Actions sit beside TabsList, not inside it: a tablist may only own tabs (ARIA), and
// Radix's arrow-key roving would skip them anyway.
export default function ViewTabs() {
  // TODO: Placeholder until search/filter results are wired; flip to preview the empty state.
  const hasNoMatches = false;
  // TODO: Placeholder until the loading trigger is decided; flip to preview the skeletons.
  const isLoading = false;

  const setExpanded = useItemsListStore((state) => state.setExpanded);
  const page = useItemsListStore((state: { query: { page: number } }) => state.query.page);
  const gridScrollRef = useRef<HTMLDivElement>(null);

  // A new page starts from the top, as in the list view.
  useEffect(() => {
    gridScrollRef.current?.scrollTo({ top: 0 });
  }, [page]);

  const [selectedView, setSelectedView] = useState('list');

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
        {hasNoMatches && !isLoading ? <NoMatchesFound /> : <ItemsList isLoading={isLoading} />}
      </TabsContent>

      {/* Content scrolls inside so the loading footer stays pinned below it, as in the list view. */}
      <TabsContent value="grid" className="tw-min-h-0 tw-flex-col data-[state=active]:tw-flex">
        <div
          ref={gridScrollRef}
          className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-y-auto tw-px-[4.375rem]"
        >
          {isLoading ? <GridViewLoading /> : hasNoMatches ? <NoMatchesFound /> : <GridView />}
        </div>
        {isLoading ? <FooterLoading /> : <ListFooter />}
      </TabsContent>
    </Tabs>
  );
}
