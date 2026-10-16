import React, { useMemo, useRef, useState } from 'react';
import type { StyleWithVars, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useHasEvent } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { formatTime, statusColor, timelineItems } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import type { Entry, TimelineItem } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import { iconFor } from '@/AppBuilder/Widgets/Ui2/_display/displayParts';

// ---- Timeline --------------------------------------------------------------------------------------------------------

// The title's line height, which the marker centres on; the title takes it from here, so the two cannot drift.
const LINE_HEIGHT = 20;

export const ShadTimeline = (props: WidgetProps) => {
  const { properties: p, setExposedVariables, setExposedVariable, fireEvent, id } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const source = useStable(p.items);
  const newestFirst = p.newestFirst === true;
  const items = useMemo(() => timelineItems(source, newestFirst), [source, newestFirst]);
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
      <div className="tw-flex tw-flex-col tw-gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="tw-flex tw-gap-3">
            <Skeleton className="tw-h-3 tw-w-3 tw-shrink-0 tw-rounded-full" />
            <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-2">
              <Skeleton className="tw-h-4 tw-w-1/2" />
              <Skeleton className="tw-h-3 tw-w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (!items.length) {
    body = <p className="tw-py-4 tw-text-center tw-text-ui2-sm tw-text-ui2-muted-foreground">No activity yet</p>;
  } else {
    body = (
      <ol className="tw-m-0 tw-flex tw-list-none tw-flex-col tw-p-0">
        {items.map((item, index) => {
          const colour = (isSet(item.color) ? item.color : statusColor(item.status, p.statusColors)) || null;
          const markerVars: StyleWithVars = { '--tl-c': colour || 'var(--lk-marker,var(--sc-primary))' };
          const Icon = icons ? iconFor(item.icon, null) : null;
          const time = formatTime(item.time, p.dateFormat);
          const isLast = index === items.length - 1;
          const timeNode = time ? (
            <span className="tw-whitespace-nowrap tw-text-xs tw-tabular-nums tw-text-[color:var(--lk-time,var(--sc-muted-foreground))]">
              {time}
            </span>
          ) : null;
          return (
            <li
              key={`${item.key}-${index}`}
              className={cn(
                'tw-relative tw-flex tw-gap-3',
                !isLast && (compact ? 'tw-pb-3' : 'tw-pb-6'),
                hasClick && !busy(p) && 'tw-cursor-pointer'
              )}
              style={markerVars}
              onClick={() => click(item)}
            >
              {!isLast ? (
                <span
                  aria-hidden="true"
                  className="tw-absolute tw-w-px tw-bg-[color:var(--lk-line,var(--sc-border))]"
                  style={{ left: column / 2 - 0.5, top: markerTop + marker + 4, bottom: 4 - markerTop }}
                />
              ) : null}
              <span className="tw-flex tw-shrink-0 tw-justify-center" style={{ width: column, paddingTop: markerTop }}>
                {icons ? (
                  <span
                    className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-[color:color-mix(in_srgb,var(--tl-c)_14%,var(--sc-background))] tw-text-[color:var(--tl-c)]"
                    style={{ width: marker, height: marker }}
                  >
                    {Icon ? (
                      <Icon size={compact ? 12 : 14} strokeWidth={2.25} aria-hidden="true" />
                    ) : (
                      <span className="tw-h-2 tw-w-2 tw-rounded-full tw-bg-[color:var(--tl-c)]" />
                    )}
                  </span>
                ) : (
                  <span
                    className="tw-rounded-full tw-bg-[color:var(--tl-c)] tw-ring-4 tw-ring-[color:color-mix(in_srgb,var(--tl-c)_16%,transparent)]"
                    style={{ width: marker, height: marker }}
                  />
                )}
              </span>
              <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col" style={{ paddingTop: contentTop }}>
                {p.timePosition === 'top' ? <div className="tw-mb-0.5">{timeNode}</div> : null}
                <div className="tw-flex tw-items-baseline tw-justify-between tw-gap-3">
                  <span
                    className="tw-min-w-0 tw-break-words tw-text-ui2-sm tw-font-medium tw-text-[color:var(--lk-title,var(--sc-foreground))]"
                    style={{ lineHeight: `${LINE_HEIGHT}px` }}
                  >
                    {item.title}
                  </span>
                  {p.timePosition !== 'top' ? timeNode : null}
                </div>
                {item.description ? (
                  <p
                    className={cn(
                      'tw-m-0 tw-mt-0.5 tw-break-words tw-text-[color:var(--lk-fg,var(--sc-muted-foreground))]',
                      compact ? 'tw-text-xs' : 'tw-text-ui2-sm'
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
