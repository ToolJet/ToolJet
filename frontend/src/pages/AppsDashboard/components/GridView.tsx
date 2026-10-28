import React, { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useRootItemsSync } from '@/HomePage/ItemsList/hooks/useRootItemsSync';
import { ITEMS_PER_PAGE, useItemsListStore } from '@/HomePage/ItemsList/store/itemsListStore';
import type { ListFooterMeta } from '@/HomePage/ItemsList/ListFooter';

import { NoMatchesFound, NoAppsExist } from './EmptyStates';
import { FolderViewLoading, GridViewLoading } from './LoadingStates';
import { toGridItems, type RootItem } from '../toGridItems';
import { useFolderView } from '../useFolderView';
import { useHasNoMatches } from '../useHasNoMatches';
import AppCard from './AppCard';
import FolderCard from './FolderCard';
import PageFooter from './PageFooter';

import type { AppItem, FolderItem } from '../dashboard.types';
import { appTypeToDisplayNameMapping, staticContentMappingByAppType, type TAppType } from '../helper';

// Shared by the grid tab and the folder view so the footer stays pinned below scrolling content.
export const GRID_SCROLL_CLASS = 'tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-y-auto tw-px-[4.375rem]';

// Shared with the grid loading state so skeleton cards wrap at the same breakpoints.
export const GRID_CLASS = 'tw-grid tw-grid-cols-[repeat(auto-fill,minmax(240px,1fr))] tw-gap-6';

// Pinned folders show only under Pinned, not again under Folders.
export default function GridView({ isLoading, appType }: { isLoading: boolean; appType: TAppType }) {
  const page = useItemsListStore((state: { query: { page: number } }) => state.query.page);
  const isFolderLoading: boolean = useItemsListStore(
    (state: { folderView: { status: string } }) => state.folderView.status === 'loading'
  );

  const folderMeta: ListFooterMeta | null = useItemsListStore(
    (state: { folderView: { meta: ListFooterMeta | null } }) => state.folderView.meta
  );

  const rootMeta: ListFooterMeta | null = useItemsListStore(
    (state: { root: { meta: ListFooterMeta | null } }) => state.root.meta
  );
  const setPage: (page: number) => void = useItemsListStore(
    (state: { setPage: (page: number) => void }) => state.setPage
  );

  const [searchParams] = useSearchParams();

  const gridScrollRef = useRef<HTMLDivElement>(null);

  // A new page starts from the top, as in the list view.
  useEffect(() => {
    gridScrollRef.current?.scrollTo({ top: 0 });
  }, [page]);

  const folderName = searchParams.get('folder');
  const footerMeta = folderName ? folderMeta : rootMeta;
  const isFooterLoading = folderName ? isFolderLoading && !folderMeta : isLoading;

  return (
    <>
      <div ref={gridScrollRef} className={GRID_SCROLL_CLASS}>
        {folderName ? (
          <FolderView folderName={folderName} appType={appType} />
        ) : (
          <GridViewData isLoading={isLoading} appType={appType} />
        )}
      </div>

      <PageFooter
        isLoading={isFooterLoading}
        page={page}
        pageSize={footerMeta?.per_page ?? ITEMS_PER_PAGE}
        totalCount={footerMeta?.total_count ?? 0}
        onPageChange={setPage}
        singularItemLabel={folderName ? 'app' : 'item'}
      />
    </>
  );
}

interface GridListProps<T> {
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}

// The card grid shared by the root sections and the folder view, which supply their own heading.
export function GridList<T>({ items, getKey, renderItem }: GridListProps<T>) {
  return (
    <ul className={cn(GRID_CLASS, 'tw-m-0 tw-list-none tw-p-0')}>
      {items.map((item) => (
        <li key={getKey(item)} className="tw-min-w-0">
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

interface GridSectionProps<T> extends GridListProps<T> {
  title: string;
}

function GridSection<T>({ title, items, getKey, renderItem }: GridSectionProps<T>) {
  if (items.length === 0) return null;

  // Section titles are unique on the page, so deriving the id from the title avoids duplicate ids.
  const headingId = `grid-section-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <section aria-labelledby={headingId} className="tw-py-3">
      <h2 id={headingId} className="tw-mb-2 tw-font-title-default tw-text-text-default">
        {title} ({items.length})
      </h2>

      <GridList items={items} getKey={getKey} renderItem={renderItem} />
    </section>
  );
}

const getId = (item: { id: string }) => item.id;

const renderFolder = (folder: FolderItem) => (
  <FolderCard name={folder.name} description={folder.description} isPinned={folder.isPinned} />
);

const renderApp = (app: AppItem) => (
  <AppCard
    name={app.name}
    description={app.description}
    icon={app.icon}
    iconColor={app.iconColor}
    isPinned={app.isPinned}
    isUnsynced={app.isUnsynced}
  />
);

// The Pinned section mixes both kinds, so entries carry their kind.
type PinnedEntry = { kind: 'folder'; folder: FolderItem } | { kind: 'app'; app: AppItem };

const getPinnedEntryKey = (entry: PinnedEntry) =>
  entry.kind === 'folder' ? `folder:${entry.folder.id}` : `app:${entry.app.id}`;

const renderPinnedEntry = (entry: PinnedEntry) =>
  entry.kind === 'folder' ? renderFolder(entry.folder) : renderApp(entry.app);

// Pinned means a pinned folder, a pinned stray app, or a folder holding a pinned app; each shows only there.
function GridViewData({ isLoading, appType }: { isLoading: boolean; appType: TAppType }) {
  // Stays mounted while loading or when nothing matches, because it owns the fetch.
  useRootItemsSync();
  const hasNoMatches = useHasNoMatches();
  const rootItems: RootItem[] = useItemsListStore((state: { root: { items: RootItem[] } }) => state.root.items);
  const { folders, apps } = useMemo(() => toGridItems(rootItems), [rootItems]);

  const isPinnedFolder = (folder: FolderItem) => folder.isPinned || folder.hasPinnedApps;
  const pinnedEntries: PinnedEntry[] = [
    ...folders.filter(isPinnedFolder).map((folder): PinnedEntry => ({ kind: 'folder', folder })),
    ...apps.filter((app) => app.isPinned).map((app): PinnedEntry => ({ kind: 'app', app })),
  ];
  const otherFolders = folders.filter((folder) => !isPinnedFolder(folder));
  const otherApps = apps.filter((app) => !app.isPinned);

  if (isLoading) return <GridViewLoading classes={{ gridContainer: GRID_CLASS }} />;

  if (hasNoMatches) return <NoMatchesFound />;

  return (
    <>
      <GridSection title="Pinned" items={pinnedEntries} getKey={getPinnedEntryKey} renderItem={renderPinnedEntry} />
      <GridSection title="Folders" items={otherFolders} getKey={getId} renderItem={renderFolder} />
      <GridSection title="Stray apps" items={otherApps} getKey={getId} renderItem={renderApp} />
    </>
  );
}

interface FolderViewProps {
  folderName: string;
  appType: TAppType;
}

// The apps of the folder opened from a folder card, shown in place of the root grid.
function FolderView({ folderName, appType }: FolderViewProps) {
  const [, setSearchParams] = useSearchParams();
  const { status, apps } = useFolderView(folderName);
  const searchKey: string = useItemsListStore((state: { query: { searchKey: string } }) => state.query.searchKey);

  // Functional update keeps unrelated params such as `branch`, sort and filters.
  const handleBack = () => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.delete('folder');
        return next;
      },
      { replace: true }
    );
  };

  return (
    <div className="tw-flex tw-flex-col tw-flex-1 tw-gap-2 tw-py-3">
      <nav aria-label="Breadcrumb" className="tw-flex tw-items-center tw-gap-1 tw-font-title-default">
        <button
          type="button"
          onClick={handleBack}
          className="tw-flex tw-cursor-pointer tw-items-center tw-gap-1 tw-border-0 tw-bg-transparent tw-p-0 tw-font-title-default tw-text-text-accent"
        >
          <ChevronLeft className="tw-size-4" aria-hidden />
          All apps
        </button>
        <span aria-hidden className="tw-text-text-default">
          /
        </span>
        <span aria-current="page" className="tw-text-text-default">
          {folderName}
        </span>
      </nav>

      {status === 'loading' && <FolderViewLoading classes={{ gridContainer: GRID_CLASS }} />}
      {/* TODO: Empty, no-match and error states are pending designs. */}
      {status === 'success' &&
        (apps.length === 0 ? (
          searchKey.trim() !== '' ? (
            <NoMatchesFound />
          ) : (
            <NoAppsExist
              appType={appType}
              title={`No ${appTypeToDisplayNameMapping[appType]}s in this folder`}
              icon={staticContentMappingByAppType[appType].emptyState.icon}
            />
          )
        ) : (
          <GridList items={apps} getKey={getId} renderItem={renderApp} />
        ))}
    </div>
  );
}
