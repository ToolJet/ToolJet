import React from 'react';
import type { Bound, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { ChevronRight } from 'lucide-react';
import { list, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { useHasEvent } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';

export const MAX_CRUMBS = 8;

export const ELLIPSIS = Symbol('ellipsis');

export const ShadBreadcrumb = (props: WidgetProps) => {
  const { properties, setExposedVariables, setExposedVariable, fireEvent, id } = props;
  useExposed(setExposedVariables, properties, {});
  const all = list(properties.items);
  // onItemClick (with lastClickedItem: the item, its title and index) for navigating back up the trail.
  const clickable = useHasEvent(id, 'onItemClicked') && !busy(properties);
  const clickItem = (item: Bound, index: number) => {
    if (busy(properties) || item === ELLIPSIS) return;
    const entry = item && typeof item === 'object' ? item : { title: String(item ?? '') };
    setExposedVariable('lastClickedItem', { ...entry, title: String(entry.title ?? ''), index });
    fireEvent('onItemClicked');
  };
  // A long trail keeps its first item and its last ones, with an ellipsis between (shadcn's collapsed breadcrumb), so
  // a list bound by mistake (10k items) draws a handful.
  const trail = all.length > MAX_CRUMBS ? [all[0], ELLIPSIS, ...all.slice(-(MAX_CRUMBS - 2))] : all;
  const items = trail.map((it) => (it === ELLIPSIS || typeof it === 'string' ? it : it?.title ?? ''));
  // The index in the whole trail of each drawn item (the ellipsis hides some).
  const indexes =
    all.length > MAX_CRUMBS
      ? [0, -1, ...Array.from({ length: MAX_CRUMBS - 2 }, (_, k) => all.length - (MAX_CRUMBS - 2) + k)]
      : all.map((_, k) => k);
  return (
    <Shell {...props}>
      <nav aria-label="breadcrumb">
        <ol className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5 tw-break-words tw-text-ui2-sm tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
          {items.map((item, i) => (
            <li key={i} className="tw-inline-flex tw-items-center tw-gap-1.5">
              <span
                onClick={() => clickItem(trail[i], indexes[i])}
                role={clickable && item !== ELLIPSIS ? 'button' : undefined}
                tabIndex={clickable && item !== ELLIPSIS ? 0 : undefined}
                onKeyDown={(e) => clickable && e.key === 'Enter' && clickItem(trail[i], indexes[i])}
                className={cn(
                  i === items.length - 1
                    ? 'tw-font-normal tw-text-[color:var(--lk-current,var(--sc-foreground))]'
                    : 'tw-transition-colors',
                  clickable && item !== ELLIPSIS && 'tw-cursor-pointer hover:tw-text-[color:var(--sc-foreground)]'
                )}
              >
                {item === ELLIPSIS ? '…' : String(item)}
              </span>
              {i < items.length - 1 ? (
                <ChevronRight className="tw-h-3.5 tw-w-3.5 tw-text-[color:var(--lk-sep,currentColor)]" />
              ) : null}
            </li>
          ))}
        </ol>
      </nav>
    </Shell>
  );
};

export default withControlState(ShadBreadcrumb);
