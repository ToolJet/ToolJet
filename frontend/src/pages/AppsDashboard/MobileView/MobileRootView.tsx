import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { LockKeyhole, RotateCcw, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { authenticationService } from '@/_services/authentication.service';
import { useCurrentSessionStore } from '@/_stores/currentSessionStore';
import { useSearchStore } from '@/_stores/searchStore';
import { useHeaderSearch } from '@/_ui/Header/useHeaderSearch';
import { Skeleton } from '@/components/ui/Rocket/Skeleton/Skeleton';

import type { TAppType } from '../helper';
import type { AppItem } from '../dummyData/types';
import { BuilderActionsBanner } from './components/BuilderActionsBanner';
import { ItemsCard } from './components/ItemsCard';
import { ListEndStatus } from './components/ListEndStatus';
import { ListSentinel } from './components/ListSentinel';
import { EditModeButton } from './components/EditModeButton';
import { MobileEmptyState } from './components/MobileEmptyState';
import { MobileItemRow } from './components/MobileItemRow';
import { MobileListLoading, SKELETON_CLASS } from './components/MobileListLoading';
import { MobilePinReorder } from './components/MobilePinReorder';
import { MobilePinToggle } from './components/MobilePinToggle';
import { MobileViewHeader } from './components/MobileViewHeader';
import { WorkspaceDrawer } from './components/WorkspaceDrawer';
import { WorkspacePill } from './components/WorkspacePill';
import { canDragPinnedItems, groupItems } from './helpers/groupItems';
import { getAppTapResult } from './helpers/launch';
import { useFolderParam } from './hooks/useFolderParam';
import { useInfiniteScrollTrigger } from './hooks/useInfiniteScrollTrigger';
import { useRootAppsInfiniteQuery } from './hooks/useRootAppsInfiniteQuery';

const APP_TYPE: TAppType = 'front-end';

export function MobileRootView() {
  const navigate = useNavigate();
  const { setFolderId } = useFolderParam();
  const search = useHeaderSearch();
  const clearSearch = useSearchStore((state) => state.clearSearch);
  const organizations = useCurrentSessionStore((state) => state.organizations) as { id: string; name: string }[];
  const { current_organization_id: currentWorkspaceId } = authenticationService.currentSessionValue;

  const [editing, setEditing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    queryKey,
    searchQuery,
  } = useRootAppsInfiniteQuery(APP_TYPE);

  const pages = useMemo(() => data?.pages ?? [], [data]);
  const { pinned, folders, apps } = useMemo(() => groupItems(pages, { editing }), [pages, editing]);
  const total = pages[0]?.total ?? 0;
  const pinnedTotal = pages[0]?.counts.pinned ?? 0;

  const sentinelRef = useInfiniteScrollTrigger({ hasNextPage, isFetching, fetchNextPage });

  const workspaceName = organizations.find((org) => org.id === currentWorkspaceId)?.name ?? '';
  const isSearching = searchQuery.trim() !== '';
  const hasPinnableItem = pages.some((page) => page.items.some((item) => item.actions.pin));
  const canDrag = canDragPinnedItems({ searchQuery, pinned, pinnedTotal });

  const handleOpenFolder = useCallback((id: string) => setFolderId(id), [setFolderId]);
  const handleOpenApp = useCallback(
    (app: AppItem) => {
      const result = getAppTapResult(app);
      if (result.type === 'open') navigate(result.path);
      else if (result.type === 'blocked') toast(result.message);
    },
    [navigate]
  );

  const handleToggleEdit = () => {
    // The pin controls act on the whole list, so a leftover search would hide rows they affect.
    if (!editing) clearSearch();
    setEditing((value) => !value);
  };

  const renderRows = (items: typeof pinned) =>
    items.map((item) => (
      <MobileItemRow
        key={`${item.kind}:${item.id}`}
        item={item}
        editing={editing}
        trailing={editing ? <MobilePinToggle item={item} appType={APP_TYPE} /> : undefined}
        onOpenFolder={handleOpenFolder}
        onOpenApp={handleOpenApp}
      />
    ));

  const showEmptyWorkspace = !isLoading && !isError && total === 0 && !isSearching;
  const showNoResults = !isLoading && !isError && total === 0 && isSearching;

  return (
    <>
      <MobileViewHeader
        leading={<WorkspacePill workspaceName={workspaceName} disabled={editing} onClick={() => setDrawerOpen(true)} />}
        trailing={(hasPinnableItem || editing) && <EditModeButton editing={editing} onToggle={handleToggleEdit} />}
        title={<h1 className="tw-m-0 tw-font-title-heavy-xx-large tw-text-text-default">Applications</h1>}
        search={
          showEmptyWorkspace
            ? null
            : {
                placeholder: 'Search folders and apps',
                value: search.value,
                disabled: editing,
                onChange: search.onChange,
                onClear: search.onClear,
              }
        }
      >
        <BuilderActionsBanner />

        {isLoading ? (
          <Skeleton aria-hidden className={cn(SKELETON_CLASS, 'tw-h-4 tw-w-16')} />
        ) : (
          !showEmptyWorkspace && (
            <p className="tw-m-0 tw-font-body-large tw-text-text-placeholder">
              {total} {total === 1 ? 'item' : 'items'}
            </p>
          )
        )}
      </MobileViewHeader>

      {isLoading ? (
        <MobileListLoading />
      ) : isError ? (
        <MobileEmptyState
          icon={<RotateCcw className="tw-size-8" />}
          title="Couldn't load apps"
          description="Check your connection and try again."
        />
      ) : showEmptyWorkspace ? (
        <MobileEmptyState
          icon={<LockKeyhole className="tw-size-8" />}
          title="No apps yet"
          description={`Apps created on desktop\nwill appear here`}
        />
      ) : showNoResults ? (
        <MobileEmptyState
          icon={<Search className="tw-size-8" />}
          title={`No results for "${searchQuery.trim()}"`}
          description={'Check the spelling or try a different\nfolder or app name.'}
        />
      ) : (
        <div className="tw-flex-1 tw-grid tw-content-start tw-gap-4 tw-overflow-y-auto tw-hide-scrollbar">
          {pinned.length > 0 &&
            (editing ? (
              <MobilePinReorder items={pinned} appType={APP_TYPE} queryKey={queryKey} canDrag={canDrag} />
            ) : (
              <ItemsCard label="Pinned">{renderRows(pinned)}</ItemsCard>
            ))}
          {folders.length > 0 && <ItemsCard label="Folders">{renderRows(folders)}</ItemsCard>}
          {apps.length > 0 && <ItemsCard label="Apps (Stray)">{renderRows(apps)}</ItemsCard>}

          <ListSentinel sentinelRef={sentinelRef} hasNextPage={hasNextPage} />

          <ListEndStatus
            isFetchingNextPage={isFetchingNextPage}
            loadedAllCount={!hasNextPage && pages.length > 1 ? total : undefined}
          />
        </div>
      )}

      <WorkspaceDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
