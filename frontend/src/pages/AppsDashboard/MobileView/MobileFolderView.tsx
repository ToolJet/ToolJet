import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ChevronLeft, LockKeyhole, RotateCcw } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton } from '@/components/ui/Rocket/Skeleton/Skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/Rocket/Breadcrumb/Breadcrumb';

import { FolderNotFound } from '../components/EmptyStates';
import { BreadcrumbNameLoading } from '../components/LoadingStates';
import type { TAppType } from '../helper';
import type { AppItem } from '../dummyData/types';
import { isAppItem } from '../items';
import { EditModeButton } from './components/EditModeButton';
import { ItemsCard } from './components/ItemsCard';
import { ListEndStatus } from './components/ListEndStatus';
import { ListSentinel } from './components/ListSentinel';
import { MobileEmptyState } from './components/MobileEmptyState';
import { MobileItemRow } from './components/MobileItemRow';
import { MobilePinToggle } from './components/MobilePinToggle';
import { MobileListLoading, SKELETON_CLASS } from './components/MobileListLoading';
import { MobileViewHeader } from './components/MobileViewHeader';
import { getAppTapResult } from './helpers/launch';
import { useFolderAppsInfiniteQuery } from './hooks/useFolderAppsInfiniteQuery';
import { useFolderParam } from './hooks/useFolderParam';
import { useInfiniteScrollTrigger } from './hooks/useInfiniteScrollTrigger';

const APP_TYPE: TAppType = 'front-end';

const noop = () => {};

export function MobileFolderView({ folderId }: { folderId: string }) {
  const navigate = useNavigate();
  const { setFolderId } = useFolderParam();
  const { data, error, isLoading, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useFolderAppsInfiniteQuery(APP_TYPE, folderId);

  const pages = useMemo(() => data?.pages ?? [], [data]);
  const apps = useMemo(() => pages.flatMap((page) => page.items.filter(isAppItem)), [pages]);
  const total = pages[0]?.total ?? 0;
  const folderName = pages[0]?.folder?.name;

  const [editing, setEditing] = useState(false);

  const sentinelRef = useInfiniteScrollTrigger({ hasNextPage, isFetching, fetchNextPage });

  const handleBack = useCallback(() => setFolderId(null), [setFolderId]);
  const handleOpenApp = useCallback(
    (app: AppItem) => {
      const result = getAppTapResult(app);
      if (result.type === 'open') navigate(result.path);
      else if (result.type === 'blocked') toast(result.message);
    },
    [navigate]
  );

  // A 4xx means the id is malformed, deleted or not visible to this user.
  const statusCode = error?.statusCode ?? 0;
  const isNotFound = statusCode >= 400 && statusCode < 500;
  const isEmpty = !isLoading && !error && total === 0;

  const hasContent = !isLoading && !error && !isEmpty;
  const hasPinnableApp = apps.some((app) => app.actions.pin);

  return (
    <>
      <MobileViewHeader
        leading={
          <Button
            iconOnly
            variant="outline"
            aria-label="Back to applications"
            disabled={editing}
            className="tw-size-11"
            onClick={handleBack}
          >
            <ChevronLeft aria-hidden className="tw-size-5" />
          </Button>
        }
        // Pinning only: apps stay in the folder's order, so there is no drag.
        trailing={
          (hasPinnableApp || editing) && (
            <EditModeButton editing={editing} onToggle={() => setEditing((value) => !value)} />
          )
        }
        title={
          <Breadcrumb>
            <BreadcrumbList className="tw-pl-0">
              <BreadcrumbItem>
                {/* Not `BreadcrumbLink asChild`: shadcn/breadcrumb.jsx reads `Slot.Root`, which is undefined in react-slot 1.2.x, and crashes the render. */}
                <button
                  type="button"
                  disabled={editing}
                  className="tw-cursor-pointer tw-border-0 tw-bg-transparent tw-p-0 tw-font-title-x-large tw-text-text-default disabled:tw-opacity-50"
                  onClick={handleBack}
                >
                  Applications
                </button>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLoading ? (
                  <BreadcrumbNameLoading />
                ) : (
                  <BreadcrumbPage className="tw-font-body-x-large">{folderName}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        }
        // Folder search is pending product, so it is shown but inert; nothing to search in an empty or missing folder.
        search={
          isEmpty || isNotFound
            ? null
            : { placeholder: 'Search apps', value: '', disabled: true, onChange: noop, onClear: noop }
        }
      >
        {isLoading ? (
          <Skeleton aria-hidden className={cn(SKELETON_CLASS, 'tw-h-4 tw-w-16')} />
        ) : (
          hasContent && (
            <p className="tw-m-0 tw-font-body-large tw-text-text-placeholder">
              {total} {total === 1 ? 'app' : 'apps'}
            </p>
          )
        )}
      </MobileViewHeader>

      {isLoading ? (
        <MobileListLoading rowCount={3} />
      ) : isNotFound ? (
        <>
          <FolderNotFound />
          <Button variant="secondary" className="tw-self-center" onClick={handleBack}>
            Back to applications
          </Button>
        </>
      ) : error ? (
        <MobileEmptyState
          icon={<RotateCcw className="tw-size-8" />}
          title="Couldn't load apps"
          description="Check your connection and try again."
        />
      ) : isEmpty ? (
        <MobileEmptyState
          icon={<LockKeyhole className="tw-size-8" />}
          title="This folder is empty"
          description={`Apps added to this folder on desktop\nwill appear here`}
        />
      ) : (
        <div className="tw-flex-1 tw-grid tw-content-start tw-gap-4 tw-overflow-y-auto tw-hide-scrollbar">
          <ItemsCard>
            {apps.map((app) => (
              <MobileItemRow
                key={app.id}
                item={app}
                editing={editing}
                trailing={editing ? <MobilePinToggle item={app} appType={APP_TYPE} /> : undefined}
                onOpenApp={handleOpenApp}
              />
            ))}
          </ItemsCard>

          <ListSentinel sentinelRef={sentinelRef} hasNextPage={hasNextPage} />
          <ListEndStatus
            isFetchingNextPage={isFetchingNextPage}
            loadedAllCount={!hasNextPage && pages.length > 1 ? total : undefined}
          />
        </div>
      )}
    </>
  );
}
