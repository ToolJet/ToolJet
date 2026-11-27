import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ExpandedState, Row } from '@tanstack/react-table';
import { Database, SearchX } from 'lucide-react';

import { Button } from '@/components/ui/Button/Button';
import { Separator } from '@/components/ui/Rocket/Separator/Separator';
import Layout from '@/_ui/Layout';
import { useWorkspaceBranchesStore } from '@/_stores/workspaceBranchesStore';
import type { IWorkspaceBranchesStore } from '@/_stores/types/workspaceBranchesStore';
import { useHeaderSearchConfig } from '@/_hooks/useHeaderSearchConfig';
import { dataSourcesQueryOptions } from '@/_services/globalDatasource.queries';
import type { DataSourceListItem } from '@/_services/types/globalDatasource.types';
import { useDataSourcesDashboardStore } from '@/_stores/dataSourcesDashboardStore';
import { useSearchStore } from '@/_stores/searchStore';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import { DataTable } from '@/pages/components/DataTable/DataTable';
import PageFooter from '@/pages/components/PageFooter';
import PageHeader from '@/pages/components/PageHeader';
import EmptyState from '@/pages/components/EmptyState';
import { ROOT_PAGE_SIZE } from '@/pages/AppsDashboard/helper';

import { dataSourceColumns, getDataSourceRowId } from './columns';
import { useDataSourcePinReorder } from './hooks/useDataSourcePinReorder';
import { useDataSourceRowSelection } from './hooks/useDataSourceRowSelection';
import { countPageRowsOfKind, getSelectedKind } from './selection';
import AddNewMenu from './components/AddNewMenu';
import DataSourceSelectionBar from './components/DataSourceSelectionBar';
import FolderActionsDialog from './components/FolderActionsDialog';
import FolderChildren from './FolderChildren';
import SortableDataSourceRow from './SortableDataSourceRow';

const EMPTY_ITEMS: DataSourceListItem[] = [];

const classes = { contentContainer: 'tw-h-dvh tw-flex tw-flex-col', contentBody: 'tw-pt-0' };

const VIEW_ACTIONS = [
  // { label: 'Filter', icon: 'funnel' },
  // { label: 'Sort', icon: 'arrow-down-wide-narrow' },
  { id: 'collapse-folder', label: 'Collapse folders', icon: 'list-collapse' },
];

interface TDataSourceListProps {
  darkMode: boolean;
  switchDarkMode: () => void;
}

export default function DataSourceList({ darkMode, switchDarkMode }: TDataSourceListProps) {
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const handleCollapseFolder = () => setExpanded({});

  const [currentPage, setCurrentPage] = useState(1);

  useHeaderSearchConfig({ placeholder: 'Search data sources' });
  const search = useSearchStore((state) => state.debouncedSearchQuery);
  const branchId = useWorkspaceBranchesStore((state: IWorkspaceBranchesStore) => state.activeBranchId);
  const isSearching = search !== '';
  const isFolderDialogOpen = useDataSourcesDashboardStore((state) => Boolean(state.folderDialogState.type));

  // A new search or branch starts from the first page.
  useEffect(() => {
    setCurrentPage(1);
  }, [search, branchId]);

  const rootQueryOptions = dataSourcesQueryOptions({ pageNo: currentPage, pageSize: ROOT_PAGE_SIZE, search, branchId });
  const { data, isLoading } = useQuery(rootQueryOptions);
  const items = data?.items ?? EMPTY_ITEMS;
  const reorder = useDataSourcePinReorder({
    items,
    pinnedTotal: data?.counts.pinned ?? 0,
    currentPage,
    search,
    rootQueryKey: rootQueryOptions.queryKey,
  });
  const clearSelection = useDataSourcesDashboardStore((state) => state.clearSelection);
  const { rowSelection, onRowSelectionChange, enableRowSelection } = useDataSourceRowSelection();
  const selectedKind = getSelectedKind(rowSelection);
  const selectedRowIds = Object.keys(rowSelection);
  const pageRowCountOfKind = useMemo(
    () => countPageRowsOfKind(items, expanded, selectedKind),
    [items, expanded, selectedKind]
  );
  const isPageFullySelected = pageRowCountOfKind > 0 && selectedRowIds.length === pageRowCountOfKind;

  // Selection is page-scoped, so any change to what the page shows clears it. The store outlives the page,
  // so the cleanup also clears it on leaving.
  useEffect(() => {
    clearSelection();
    return clearSelection;
  }, [currentPage, search, branchId, clearSelection]);

  const totalCount = data?.total ?? 0;
  // While loading, or searching with no match, the table (or its no-results state) stays instead of the first-run empty state.
  const hasItems = isLoading || isSearching || totalCount > 0;

  // Deleting the last row of the last page leaves an empty page; fall back to the new last page.
  useEffect(() => {
    if (!isLoading && currentPage > 1 && items.length === 0) {
      setCurrentPage(Math.max(1, Math.ceil(totalCount / ROOT_PAGE_SIZE)));
    }
  }, [isLoading, currentPage, items.length, totalCount]);

  // Search results are flat, so folders only expand while browsing.
  const getRowCanExpand = useCallback(
    (row: Row<DataSourceListItem>) => !isSearching && row.original.kind === 'folder',
    [isSearching]
  );

  return (
    <Layout
      showNewHeader
      classes={classes}
      shouldWrapContentBody={false}
      darkMode={darkMode}
      switchDarkMode={switchDarkMode}
    >
      <main className="tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-gap-4 tw-pt-10">
        <PageHeader
          title="Data sources"
          description="Connect, organize, and manage the data sources in your workspace."
          actions={
            <>
              {hasItems && (
                <>
                  <AddNewMenu />
                </>
              )}
            </>
          }
        />

        {hasItems ? (
          <div className="tw-flex tw-flex-col tw-min-h-0 tw-flex-1 tw-gap-2.5">
            <div className="tw-mx-[4.375rem] tw-h-10 tw-flex tw-items-center tw-justify-end tw-border-0 tw-border-b tw-border-solid tw-border-border-weak">
              <div role="group" aria-label="View options" className="tw-flex tw-items-center tw-gap-1">
                {VIEW_ACTIONS.map(({ id, label, icon }) => {
                  return (
                    <Tooltip arrow key={label} content={label}>
                      <Button
                        variant="ghost"
                        size="medium"
                        isLucid
                        iconOnly
                        leadingIcon={icon}
                        aria-label={label}
                        onClick={id === 'collapse-folder' ? handleCollapseFolder : undefined}
                      />
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            <DataTable
              columns={dataSourceColumns}
              data={items}
              getRowId={getDataSourceRowId}
              isLoading={isLoading}
              emptyState={
                items.length === 0 && !isLoading ? (
                  <EmptyState
                    title="No results found"
                    description="Try a different search term."
                    icon={<SearchX size={20} />}
                  />
                ) : undefined
              }
              ariaLabel="Data sources and folders"
              rowSelection={rowSelection}
              onRowSelectionChange={onRowSelectionChange}
              enableRowSelection={enableRowSelection}
              getRowCanExpand={getRowCanExpand}
              expanded={expanded}
              onExpandedChange={setExpanded}
              renderExpandedRow={(row) =>
                row.original.kind === 'folder' ? <FolderChildren folder={row.original} /> : null
              }
              scrollResetKey={currentPage}
              renderRow={(row) => <SortableDataSourceRow key={row.id} row={row} />}
              reorder={reorder}
              // Pinned rows come first, so the divider goes after the last one (and its open children).
              renderRowSeparator={(row, nextRow) =>
                row.original.pinned && nextRow && !nextRow.original.pinned ? (
                  <Separator decorative className="tw-my-2" />
                ) : null
              }
              overlay={
                selectedKind && (
                  <DataSourceSelectionBar
                    kind={selectedKind}
                    selectedRowIds={selectedRowIds}
                    pageState={isPageFullySelected ? 'all' : 'some'}
                    className="tw-absolute tw-bottom-4 tw-left-1/2 tw-z-20 -tw-translate-x-1/2"
                  />
                )
              }
              footer={
                <PageFooter
                  page={currentPage}
                  pageSize={ROOT_PAGE_SIZE}
                  totalCount={totalCount}
                  onPageChange={setCurrentPage}
                  singularItemLabel="item"
                />
              }
            />
          </div>
        ) : (
          <>
            <Separator className="tw-mx-[4.375rem] tw-w-auto" />

            <EmptyState
              title="No data sources yet"
              description={`Connect a data source to start managing\nyour workspace data.`}
              icon={<Database size={20} />}
              classes={{ description: 'tw-whitespace-pre-line' }}
            >
              <AddNewMenu />
            </EmptyState>
          </>
        )}
      </main>
      {isFolderDialogOpen && <FolderActionsDialog open={isFolderDialogOpen} />}
    </Layout>
  );
}
