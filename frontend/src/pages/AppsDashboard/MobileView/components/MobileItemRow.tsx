import React, { memo } from 'react';
import { ChevronRight, Folder } from 'lucide-react';

import { cn } from '@/lib/utils';

import AppIcon from '../../components/AppIcon';
import type { AppItem, ListItem } from '../../dummyData/types';
import { isAppItem } from '../../items';
import { Button } from '@/components/ui/Button/Button';

const ROW_CLASS =
  'tw-flex tw-min-h-[51px] tw-w-full tw-items-center tw-gap-3 tw-bg-transparent tw-px-4 tw-text-left tw-font-body-x-large tw-text-text-default';

interface MobileItemRowProps {
  item: ListItem;
  /** Edit mode: no count, chevron or tap; `trailing` holds the pin and drag controls. */
  editing?: boolean;
  trailing?: React.ReactNode;
  onOpenFolder?: (folderId: string) => void;
  onOpenApp?: (app: AppItem) => void;
  rowRef?: React.Ref<HTMLLIElement>;
  style?: React.CSSProperties;
  className?: string;
}

function RowLabel({ item }: { item: ListItem }) {
  return (
    <>
      {isAppItem(item) ? (
        <AppIcon icon={item.icon} color="blue" size={16} />
      ) : (
        <Folder aria-hidden className="tw-size-4 tw-shrink-0 tw-text-icon-strong" />
      )}
      <span className="tw-min-w-0 tw-flex-1 tw-font-body-x-large tw-text-text-default tw-truncate">{item.name}</span>
    </>
  );
}

// Memoized: the parent passes stable callbacks, so a loaded page's rows don't re-render when the next one arrives.
export const MobileItemRow = memo(function MobileItemRow({
  item,
  editing = false,
  trailing,
  onOpenFolder,
  onOpenApp,
  rowRef,
  style,
  className,
}: MobileItemRowProps) {
  const isFolder = item.kind === 'folder';
  // A stub app has no launch action, so there is nothing to tap.
  const isTappable = !editing && (isFolder || Boolean(item.actions.launch));

  return (
    <li ref={rowRef} style={style} className={cn('tw-flex tw-items-center', className)}>
      {isTappable ? (
        <button
          type="button"
          className={cn(ROW_CLASS, 'tw-cursor-pointer tw-border-0')}
          onClick={() => (isFolder ? onOpenFolder?.(item.id) : onOpenApp?.(item as AppItem))}
        >
          <RowLabel item={item} />

          {item.kind === 'folder' && (
            <div className="tw-flex tw-items-center tw-gap-1">
              <span className="tw-font-body-large tw-text-text-placeholder">{item.app_count}</span>

              <Button isLucid iconOnly size="medium" variant="ghost">
                <ChevronRight aria-hidden className="tw-size-3.5 tw-text-icon-strong" />
              </Button>
            </div>
          )}
        </button>
      ) : (
        <div className={ROW_CLASS}>
          <RowLabel item={item} />
        </div>
      )}
      {trailing}
    </li>
  );
});
