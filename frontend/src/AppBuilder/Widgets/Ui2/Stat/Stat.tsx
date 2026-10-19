import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useAutoHeight, useExposed, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Badge, Card, Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { badgeLook } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { fontStack, textCase } from '@/AppBuilder/Widgets/Ui2/_shared/looks/typeLook';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { progressPercent, sparkPaths, splitChange, statSize, statValue } from './statModel';
import { compactFigure } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Spinner, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { joinStatRow } from './statRow';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { isSet, toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { useSvgId } from '@/AppBuilder/Widgets/Ui2/_shared/svgId';

// The Stat's icon is drawn by the Display module, which holds the lucide icon map; it loads only for a Stat with one.
const StatIconGlyph = React.lazy(() =>
  import('@/AppBuilder/Widgets/Ui2/_display/displayParts').then((m) => ({ default: m.IconGlyph }))
);

export const StatIcon = ({ name, shape, size }: { name: string; shape: string; size: number }) => {
  const box = shape === 'none' ? size : size * 2;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'tw-inline-flex tw-shrink-0 tw-items-center tw-justify-center tw-text-[color:var(--lk-icon,var(--sc-primary-ink))]',
        shape !== 'none' &&
          'tw-bg-[color:var(--lk-chip,color-mix(in_srgb,var(--lk-icon,var(--sc-primary))_12%,transparent))]',
        shape === 'circle' ? 'tw-rounded-full' : 'tw-rounded-[calc(var(--sc-radius)-2px)]'
      )}
      style={{ width: box, height: box }}
    >
      <React.Suspense fallback={null}>
        <StatIconGlyph name={name} size={size} />
      </React.Suspense>
    </span>
  );
};

// A small trend line under the figure, drawn in a fixed viewBox and stretched to the card's width.
export const SPARK_W = 120;

export const SPARK_H = 36;

export const StatSparkline = ({ data, type }: { data: unknown; type: unknown }) => {
  // The trend data (a list or '3,5,4' text) is parsed into paths again only when it changes, not on every render.
  const points = useStable(data);
  const paths = useMemo(() => sparkPaths(points, SPARK_W, SPARK_H), [points]);
  const gradient = useSvgId('stat-spark');
  if (!paths) return null;
  return (
    <svg
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      preserveAspectRatio="none"
      className="tw-mt-1 tw-h-9 tw-w-full tw-text-[color:var(--lk-spark,var(--sc-chart-1))]"
      aria-hidden="true"
    >
      {type === 'line' ? null : (
        <>
          <defs>
            <linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.28} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <path d={paths.area} fill={`url(#${gradient})`} stroke="none" />
        </>
      )}
      <path
        d={paths.line}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const ShadStat = (props: WidgetProps) => {
  const { setExposedVariables } = props;
  // The native Statistics' setters: the figure (primary) and the change (secondary), until those properties change.
  const [properties, override] = useOverrides(props.properties);
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {
    primaryLabel: toText(properties.label),
    primaryValue: typeof properties.value === 'number' ? properties.value : toText(properties.value),
    secondaryLabel: toText(properties.changeLabel),
    secondaryValue: toText(properties.change),
    setPrimaryValue: async (v: unknown) => override('value', typeof v === 'number' ? v : toText(v)),
    setSecondaryValue: async (v: unknown) => override('change', toText(v)),
  });
  const trend = properties.trend || 'neutral';
  const TrendIcon = trend === 'down' ? TrendingDown : TrendingUp;
  // The change badge takes the positive or negative colour for its trend (text, on a light tint) when set.
  const trendColor = (
    { up: props.styles?.positiveColor, down: props.styles?.negativeColor } as Record<string, unknown>
  )[trend];
  // In a fixed box (dynamic height off, or the editor) the card fills the box and its content stays inside it: a
  // footnote that wrapped past the box cut the card's bottom edge off. It keeps two lines, the rest in its title. An
  // auto-height box keeps fitting the content (the card is not stretched there, or the height could only grow).
  const fixed = !(fitsContentInView(props.componentType, properties) && props.currentMode === 'view');
  // Stats side by side in a row share one height: each reports its content's natural height (the content plus the
  // card's padding and border, never the stretched card) and takes the row's tallest as its minimum (statRow.ts).
  const evenRow = !fixed && properties.card !== false;
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [rowMin, setRowMin] = useState(0);
  useLayoutEffect(() => {
    const card = cardRef.current;
    const content = bodyRef.current;
    const container = ref.current?.closest('.flex-child-wrapper')?.parentElement;
    if (!evenRow || !card || !content || !container) return undefined;
    if (!getComputedStyle(container).flexDirection.startsWith('row')) return undefined;
    const member = joinStatRow(container, setRowMin);
    const measure = () => {
      const cs = getComputedStyle(card);
      const chrome = (['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'] as const).reduce(
        (sum, key) => sum + (parseFloat(cs[key]) || 0),
        0
      );
      member.report(content.offsetHeight + chrome);
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(content);
    return () => {
      observer?.disconnect();
      member.leave();
      setRowMin(0);
    };
  }, [evenRow]);
  // Optional parts: an icon (a tinted tile at the right of the label, at the left of the whole figure, or on top), a
  // context line beside the change ("vs last month"), a trend line and a progress bar. Each shows only when set.
  const icon = typeof properties.icon === 'string' && properties.icon.trim() ? properties.icon.trim() : '';
  const iconPosition = ['left', 'top'].includes(properties.iconPosition) ? properties.iconPosition : 'right';
  const iconShape = ['circle', 'none'].includes(properties.iconStyle) ? properties.iconStyle : 'square';
  const size = ['sm', 'lg'].includes(properties.size) ? properties.size : 'default';
  const iconSize = size === 'lg' ? 20 : size === 'sm' ? 14 : 16;
  const iconNode = icon ? <StatIcon name={icon} shape={iconShape} size={iconSize} /> : null;
  const progress = progressPercent(properties.progress);
  // "+8 vs semana passada" as change: the figure stays in the chip, the words join the context line (statModel).
  const change = splitChange(properties.change);
  const context = [change.context, properties.changeLabel ? String(properties.changeLabel) : '']
    .filter(Boolean)
    .join(' · ');
  const figureChip = /^[+\-−±]?\s?[$€£¥₹]?\d/.test(change.chip || '');
  const changeBadge = change.chip ? (
    <Badge
      variant="outline"
      style={isSet(trendColor) ? badgeLook('change', { change: trendColor }) ?? undefined : undefined}
      // A long change shrinks to at most 60% of the label row and ends in an ellipsis, its whole text the tooltip: it
      // kept its full width and was cut off at the card's edge.
      title={String(properties.change)}
      className={cn(
        'tw-min-w-0 tw-max-w-[60%] tw-gap-1',
        figureChip && 'tw-shrink-0',
        isSet(trendColor) && 'tw-border-transparent tw-bg-[color:var(--kb-badge-bg)] tw-text-[color:var(--kb-badge-fg)]'
      )}
    >
      {trend !== 'neutral' ? <TrendIcon className="tw-h-3 tw-w-3 tw-shrink-0" /> : null}
      {/* Words without a leading figure wrap rather than being cut; a figure stays on one line, a long one shortened
          ("+$190,800.00" broke as "+$190,800.0 / 0" and squeezed the label to two lines). */}
      {figureChip ? (
        <span className="tw-whitespace-nowrap">{compactFigure(change.chip)}</span>
      ) : (
        <span className="tw-min-w-0 tw-whitespace-normal tw-break-words">{change.chip}</span>
      )}
    </Badge>
  ) : null;
  // The badge sits in the label row unless the icon takes that corner; then it follows the figure.
  const badgeInHeader = !(icon && iconPosition === 'right');
  const changeLabel = context ? (
    // In a fixed box the context line keeps to one line: wrapping to two, it pushed the title out of a KPI tile.
    <span
      className={cn('tw-text-xs tw-text-[color:var(--lk-help,var(--sc-muted-foreground))]', fixed && 'tw-line-clamp-1')}
      title={fixed ? context : undefined}
    >
      {context}
    </span>
  ) : null;
  const content = (
    <div
      className={cn('tw-flex tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-1.5', fixed && 'tw-min-h-0 tw-overflow-hidden')}
    >
      {icon && iconPosition === 'top' ? <div className="tw-mb-1">{iconNode}</div> : null}
      <div className="tw-flex tw-min-w-0 tw-items-start tw-justify-between tw-gap-2">
        <span
          className={cn(
            'tw-min-w-0 tw-text-ui2-sm tw-text-[color:var(--lk-label,var(--sc-muted-foreground))]',
            textCase(props.styles?.labelTextTransform) && 'lk-label-case',
            isSet(props.styles?.labelLetterSpacing) && 'lk-label-tracking'
          )}
        >
          {String(properties.label ?? '')}
        </span>
        {badgeInHeader ? changeBadge : null}
        {icon && iconPosition === 'right' ? iconNode : null}
      </div>
      <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1">
        <span
          className={cn(
            statSize(size),
            'tw-font-semibold tw-tabular-nums tw-tracking-tight tw-text-[color:var(--lk-value,var(--sc-foreground))]',
            fontStack(props.styles?.valueFontFamily) && 'lk-value-font'
          )}
        >
          {properties.loadingState ? (
            wantsSkeleton(properties) ? (
              <Skeleton className="tw-h-8 tw-w-24" />
            ) : (
              <span className="tw-flex tw-h-8 tw-items-center">
                <Spinner />
              </span>
            )
          ) : (
            // A dash when there is no value, as the Summary strip shows: the label alone read as a broken card.
            statValue(properties.value, { valueFormat: properties.valueFormat, currency: properties.currency }) || '–'
          )}
        </span>
        {badgeInHeader ? null : changeBadge}
        {changeLabel}
      </div>
      {properties.footnote ? (
        <span
          className={cn(
            'tw-text-ui2-sm tw-text-[color:var(--lk-help,var(--sc-muted-foreground))]',
            fixed && 'tw-line-clamp-2'
          )}
          title={fixed ? String(properties.footnote) : undefined}
        >
          {String(properties.footnote)}
        </span>
      ) : null}
      {progress !== null ? (
        <div className="tw-mt-1 tw-flex tw-flex-col tw-gap-1">
          <div className="tw-h-1.5 tw-w-full tw-overflow-hidden tw-rounded-full tw-bg-[color:var(--sc-muted)]">
            <div
              className="tw-h-full tw-rounded-full tw-bg-[color:var(--lk-progress,var(--sc-primary))] tw-transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          {properties.progressLabel ? (
            <span className="tw-text-xs tw-text-[color:var(--lk-help,var(--sc-muted-foreground))]">
              {String(properties.progressLabel)}
            </span>
          ) : null}
        </div>
      ) : null}
      {properties.trendData ? <StatSparkline data={properties.trendData} type={properties.sparklineType} /> : null}
    </div>
  );
  const body =
    icon && iconPosition === 'left' ? (
      <div className="tw-flex tw-items-start tw-gap-3">
        {iconNode}
        {content}
      </div>
    ) : (
      content
    );
  return (
    <Shell {...props} innerRef={ref}>
      {properties.card === false ? (
        body
      ) : (
        <Card
          ref={cardRef}
          className={cn(
            'tw-rounded-[var(--lk-radius,calc(var(--sc-radius)+4px))] tw-border-[color:var(--lk-border,var(--sc-border))] tw-bg-[color:var(--lk-bg,var(--sc-card))] tw-px-6 tw-py-5',
            fixed && 'tw-flex tw-flex-col tw-overflow-hidden'
          )}
          style={
            fixed && Number(props.height) > 0
              ? { height: Number(props.height) }
              : evenRow && rowMin > 0
              ? { minHeight: rowMin }
              : undefined
          }
        >
          {evenRow ? <div ref={bodyRef}>{body}</div> : body}
        </Card>
      )}
    </Shell>
  );
};

export default withControlState(ShadStat);
