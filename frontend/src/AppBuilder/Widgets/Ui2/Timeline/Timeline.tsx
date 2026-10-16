import React, { useMemo, useRef, useState } from 'react';
import type { StyleWithVars, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useHasEvent } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { formatTime, statusColor, timelineItems } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import type { Entry, TimelineItem } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { iconFor } from '@/AppBuilder/Widgets/Ui2/_display/displayParts';

// ---- Timeline --------------------------------------------------------------------------------------------------------

const LINE_HEIGHT = 20;

// the title's line, which the marker centres on

export const ShadTimeline = (props: WidgetProps) => {
  const { properties: p, setExposedVariables, setExposedVariable, fireEvent, id } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const items = useMemo(
    () => timelineItems(p.items, p.newestFirst === true),
    [stringify(p.items ?? null), p.newestFirst] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [last, setLast] = useState<Entry>({});
  useExposed(setExposedVariables, p, { lastClickedItem: last });
  const hasClick = useHasEvent(id, 'onItemClicked');
  const compact = p.density === 'compact';
  const icons = p.marker === 'icon';
  const marker = icons ? (compact ? 24 : 28) : compact ? 8 : 10;
  const markerTop = Math.max(0, (LINE_HEIGHT - marker) / 2);
  const contentTop = Math.max(0, (marker - LINE_HEIGHT) / 2);
  const column = Math.max(marker, 12);
  const click = (item: TimelineItem) => {
    if (busy(p)) return;
    const { key, ...rest } = item; // eslint-disable-line @typescript-eslint/no-unused-vars
    setLast(rest);
    setExposedVariable('lastClickedItem', rest);
    fireEvent('onItemClicked');
  };
  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (p.loadingState) {
    body = (
      <div className="flex flex-col gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-3 w-3 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (!items.length) {
    body = <p className="py-4 text-center text-sm text-muted-foreground">No activity yet</p>;
  } else {
    body = (
      <ol className="m-0 flex list-none flex-col p-0">
        {items.map((item, index) => {
          const colour = (isSet(item.color) ? item.color : statusColor(item.status, p.statusColors)) || null;
          const markerVars: StyleWithVars = { '--tl-c': colour || 'var(--lk-marker,var(--sc-primary))' };
          const Icon = icons ? iconFor(item.icon, null) : null;
          const time = formatTime(item.time, p.dateFormat);
          const isLast = index === items.length - 1;
          const timeNode = time ? (
            <span className="whitespace-nowrap text-xs tabular-nums text-[color:var(--lk-time,var(--sc-muted-foreground))]">
              {time}
            </span>
          ) : null;
          return (
            <li
              key={`${item.key}-${index}`}
              className={cn(
                'relative flex gap-3',
                !isLast && (compact ? 'pb-3' : 'pb-6'),
                hasClick && !busy(p) && 'cursor-pointer'
              )}
              style={markerVars}
              onClick={() => click(item)}
            >
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className="absolute w-px bg-[color:var(--lk-line,var(--sc-border))]"
                  style={{ left: column / 2 - 0.5, top: markerTop + marker + 4, bottom: 4 - markerTop }}
                />
              ) : null}
              <span className="flex shrink-0 justify-center" style={{ width: column, paddingTop: markerTop }}>
                {icons ? (
                  <span
                    className="flex items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--tl-c)_14%,var(--sc-background))] text-[color:var(--tl-c)]"
                    style={{ width: marker, height: marker }}
                  >
                    {Icon ? (
                      <Icon size={compact ? 12 : 14} strokeWidth={2.25} aria-hidden="true" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-[color:var(--tl-c)]" />
                    )}
                  </span>
                ) : (
                  <span
                    className="rounded-full bg-[color:var(--tl-c)] ring-4 ring-[color:color-mix(in_srgb,var(--tl-c)_16%,transparent)]"
                    style={{ width: marker, height: marker }}
                  />
                )}
              </span>
              <div className="flex min-w-0 flex-1 flex-col" style={{ paddingTop: contentTop }}>
                {p.timePosition === 'top' ? <div className="mb-0.5">{timeNode}</div> : null}
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className={cn(
                      'min-w-0 break-words text-sm font-medium leading-5 text-[color:var(--lk-title,var(--sc-foreground))]'
                    )}
                  >
                    {item.title}
                  </span>
                  {p.timePosition !== 'top' ? timeNode : null}
                </div>
                {item.description ? (
                  <p
                    className={cn(
                      'm-0 mt-0.5 break-words text-[color:var(--lk-fg,var(--sc-muted-foreground))]',
                      compact ? 'text-xs' : 'text-sm'
                    )}
                  >
                    {item.description}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }
  return (
    <Shell {...props} innerRef={ref}>
      {body}
    </Shell>
  );
};

export default withControlState(ShadTimeline);
