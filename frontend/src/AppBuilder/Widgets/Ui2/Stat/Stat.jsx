import React, { useLayoutEffect, useRef, useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useAutoHeight, useExposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Badge, Card, Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { badgeLook, isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { fontStack, textCase } from '@/AppBuilder/Widgets/Ui2/_shared/looks/typeLook';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { progressPercent, sparkPaths, splitChange, statSize, statValue } from '@/AppBuilder/Widgets/Shadcn/statModel';
import { compactFigure } from '@/AppBuilder/Widgets/Shadcn/chartsModel';
import { textArg, useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Spinner, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { joinStatRow } from '@/AppBuilder/Widgets/Shadcn/statRow';
import { Shell } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';

// The Stat's icon is drawn by the Display module, which holds the lucide icon map; it loads only for a Stat with one.
const StatIconGlyph = React.lazy(() =>
  import('@/AppBuilder/Widgets/Shadcn/ShadDisplay').then((m) => ({ default: m.IconGlyph }))
);

export const StatIcon = ({ name, shape, size }) => {
  const box = shape === 'none' ? size : size * 2;
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center text-[color:var(--lk-icon,var(--sc-primary-ink))]',
        shape !== 'none' &&
          'bg-[color:var(--lk-chip,color-mix(in_srgb,var(--lk-icon,var(--sc-primary))_12%,transparent))]',
        shape === 'circle' ? 'rounded-full' : 'rounded-[calc(var(--sc-radius)-2px)]'
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

export const StatSparkline = ({ data, type, id }) => {
  const paths = sparkPaths(data, SPARK_W, SPARK_H);
  if (!paths) return null;
  const gradient = `stat-spark-${String(id ?? 'x').replace(/[^\w-]/g, '')}`;
  return (
    <svg
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      preserveAspectRatio="none"
      className="mt-1 h-9 w-full text-[color:var(--lk-spark,var(--sc-chart-1))]"
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

export const ShadStat = (props) => {
  const { setExposedVariables } = props;
  // The native Statistics' setters: the figure (primary) and the change (secondary), until those properties change.
  const [properties, override] = useOverrides(props.properties);
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {
    primaryLabel: textArg(properties.label),
    primaryValue: typeof properties.value === 'number' ? properties.value : textArg(properties.value),
    secondaryLabel: textArg(properties.changeLabel),
    secondaryValue: textArg(properties.change),
    setPrimaryValue: async (v) => override('value', typeof v === 'number' ? v : textArg(v)),
    setSecondaryValue: async (v) => override('change', textArg(v)),
  });
  const trend = properties.trend || 'neutral';
  const TrendIcon = trend === 'down' ? TrendingDown : TrendingUp;
  // The change badge takes the positive or negative colour for its trend (text, on a light tint) when set.
  const trendColor = { up: props.styles?.positiveColor, down: props.styles?.negativeColor }[trend];
  // In a fixed box (dynamic height off, or the editor) the card fills the box and its content stays inside it: a
  // footnote that wrapped past the box cut the card's bottom edge off. It keeps two lines, the rest in its title. An
  // auto-height box keeps fitting the content (the card is not stretched there, or the height could only grow).
  const fixed = !(fitsContentInView(props.componentType, properties) && props.currentMode === 'view');
  // Stats side by side in a row share one height: each reports its content's natural height (the content plus the
  // card's padding and border, never the stretched card) and takes the row's tallest as its minimum (statRow.js).
  const evenRow = !fixed && properties.card !== false;
  const cardRef = useRef(null);
  const bodyRef = useRef(null);
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
      const chrome = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'].reduce(
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
      style={isSet(trendColor) ? badgeLook('change', { change: trendColor }) : undefined}
      // A long change shrinks to at most 60% of the label row and ends in an ellipsis, its whole text the tooltip: it
      // kept its full width and was cut off at the card's edge.
      title={String(properties.change)}
      className={cn(
        'min-w-0 max-w-[60%] gap-1',
        figureChip && 'shrink-0',
        isSet(trendColor) && 'border-transparent bg-[color:var(--kb-badge-bg)] text-[color:var(--kb-badge-fg)]'
      )}
    >
      {trend !== 'neutral' ? <TrendIcon className="h-3 w-3 shrink-0" /> : null}
      {/* Words without a leading figure wrap rather than being cut; a figure stays on one line, a long one shortened
          ("+$190,800.00" broke as "+$190,800.0 / 0" and squeezed the label to two lines, 2026-10-14). */}
      {figureChip ? (
        <span className="whitespace-nowrap">{compactFigure(change.chip)}</span>
      ) : (
        <span className="min-w-0 whitespace-normal break-words">{change.chip}</span>
      )}
    </Badge>
  ) : null;
  // The badge sits in the label row unless the icon takes that corner; then it follows the figure.
  const badgeInHeader = !(icon && iconPosition === 'right');
  const changeLabel = context ? (
    // In a fixed box the context line keeps to one line: wrapping to two, it pushed the title out of a KPI tile.
    <span
      className={cn('text-xs text-[color:var(--lk-help,var(--sc-muted-foreground))]', fixed && 'line-clamp-1')}
      title={fixed ? context : undefined}
    >
      {context}
    </span>
  ) : null;
  const content = (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-1.5', fixed && 'min-h-0 overflow-hidden')}>
      {icon && iconPosition === 'top' ? <div className="mb-1">{iconNode}</div> : null}
      <div className="flex min-w-0 items-start justify-between gap-2">
        <span
          className={cn(
            'min-w-0 text-sm text-[color:var(--lk-label,var(--sc-muted-foreground))]',
            textCase(props.styles?.labelTextTransform) && 'lk-label-case',
            isSet(props.styles?.labelLetterSpacing) && 'lk-label-tracking'
          )}
        >
          {String(properties.label ?? '')}
        </span>
        {badgeInHeader ? changeBadge : null}
        {icon && iconPosition === 'right' ? iconNode : null}
      </div>
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className={cn(
            statSize(size),
            'font-semibold tabular-nums tracking-tight text-[color:var(--lk-value,var(--sc-foreground))]',
            fontStack(props.styles?.valueFontFamily) && 'lk-value-font'
          )}
        >
          {properties.loadingState ? (
            wantsSkeleton(properties) ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <span className="flex h-8 items-center">
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
          className={cn('text-sm text-[color:var(--lk-help,var(--sc-muted-foreground))]', fixed && 'line-clamp-2')}
          title={fixed ? String(properties.footnote) : undefined}
        >
          {String(properties.footnote)}
        </span>
      ) : null}
      {progress !== null ? (
        <div className="mt-1 flex flex-col gap-1">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--sc-muted)]">
            <div
              className="h-full rounded-full bg-[color:var(--lk-progress,var(--sc-primary))] transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
          {properties.progressLabel ? (
            <span className="text-xs text-[color:var(--lk-help,var(--sc-muted-foreground))]">
              {String(properties.progressLabel)}
            </span>
          ) : null}
        </div>
      ) : null}
      {properties.trendData ? (
        <StatSparkline data={properties.trendData} type={properties.sparklineType} id={props.id} />
      ) : null}
    </div>
  );
  const body =
    icon && iconPosition === 'left' ? (
      <div className="flex items-start gap-3">
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
            'rounded-[var(--lk-radius,calc(var(--sc-radius)+4px))] border-[color:var(--lk-border,var(--sc-border))] bg-[color:var(--lk-bg,var(--sc-card))] px-6 py-5',
            fixed && 'flex flex-col overflow-hidden'
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
