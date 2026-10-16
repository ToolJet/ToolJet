import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { StyleWithVars, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { useHasEvent } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { colorFor, toTags } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { own } from '@/AppBuilder/Widgets/Ui2/_display/displayParts';

// ---- Tags ------------------------------------------------------------------------------------------------------------

const TAG_SIZE: Record<string, string> = {
  sm: 'tw-h-5 tw-px-1.5 tw-text-[11px]',
  default: 'tw-h-6 tw-px-2 tw-text-xs',
  lg: 'tw-h-7 tw-px-2.5 tw-text-ui2-sm',
};

export const TAG_GAP = 6;

export const tagClasses = (variant: unknown, mapped: boolean): string => {
  if (mapped) {
    if (variant === 'solid')
      return 'tw-border-transparent tw-bg-[color:var(--tg)] tw-text-[color:var(--sc-primary-foreground)]';
    if (variant === 'outline')
      return 'tw-border-[color:color-mix(in_srgb,var(--tg)_45%,transparent)] tw-bg-transparent tw-text-[color:var(--tg)]';
    return 'tw-border-transparent tw-bg-[color:color-mix(in_srgb,var(--tg)_14%,transparent)] tw-text-[color:var(--tg)]';
  }
  if (variant === 'solid')
    return 'tw-border-[color:var(--lk-border,transparent)] tw-bg-[color:var(--lk-bg,var(--sc-primary))] tw-text-[color:var(--lk-fg,var(--sc-primary-foreground))]';
  if (variant === 'outline')
    return 'tw-border-[color:var(--lk-border,var(--sc-border))] tw-bg-[color:var(--lk-bg,transparent)] tw-text-[color:var(--lk-fg,var(--sc-foreground))]';
  return 'tw-border-[color:var(--lk-border,transparent)] tw-bg-[color:var(--lk-bg,var(--sc-secondary))] tw-text-[color:var(--lk-fg,var(--sc-secondary-foreground))]';
};

/** How many tags fit on one line, leaving room for the +N chip when some do not (all when nothing is measured). */
export const useFit = (
  enabled: boolean,
  tags: string[],
  rowRef: RefObject<HTMLDivElement>,
  measureRef: RefObject<HTMLDivElement>
): number => {
  const [fit, setFit] = useState(tags.length);
  const key = tags.join('\u0000');
  useLayoutEffect(() => {
    if (!enabled) return undefined;
    const measure = () => {
      const row = rowRef.current;
      const probe = measureRef.current;
      if (!row || !probe) return;
      const available = row.clientWidth;
      // The probe's children are the chips it draws (spans and a +N span), all HTML elements.
      const chips = Array.from(probe.children) as HTMLElement[];
      const plus = chips.pop();
      if (!available || !chips.length) return setFit(tags.length);
      const widths = chips.map((c) => c.offsetWidth);
      if (widths.every((w) => !w)) return setFit(tags.length);
      const total = widths.reduce((s, w) => s + w, 0) + TAG_GAP * (widths.length - 1);
      if (total <= available) return setFit(tags.length);
      const plusWidth = (plus?.offsetWidth || 32) + TAG_GAP;
      let used = 0;
      let n = 0;
      while (n < widths.length && used + widths[n] + (n ? TAG_GAP : 0) + plusWidth <= available) {
        used += widths[n] + (n ? TAG_GAP : 0);
        n += 1;
      }
      setFit(Math.max(0, n));
    };
    measure();
    if (typeof ResizeObserver === 'undefined' || !rowRef.current) return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, [enabled, key]); // eslint-disable-line react-hooks/exhaustive-deps
  return enabled ? Math.min(fit, tags.length) : tags.length;
};

export const ShadTags = (props: WidgetProps) => {
  const { properties: p, setExposedVariables, setExposedVariable, fireEvent, id } = props;
  const ref = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const tags = useMemo(() => toTags(p.tags), [stringify(p.tags ?? null)]); // eslint-disable-line react-hooks/exhaustive-deps
  const [last, setLast] = useState('');
  useExposed(setExposedVariables, p, { lastClickedTag: last, tags });
  const hasClick = useHasEvent(id, 'onTagClicked');
  const single = p.overflow === 'single';
  const shown = useFit(single, tags, rowRef, measureRef);
  const variant = ['soft', 'outline', 'solid'].includes(p.variant) ? p.variant : 'soft';
  const size = own(TAG_SIZE, p.size) || TAG_SIZE.default;
  const radius = p.pill === true ? 'tw-rounded-full' : 'tw-rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]';
  const base = cn(
    'tw-inline-flex tw-shrink-0 tw-items-center tw-whitespace-nowrap tw-border tw-font-medium tw-leading-none tw-transition-colors',
    size,
    radius
  );
  const chip = (tag: string, i: number, interactive: boolean) => {
    const colour = colorFor(tag, p.tagColors);
    const className = cn(
      base,
      tagClasses(variant, !!colour),
      interactive && hasClick ? 'tw-cursor-pointer hover:tw-opacity-80' : 'tw-cursor-default',
      'focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring disabled:tw-cursor-default disabled:tw-opacity-50'
    );
    const style = colour ? ({ '--tg': colour } as StyleWithVars) : undefined;
    if (!interactive) {
      return (
        <span key={`${tag}-${i}`} className={className} style={style}>
          {tag}
        </span>
      );
    }
    return (
      <button
        key={`${tag}-${i}`}
        type="button"
        className={className}
        style={style}
        disabled={!!p.disabledState}
        onClick={() => {
          if (busy(p)) return;
          setLast(tag);
          setExposedVariable('lastClickedTag', tag);
          fireEvent('onTagClicked');
        }}
      >
        {tag}
      </button>
    );
  };
  const hidden = tags.length - shown;
  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (p.loadingState) {
    body = (
      <div className="tw-flex tw-flex-wrap tw-gap-1.5">
        {[56, 72, 48].map((w) => (
          <Skeleton key={w} className={cn('tw-h-6', radius)} style={{ width: w }} />
        ))}
      </div>
    );
  } else if (!tags.length) {
    body = <span className="tw-text-ui2-sm tw-text-ui2-muted-foreground">—</span>;
  } else {
    body = (
      <div className="tw-relative">
        <div
          ref={rowRef}
          className={cn('tw-flex tw-gap-1.5', single ? 'tw-flex-nowrap tw-overflow-hidden' : 'tw-flex-wrap')}
          aria-label="Tags"
          role="list"
        >
          {tags.slice(0, shown).map((tag, i) => (
            <span role="listitem" key={`${tag}-${i}`} className="tw-contents">
              {chip(tag, i, true)}
            </span>
          ))}
          {hidden > 0 ? (
            <span
              className={cn(base, tagClasses('outline', false), 'tw-text-[color:var(--sc-muted-foreground)]')}
              title={tags.slice(shown).join(', ')}
            >
              +{hidden}
            </span>
          ) : null}
        </div>
        {single ? (
          // Measures every tag (and a +N chip) off-screen, so the row knows how many fit.
          <div
            ref={measureRef}
            aria-hidden="true"
            className="tw-pointer-events-none tw-invisible tw-absolute tw-left-0 tw-top-0 tw-flex tw-gap-1.5 tw-whitespace-nowrap"
          >
            {tags.map((tag, i) => chip(tag, i, false))}
            <span className={cn(base, tagClasses('outline', false))}>+{tags.length}</span>
          </div>
        ) : null}
      </div>
    );
  }
  return (
    <Shell {...props} innerRef={ref}>
      {body}
    </Shell>
  );
};

export default withControlState(ShadTags);
