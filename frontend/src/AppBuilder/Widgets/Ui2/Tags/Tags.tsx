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
  sm: 'h-5 px-1.5 text-[11px]',
  default: 'h-6 px-2 text-xs',
  lg: 'h-7 px-2.5 text-sm',
};

export const TAG_GAP = 6;

export const tagClasses = (variant: unknown, mapped: boolean): string => {
  if (mapped) {
    if (variant === 'solid') return 'border-transparent bg-[color:var(--tg)] text-[color:var(--sc-primary-foreground)]';
    if (variant === 'outline')
      return 'border-[color:color-mix(in_srgb,var(--tg)_45%,transparent)] bg-transparent text-[color:var(--tg)]';
    return 'border-transparent bg-[color:color-mix(in_srgb,var(--tg)_14%,transparent)] text-[color:var(--tg)]';
  }
  if (variant === 'solid')
    return 'border-[color:var(--lk-border,transparent)] bg-[color:var(--lk-bg,var(--sc-primary))] text-[color:var(--lk-fg,var(--sc-primary-foreground))]';
  if (variant === 'outline')
    return 'border-[color:var(--lk-border,var(--sc-border))] bg-[color:var(--lk-bg,transparent)] text-[color:var(--lk-fg,var(--sc-foreground))]';
  return 'border-[color:var(--lk-border,transparent)] bg-[color:var(--lk-bg,var(--sc-secondary))] text-[color:var(--lk-fg,var(--sc-secondary-foreground))]';
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
  const radius = p.pill === true ? 'rounded-full' : 'rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]';
  const base = cn(
    'inline-flex shrink-0 items-center whitespace-nowrap border font-medium leading-none transition-colors',
    size,
    radius
  );
  const chip = (tag: string, i: number, interactive: boolean) => {
    const colour = colorFor(tag, p.tagColors);
    const className = cn(
      base,
      tagClasses(variant, !!colour),
      interactive && hasClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50'
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
      <div className="flex flex-wrap gap-1.5">
        {[56, 72, 48].map((w) => (
          <Skeleton key={w} className={cn('h-6', radius)} style={{ width: w }} />
        ))}
      </div>
    );
  } else if (!tags.length) {
    body = <span className="text-sm text-muted-foreground">—</span>;
  } else {
    body = (
      <div className="relative">
        <div
          ref={rowRef}
          className={cn('flex gap-1.5', single ? 'flex-nowrap overflow-hidden' : 'flex-wrap')}
          aria-label="Tags"
          role="list"
        >
          {tags.slice(0, shown).map((tag, i) => (
            <span role="listitem" key={`${tag}-${i}`} className="contents">
              {chip(tag, i, true)}
            </span>
          ))}
          {hidden > 0 ? (
            <span
              className={cn(base, tagClasses('outline', false), 'text-[color:var(--sc-muted-foreground)]')}
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
            className="pointer-events-none invisible absolute left-0 top-0 flex gap-1.5 whitespace-nowrap"
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
