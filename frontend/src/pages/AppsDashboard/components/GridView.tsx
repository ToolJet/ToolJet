import React, { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { capitalize } from 'lodash';
import { ChevronLeft } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAppsStore } from '@/_stores/appsStore';
import { useSearchStore } from '@/_stores/searchStore';

import { FolderNotFound, NoMatchesFound, NoAppsExist } from './EmptyStates';
import { BreadcrumbNameLoading, FolderViewLoading, GridViewLoading } from './LoadingStates';
import { useRootAppsQuery } from '../hooks/useRootAppsQuery';
import { isAppItem, isFolderItem, isInPinnedSection } from '../items';
import { useFolderView } from '../useFolderView';
import AppCard from './AppCard';
import FolderCard from './FolderCard';
import PageFooter from './PageFooter';

import type { AppItem, FolderItem } from '../dummyData/types';
import type { ListMeta } from '../types';
import {
  appTypeToDisplayNameMapping,
  FOLDER_PAGE_SIZE,
  ROOT_PAGE_SIZE,
  staticContentMappingByAppType,
  type TAppType,
} from '../helper';

// Shared by the grid tab and the folder view so the footer stays pinned below scrolling content.
export const GRID_SCROLL_CLASS =
  'tw-flex tw-min-h-0 tw-flex-1 tw-flex-col tw-overflow-y-auto tw-hide-scrollbar tw-px-[4.375rem]';

// Shared with the grid loading state so skeleton cards wrap at the same breakpoints.
export const GRID_CLASS = 'tw-grid tw-grid-cols-[repeat(auto-fill,minmax(260px,1fr))] tw-gap-6';

// Pinned folders show only under Pinned, not again under Folders.
export default function GridView({ appType }: { appType: TAppType }) {
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get('folder');

  return folderId ? (
    <FolderView key={folderId} folderId={folderId} appType={appType} />
  ) : (
    <GridViewData appType={appType} />
  );
}

interface PagedGridProps {
  children: ReactNode;
  isFooterLoading: boolean;
  meta: ListMeta | undefined;
  pageSize: number;
  singularItemLabel: string;
}

// Scrolling content with the pagination footer pinned below it, shared by the root grid and the folder view.
function PagedGrid({ children, isFooterLoading, meta, pageSize, singularItemLabel }: PagedGridProps) {
  const currentPage = useAppsStore((state) => state.currentPage);
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);

  const gridScrollRef = useRef<HTMLDivElement>(null);

  // A new page starts from the top, as in the list view.
  useEffect(() => {
    gridScrollRef.current?.scrollTo({ top: 0 });
  }, [currentPage]);

  return (
    <>
      <div ref={gridScrollRef} className={GRID_SCROLL_CLASS}>
        {children}
      </div>

      <PageFooter
        isLoading={isFooterLoading}
        page={currentPage}
        pageSize={meta?.page_size ?? pageSize}
        totalCount={meta?.total ?? 0}
        onPageChange={setCurrentPage}
        singularItemLabel={singularItemLabel}
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

const renderFolder = (appType: TAppType) => (folder: FolderItem) => (
  <FolderCard folderDetails={folder} appType={appType} />
);

const renderApp = (appType: TAppType) => (app: AppItem) => <AppCard appDetails={app} appType={appType} />;

// Search lists nested apps at the top level, so each card names its folder.
const renderSearchedApp = (appType: TAppType) => (app: AppItem) => (
  <AppCard appDetails={app} appType={appType} showFolderTag />
);

// The Pinned section mixes both kinds, so entries carry their kind.
type PinnedEntry = { kind: 'folder'; folder: FolderItem } | { kind: 'app'; app: AppItem };

const getPinnedEntryKey = (entry: PinnedEntry) =>
  entry.kind === 'folder' ? `folder:${entry.folder.id}` : `app:${entry.app.id}`;

const renderPinnedEntry = (appType: TAppType) => (entry: PinnedEntry) =>
  entry.kind === 'folder' ? renderFolder(appType)(entry.folder) : renderApp(appType)(entry.app);

// Pinned means a pinned folder, a pinned stray app, or a folder holding a pinned app; each shows only there.
function GridViewData({ appType }: { appType: TAppType }) {
  // Same params as `index.tsx`, so this reads its cache entry rather than sending a second request.
  const { data, isLoading } = useRootAppsQuery(appType);
  const searchQuery: string = useSearchStore((state) => state.debouncedSearchQuery);

  const rootItems = data?.items;
  const folders = useMemo(() => (rootItems ?? []).filter(isFolderItem), [rootItems]);
  const apps = useMemo(() => (rootItems ?? []).filter(isAppItem), [rootItems]);

  // Kept in response order: the server lists pins by the user's saved order, folders and apps interleaved.
  const pinnedEntries = (rootItems ?? [])
    .filter(isInPinnedSection)
    .map((item): PinnedEntry => (isFolderItem(item) ? { kind: 'folder', folder: item } : { kind: 'app', app: item }));
  const otherFolders = folders.filter((folder) => !isInPinnedSection(folder));
  const otherApps = apps.filter((app) => !isInPinnedSection(app));

  // An empty workspace never reaches here: `index.tsx` shows its empty state instead.
  const isSearching = searchQuery.trim() !== '';
  const hasNoMatches = !isLoading && (data?.total ?? 0) === 0 && isSearching;
  const displayName = appTypeToDisplayNameMapping[appType];

  return (
    <PagedGrid isFooterLoading={isLoading} meta={data} pageSize={ROOT_PAGE_SIZE} singularItemLabel="item">
      {isLoading ? (
        <GridViewLoading classes={{ gridContainer: GRID_CLASS }} />
      ) : hasNoMatches ? (
        <NoMatchesFound />
      ) : isSearching ? (
        // Two sections only: every matching app (stray and nested, pinned or not) and every matching folder.
        <>
          <GridSection
            title={`${capitalize(displayName)}s`}
            items={apps}
            getKey={getId}
            renderItem={renderSearchedApp(appType)}
          />
          <GridSection title="Folders" items={folders} getKey={getId} renderItem={renderFolder(appType)} />
        </>
      ) : (
        <>
          <GridSection
            title="Pinned"
            items={pinnedEntries}
            getKey={getPinnedEntryKey}
            renderItem={renderPinnedEntry(appType)}
          />
          <GridSection title="Folders" items={otherFolders} getKey={getId} renderItem={renderFolder(appType)} />
          <GridSection
            title={`Stray ${displayName}s`}
            items={otherApps}
            getKey={getId}
            renderItem={renderApp(appType)}
          />
        </>
      )}
    </PagedGrid>
  );
}

interface FolderViewProps {
  folderId: string;
  appType: TAppType;
}

// The apps of the folder opened from a folder card, shown in place of the root grid.
function FolderView({ folderId, appType }: FolderViewProps) {
  const [, setSearchParams] = useSearchParams();
  const setCurrentPage = useAppsStore((state) => state.setCurrentPage);
  const searchQuery: string = useSearchStore((state) => state.debouncedSearchQuery);
  const { status, apps, folderName, meta } = useFolderView(folderId, appType);

  const handleBack = () => {
    // Root and folder pages share `currentPage`, so the root grid starts again from its first page.
    setCurrentPage(1);
    // Functional update keeps unrelated params such as `branch`, sort and filters.
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
    <PagedGrid
      isFooterLoading={status === 'loading'}
      meta={meta}
      pageSize={FOLDER_PAGE_SIZE}
      singularItemLabel={appTypeToDisplayNameMapping[appType]}
    >
      <div className="tw-flex tw-flex-col tw-flex-1 tw-gap-2 tw-py-3">
        <nav aria-label="Breadcrumb" className="tw-flex tw-items-center tw-gap-1 tw-font-title-default">
          <button
            type="button"
            onClick={handleBack}
            className="tw-flex tw-cursor-pointer tw-items-center tw-gap-1 tw-border-0 tw-bg-transparent tw-p-0 tw-font-title-default tw-text-text-accent"
          >
            <ChevronLeft className="tw-size-4" aria-hidden />
            All {appTypeToDisplayNameMapping[appType]}s
          </button>
          <span aria-hidden className="tw-text-text-default">
            /
          </span>
          {status === 'loading' ? (
            <BreadcrumbNameLoading />
          ) : (
            <span aria-current="page" className="tw-text-text-default">
              {folderName}
            </span>
          )}
        </nav>

        {status === 'loading' && <FolderViewLoading classes={{ gridContainer: GRID_CLASS }} />}
        {status === 'notFound' && <FolderNotFound />}
        {/* TODO: Empty, no-match and error states are pending designs. */}
        {status === 'success' &&
          (apps.length === 0 ? (
            searchQuery.trim() !== '' ? (
              <NoMatchesFound />
            ) : (
              <NoAppsExist
                appType={appType}
                title={`No ${appTypeToDisplayNameMapping[appType]}s in this folder`}
                icon={staticContentMappingByAppType[appType].emptyState.icon}
              />
            )
          ) : (
            <GridList items={apps} getKey={getId} renderItem={renderApp(appType)} />
          ))}
      </div>
    </PagedGrid>
  );
}
