import React, { useMemo, useRef } from 'react';
import type { WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useAutoHeight, useExposed, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Badge, Card, Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { badgeLook } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { fontStack, textCase } from '@/AppBuilder/Widgets/Ui2/_shared/looks/typeLook';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { progressPercent, sparkPaths, splitChange, statChange, statSize, statValue, textDirection } from './statModel';
import { compactFigure } from '@/AppBuilder/Widgets/Ui2/_charts/chartsModel';
import { useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { Spinner, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
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

// Heights the label's reserve needs (px): the card's padding (py-5), two label lines, the gap to the figure, the figure.
const CARD_PADDING_Y = 40;
const LABEL_TWO_LINES = 40;
const ROW_GAP = 6;
const VALUE_LINE: Record<string, number> = { sm: 28, default: 32, lg: 40 };
const NARROW_CARD = 160;

export const ShadStat = (props: WidgetProps) => {
  const { setExposedVariables } = props;
  // The native Statistics' setters: the figure (primary) and the change (secondary), until those properties change.
  const [properties, override] = useOverrides(props.properties);
  const ref = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  useExposed(setExposedVariables, properties, {
    primaryLabel: toText(properties.label),
    primaryValue: typeof properties.value === 'number' ? properties.value : toText(properties.value),
    secondaryLabel: toText(properties.changeLabel),
    secondaryValue: toText(properties.change),
    setPrimaryValue: async (v: unknown) => override('value', typeof v === 'number' ? v : toText(v)),
    setSecondaryValue: async (v: unknown) => override('change', toText(v)),
  });
  // "+8 vs semana passada" as change: the figure stays in the chip, the words join the context line (statModel). A
  // figure is formatted in the change format (+12.4%, −3.2) and its sign sets the direction: an agent's raw
  // -9.793980410868281 printed whole, under an up arrow. Words keep their own sign, else the Trend property's.
  const change = splitChange(properties.change);
  const figure = statChange(change.chip, properties.changeFormat, properties.currency);
  const trendDirection = ({ up: 1, down: -1 } as Record<string, number>)[properties.trend] ?? 0;
  const direction = figure ? figure.direction : textDirection(change.chip) || trendDirection;
  const trend = direction > 0 ? 'up' : direction < 0 ? 'down' : 'neutral';
  // Flat (a figure that rounds to zero) draws a level line; words with no direction draw no icon.
  const TrendIcon = trend === 'down' ? TrendingDown : trend === 'up' ? TrendingUp : figure ? Minus : null;
  // The change badge takes the positive or negative colour for its direction (text, on a light tint) when set; flat
  // stays neutral.
  const trendColor = (
    { up: props.styles?.positiveColor, down: props.styles?.negativeColor } as Record<string, unknown>
  )[trend];
  // In a fixed box (dynamic height off, or the editor) the card fills the box and its content stays inside it: a
  // footnote that wrapped past the box cut the card's bottom edge off. It keeps two lines, the rest in its title. An
  // auto-height box keeps fitting the content (the card is not stretched there, or the height could only grow).
  const fixed = !(fitsContentInView(props.componentType, properties) && props.currentMode === 'view');
  // Stats side by side in an Equal heights row share one height: the FlexContainer stretches each Stat's box to the
  // tallest child on its line (boxStretch) and the card fills it. The reflow still measures the Stat at its own content
  // height, so the auto height watches the content, which keeps its natural height inside the stretched card.
  const stretched = !fixed && properties.card !== false && !!props.boxStretch;
  useAutoHeight(props, stretched ? bodyRef : ref);
  // Optional parts: an icon (a tinted tile at the right of the label, at the left of the whole figure, or on top), a
  // context line beside the change ("vs last month"), a trend line and a progress bar. Each shows only when set.
  const icon = typeof properties.icon === 'string' && properties.icon.trim() ? properties.icon.trim() : '';
  const iconPosition = ['left', 'top'].includes(properties.iconPosition) ? properties.iconPosition : 'right';
  const iconShape = ['circle', 'none'].includes(properties.iconStyle) ? properties.iconStyle : 'square';
  const size = ['sm', 'lg'].includes(properties.size) ? properties.size : 'default';
  const iconSize = size === 'lg' ? 20 : size === 'sm' ? 14 : 16;
  const iconNode = icon ? <StatIcon name={icon} shape={iconShape} size={iconSize} /> : null;
  const progress = progressPercent(properties.progress);
  const label = String(properties.label ?? '');
  // The label's two-line reserve (figures level across a row of Stats) only where the box has room for it: in a short
  // fixed box it pushed the figure down past the box's edge (a 60px Stat showed the top of "42"). There the label keeps
  // to one line.
  const labelRoom =
    (properties.card === false ? 0 : CARD_PADDING_Y) +
    LABEL_TWO_LINES +
    ROW_GAP +
    (VALUE_LINE[size] ?? VALUE_LINE.default);
  const reserveLabel = !fixed || Number(props.height) >= labelRoom;
  const context = [change.context, properties.changeLabel ? String(properties.changeLabel) : '']
    .filter(Boolean)
    .join(' · ');
  const figureChip = !!figure || /^[+\-−±]?\s?[$€£¥₹]?\d/.test(change.chip || '');
  const changeBadge = change.chip ? (
    <Badge
      variant="outline"
      style={isSet(trendColor) ? badgeLook('change', { change: trendColor }) ?? undefined : undefined}
      // A figure keeps its width (it is short once formatted) and the label beside it wraps; words take at most 60% of
      // the row and wrap. The whole change is the tooltip.
      title={String(properties.change)}
      className={cn(
        'tw-min-w-0 tw-max-w-[60%] tw-gap-1',
        figureChip && 'tw-max-w-full tw-shrink-0',
        isSet(trendColor) && 'tw-border-transparent tw-bg-[color:var(--kb-badge-bg)] tw-text-[color:var(--kb-badge-fg)]'
      )}
    >
      {TrendIcon ? <TrendIcon className="tw-h-3 tw-w-3 tw-shrink-0" data-direction={trend} /> : null}
      {/* Words without a leading figure wrap rather than being cut; a figure stays on one line, a long one shortened
          ("+$190,800.00" broke as "+$190,800.0 / 0" and squeezed the label to two lines). */}
      {figureChip ? (
        <span className="tw-whitespace-nowrap">{figure ? figure.text : compactFigure(change.chip)}</span>
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
      className={cn(
        'tw-flex tw-min-w-0 tw-flex-1 tw-flex-col',
        reserveLabel ? 'tw-gap-1.5' : 'tw-gap-1',
        fixed && 'tw-min-h-0 tw-overflow-hidden'
      )}
    >
      {icon && iconPosition === 'top' ? <div className="tw-mb-1">{iconNode}</div> : null}
      {/* The chip wraps under the label when the card is too narrow for both (it was cut at the card's edge in a
          100px card); the label keeps at least 4rem beside it otherwise. */}
      <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-start tw-justify-between tw-gap-x-2 tw-gap-y-1">
        {/* The label takes the row's spare width and two lines' height whether it wraps or not, so Stats side by side
            start their figures level ("Spend this quarter" on two lines dropped its figure below its neighbours').
            Longer labels end in an ellipsis, the whole label the tooltip. */}
        <span
          title={label || undefined}
          className={cn(
            'tw-min-w-0 tw-flex-1 tw-basis-16 tw-text-ui2-sm tw-text-[color:var(--lk-label,var(--sc-muted-foreground))]',
            label && (reserveLabel ? 'tw-line-clamp-2 tw-min-h-[2lh] tw-break-words' : 'tw-line-clamp-1'),
            textCase(props.styles?.labelTextTransform) && 'lk-label-case',
            isSet(props.styles?.labelLetterSpacing) && 'lk-label-tracking'
          )}
        >
          {label}
        </span>
        {badgeInHeader ? changeBadge : null}
        {icon && iconPosition === 'right' ? iconNode : null}
      </div>
      <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline tw-gap-x-2 tw-gap-y-1">
        <span
          className={cn(
            statSize(size),
            !reserveLabel && 'tw-leading-tight',
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
    <Shell {...props} innerRef={ref} className={stretched ? 'tw-h-full' : undefined}>
      {properties.card === false ? (
        body
      ) : (
        <Card
          className={cn(
            'tw-rounded-[var(--lk-radius,calc(var(--sc-radius)+4px))] tw-border-[color:var(--lk-border,var(--sc-border))] tw-bg-[color:var(--lk-bg,var(--sc-card))]',
            // A narrow card (a phone's quarter-width KPI) keeps less padding, so the label and the chip fit beside or
            // under each other instead of the chip being cut at the card's edge.
            Number(props.width) > 0 && Number(props.width) < NARROW_CARD ? 'tw-px-3' : 'tw-px-6',
            // A short box keeps less padding, so the figure fits.
            reserveLabel ? 'tw-py-5' : 'tw-py-3',
            fixed && 'tw-flex tw-flex-col tw-overflow-hidden',
            stretched && 'tw-h-full'
          )}
          style={fixed && Number(props.height) > 0 ? { height: Number(props.height) } : undefined}
        >
          {stretched ? <div ref={bodyRef}>{body}</div> : body}
        </Card>
      )}
    </Shell>
  );
};

export default withControlState(ShadStat);
