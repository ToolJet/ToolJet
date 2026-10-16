import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { CalendarIcon, ChevronRight, Inbox, TrendingDown, TrendingUp } from 'lucide-react';
import { initials, list, toOptions, useAutoHeight, useExposed } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Calendar,
  Card,
  Checkbox,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
  Slider,
  Switch,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
  cn,
} from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { badgeLook, isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { toDate, ymd } from './actionsModel';
import { dateProblem, dateRules, parseDateTime, toDayjsFormat } from './inputsModel';
import { sliderBounds, sliderValues } from './sliderModel';
import { lookVars, whenSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import { clampLines, fontStack, textCase, typeClasses } from '@/AppBuilder/Widgets/Ui2/_shared/looks/typeLook';
import { useSizedBox } from '@/AppBuilder/Widgets/Ui2/_shared/boxFit';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { progressPercent, sparkPaths, splitChange, statSize, statValue } from './statModel';
import { compactFigure } from './chartsModel';
import { textArg, useFocusEvents, useHasEvent, useOverrides } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { LoadingBox, Spinner, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { joinStatRow } from './statRow';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { CONTROL, Field, HELP, LABEL, fieldName, textAlign } from '@/AppBuilder/Widgets/Ui2/_shared/field';
import { avatarPeople } from '@/AppBuilder/Widgets/Ui2/_shared/people';
import {
  CheckedRow,
  useChecked,
  useTextBox,
  useValidation,
  useValue,
} from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';
export { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
export {
  CONTROL,
  ERROR,
  Field,
  HELP,
  INVALID_VARS,
  LABEL,
  fieldName,
  textAlign,
} from '@/AppBuilder/Widgets/Ui2/_shared/field';
export {
  CheckedRow,
  useChecked,
  useTextBox,
  useValidation,
  useValue,
} from '@/AppBuilder/Widgets/Ui2/_shared/formHooks';
export { avatarPeople } from '@/AppBuilder/Widgets/Ui2/_shared/people';

export { withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';

export { Spinner, LoadingBox, wantsSkeleton };

// ---- Actions and feedback ------------------------------------------------------------------------------------------

export const ShadButton = (props) => {
  const { styles, setExposedVariables, fireEvent } = props;
  // setText changes the label until the Label property itself changes, like the native Button's.
  const [properties, override] = useOverrides(props.properties);
  const latest = useRef(properties);
  latest.current = properties;
  useExposed(setExposedVariables, properties, {
    buttonText: String(properties.text ?? ''),
    setText: async (text) => override('text', textArg(text)),
    click: async () => {
      if (!busy(latest.current)) fireEvent('onClick');
    },
  });
  // Like ToolJet's Button, it fills its box's height, and its width when the box was sized for it (grid, or a
  // fixed-width flex child); as a flex fill child it keeps its own width. Full width always fills. A fixed 36px
  // button in a 36px box overflowed the box's padding and lost its bottom edge.
  const boxRef = useRef(null);
  const fillsBox = useSizedBox(boxRef);
  // Each variant has its own colours, so a style replaces them only when set. A set background darkens a little on
  // hover unless the hover background is set too.
  const hover = isSet(styles?.hoverBackgroundColor)
    ? 'hover:bg-[color:var(--lk-hover)]'
    : whenSet(styles, 'backgroundColor', 'hover:bg-[color:color-mix(in_srgb,var(--lk-bg)_88%,#000)]');
  return (
    <Shell {...props} innerRef={boxRef} className="h-full">
      <Button
        variant={properties.variant || 'default'}
        size={properties.size || 'default'}
        className={cn(
          'h-full',
          (properties.fullWidth === true || fillsBox) && 'w-full',
          whenSet(styles, 'backgroundColor', 'bg-[color:var(--lk-bg)]'),
          hover,
          whenSet(styles, 'textColor', 'text-[color:var(--lk-fg)] hover:text-[color:var(--lk-fg)]'),
          whenSet(styles, 'borderColor', 'border border-[color:var(--lk-border)]'),
          whenSet(styles, 'borderRadius', 'rounded-[var(--lk-radius)]')
        )}
        // In a List view row its box fits its content (height auto), where h-full alone shrank the button to its
        // label's line (20px); it keeps the height it was drawn at.
        style={Number(props.height) > 0 ? { minHeight: Number(props.height) } : undefined}
        disabled={!!properties.disabledState || !!properties.loadingState}
        onClick={() => fireEvent('onClick')}
        onMouseEnter={() => fireEvent('onHover')}
      >
        {properties.loadingState ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {String(properties.text ?? '')}
      </Button>
    </Shell>
  );
};

export const ShadAlert = (props) => {
  const { properties, styles, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props} innerRef={ref}>
      <Alert
        variant={properties.variant === 'destructive' ? 'destructive' : 'default'}
        className={cn(
          whenSet(styles, 'backgroundColor', 'bg-[color:var(--lk-bg)]'),
          whenSet(styles, 'borderColor', 'border-[color:var(--lk-border)]'),
          whenSet(styles, 'borderRadius', 'rounded-[var(--lk-radius)]')
        )}
      >
        <AlertTitle className={whenSet(styles, 'titleColor', 'text-[color:var(--lk-title)]')}>
          {String(properties.title ?? '')}
        </AlertTitle>
        {properties.description ? (
          <AlertDescription className={whenSet(styles, 'textColor', 'text-[color:var(--lk-fg)] opacity-100')}>
            {String(properties.description)}
          </AlertDescription>
        ) : null}
      </Alert>
    </Shell>
  );
};

const MAX_CRUMBS = 8;
const ELLIPSIS = Symbol('ellipsis');

export const ShadBreadcrumb = (props) => {
  const { properties, setExposedVariables, setExposedVariable, fireEvent, id } = props;
  useExposed(setExposedVariables, properties, {});
  const all = list(properties.items);
  // onItemClick (with lastClickedItem: the item, its title and index) for navigating back up the trail.
  const clickable = useHasEvent(id, 'onItemClicked') && !busy(properties);
  const clickItem = (item, index) => {
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
        <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
          {items.map((item, i) => (
            <li key={i} className="inline-flex items-center gap-1.5">
              <span
                onClick={() => clickItem(trail[i], indexes[i])}
                role={clickable && item !== ELLIPSIS ? 'button' : undefined}
                tabIndex={clickable && item !== ELLIPSIS ? 0 : undefined}
                onKeyDown={(e) => clickable && e.key === 'Enter' && clickItem(trail[i], indexes[i])}
                className={cn(
                  i === items.length - 1
                    ? 'font-normal text-[color:var(--lk-current,var(--sc-foreground))]'
                    : 'transition-colors',
                  clickable && item !== ELLIPSIS && 'cursor-pointer hover:text-[color:var(--sc-foreground)]'
                )}
              >
                {item === ELLIPSIS ? '…' : String(item)}
              </span>
              {i < items.length - 1 ? (
                <ChevronRight className="h-3.5 w-3.5 text-[color:var(--lk-sep,currentColor)]" />
              ) : null}
            </li>
          ))}
        </ol>
      </nav>
    </Shell>
  );
};

// ---- Typography ----------------------------------------------------------------------------------------------------

const HEADING = {
  h1: 'scroll-m-20 text-4xl font-extrabold tracking-tight',
  h2: 'scroll-m-20 text-3xl font-semibold tracking-tight',
  h3: 'scroll-m-20 text-2xl font-semibold tracking-tight',
  h4: 'scroll-m-20 text-xl font-semibold tracking-tight',
};

/** The native Text's events and actions, shared by Heading and Text: onClick and onHover, setText and clear (which
 *  hold until the Text property itself changes), and the shown text exposed as `text`. */
const useTextActions = (props) => {
  const { setExposedVariables, fireEvent, id } = props;
  const [properties, override] = useOverrides(props.properties);
  useExposed(setExposedVariables, properties, {
    text: String(properties.text ?? ''),
    setText: async (text) => override('text', textArg(text)),
    clear: async () => override('text', ''),
  });
  const clickable = useHasEvent(id, 'onClick') && !busy(properties);
  return {
    properties,
    handlers: {
      onClick: () => !busy(properties) && fireEvent('onClick'),
      onMouseEnter: () => fireEvent('onHover'),
      ...(clickable
        ? { role: 'button', tabIndex: 0, onKeyDown: (e) => e.key === 'Enter' && fireEvent('onClick') }
        : {}),
    },
    clickable,
  };
};

export const ShadHeading = (props) => {
  const ref = useRef(null);
  const tagRef = useRef(null);
  useAutoHeight(props, ref);
  const { properties, handlers, clickable } = useTextActions(props);
  const level = HEADING[properties.level] ? properties.level : 'h2';
  const Tag = level;
  // A heading of fixed height shows the whole lines that fit and ends in an ellipsis (the full text on hover): a long
  // bound title wrapped past its box and covered whatever sat under it. One that grows with its content is not clamped.
  const fixed = !fitsContentInView(props.componentType, properties);
  const [lines, setLines] = useState(null);
  const text = String(properties.text ?? '');
  useLayoutEffect(() => {
    if (!fixed || !tagRef.current) return setLines(null);
    const lineHeight = parseFloat(window.getComputedStyle(tagRef.current).lineHeight);
    setLines(clampLines(props.height, lineHeight));
  }, [fixed, props.height, level, text, props.styles?.fontSize?.value]);
  const clamped = lines
    ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: lines, overflow: 'hidden' }
    : {};
  return (
    <Shell {...props} innerRef={ref}>
      <Tag
        {...handlers}
        ref={tagRef}
        title={lines ? text : undefined}
        className={cn(
          HEADING[level],
          'text-[color:var(--lk-fg,var(--sc-foreground))]',
          typeClasses(props.styles),
          clickable && 'cursor-pointer'
        )}
        style={{ textAlign: textAlign(props.styles), ...clamped }}
      >
        {String(properties.text ?? '')}
      </Tag>
    </Shell>
  );
};

const TONE = {
  paragraph: 'leading-7',
  lead: 'text-xl text-muted-foreground',
  muted: 'text-sm text-muted-foreground',
  small: 'text-sm font-medium leading-none',
  large: 'text-lg font-semibold',
};

export const ShadText = (props) => {
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const { properties, handlers, clickable } = useTextActions(props);
  return (
    <Shell {...props} innerRef={ref}>
      <p
        {...handlers}
        className={cn(
          TONE[properties.tone] || TONE.paragraph,
          'whitespace-pre-line',
          whenSet(props.styles, 'textColor', 'text-[color:var(--lk-fg)]'),
          typeClasses(props.styles),
          clickable && 'cursor-pointer'
        )}
        style={{ textAlign: textAlign(props.styles) }}
      >
        {String(properties.text ?? '')}
      </p>
    </Shell>
  );
};

// ---- Data display --------------------------------------------------------------------------------------------------

// The Table lives in ShadTable.jsx.

// The Stat's icon is drawn by the Display module, which holds the lucide icon map; it loads only for a Stat with one.
const StatIconGlyph = React.lazy(() => import('./ShadDisplay').then((m) => ({ default: m.IconGlyph })));

const StatIcon = ({ name, shape, size }) => {
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
const SPARK_W = 120;
const SPARK_H = 36;
const StatSparkline = ({ data, type, id }) => {
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

export const ShadBadge = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <Badge
        variant={properties.variant || 'default'}
        className={cn(
          whenSet(props.styles, 'backgroundColor', 'bg-[color:var(--lk-bg)]'),
          whenSet(props.styles, 'textColor', 'text-[color:var(--lk-fg)]'),
          whenSet(props.styles, 'borderColor', 'border-[color:var(--lk-border)]'),
          whenSet(props.styles, 'borderRadius', 'rounded-[var(--lk-radius)]')
        )}
      >
        {String(properties.text ?? '')}
      </Badge>
    </Shell>
  );
};

export const ShadAvatar = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const size = Math.max(16, Math.min(256, Number(properties.size) || 32));
  const people = avatarPeople(properties.names, properties.src);
  const max = Math.max(1, Math.min(50, Math.floor(Number(properties.maxVisible)) || 5));
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  // The pack's utilities are !important, so an inline width lost to the Avatar's h-8 w-8 and every avatar drew at
  // 32px. The size, the initials' font and the overlap of a group are variables the classes read, all scaled to the
  // size (a fixed 12px font and 8px overlap hid the second letter of small avatars).
  const ring = 'ring-2 ring-[color:var(--lk-ring,var(--sc-background))]';
  const box = 'h-[var(--av-size)] w-[var(--av-size)]';
  const fill =
    'bg-[color:var(--lk-bg,var(--sc-muted))] text-[color:var(--lk-fg,var(--sc-foreground))] text-[length:var(--av-font)] leading-none';
  const vars = {
    '--av-size': `${size}px`,
    '--av-font': `${Math.max(9, Math.round(size * 0.4))}px`,
    '--av-overlap': `${Math.round(size * 0.2)}px`,
  };
  return (
    <Shell {...props}>
      <div className="flex [&>*+*]:ml-[calc(var(--av-overlap)*-1)]" style={vars}>
        {shown.map((person, i) => (
          <Avatar key={`${person.name}-${i}`} className={cn(ring, box)} title={person.name}>
            {person.src ? <AvatarImage src={person.src} alt={person.name} /> : null}
            <AvatarFallback className={fill}>{initials(person.name)}</AvatarFallback>
          </Avatar>
        ))}
        {extra > 0 ? (
          <Avatar className={cn(ring, box)} title={`${extra} more`}>
            <AvatarFallback className={cn(fill, 'font-medium')}>+{extra}</AvatarFallback>
          </Avatar>
        ) : null}
      </div>
    </Shell>
  );
};

export const ShadProgress = (props) => {
  const { setExposedVariables } = props;
  const [properties, override] = useOverrides(props.properties);
  const value = Math.max(0, Math.min(100, Number(properties.value) || 0));
  useExposed(setExposedVariables, properties, {
    value,
    setValue: async (v) => override('value', Number(v) || 0),
  });
  return (
    <Shell {...props}>
      <div className="flex flex-col gap-2">
        {properties.label || properties.showValue ? (
          <div className="flex items-center justify-between text-sm">
            <span className={cn('font-medium', LABEL)}>{String(properties.label ?? '')}</span>
            {properties.showValue ? <span className={cn('tabular-nums', HELP)}>{Math.round(value)}%</span> : null}
          </div>
        ) : null}
        <Progress value={value} className="h-[var(--lk-height,0.5rem)]" />
      </div>
    </Shell>
  );
};

export const ShadSeparator = (props) => {
  const { properties, setExposedVariables, height } = props;
  useExposed(setExposedVariables, properties, {});
  const vertical = properties.orientation === 'vertical';
  return (
    <Shell {...props}>
      <div className="flex items-center justify-center" style={{ height }}>
        <Separator
          orientation={vertical ? 'vertical' : 'horizontal'}
          className={cn(
            'bg-[color:var(--lk-line,var(--sc-border))]',
            vertical ? 'w-[var(--lk-thick,1px)]' : 'h-[var(--lk-thick,1px)]'
          )}
        />
      </div>
    </Shell>
  );
};

const SKELETON = 'bg-[color:var(--lk-bg,color-mix(in_srgb,var(--sc-primary)_10%,transparent))]';

export const ShadSkeleton = (props) => {
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const lines = Math.max(1, Math.min(50, Math.floor(Number(properties.lines)) || 3));
  return (
    <Shell {...props}>
      <div className="flex items-start gap-4">
        {properties.avatar ? <Skeleton className={cn('h-12 w-12 shrink-0 rounded-full', SKELETON)} /> : null}
        <div className="flex flex-1 flex-col gap-2">
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton key={i} className={cn('h-4', SKELETON, i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full')} />
          ))}
        </div>
      </div>
    </Shell>
  );
};

const MAX_ACCORDION_ITEMS = 200;

export const ShadAccordion = (props) => {
  const { properties, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const multiple = properties.multiple === true;
  const initial = list(properties.defaultOpen).map(String);
  const [open, setOpen] = useState(initial);
  useEffect(() => setOpen(initial), [stringify(initial)]); // eslint-disable-line react-hooks/exhaustive-deps
  // An accordion of thousands of sections is a binding mistake, and drawing them all freezes the page.
  const items = list(properties.items).slice(0, MAX_ACCORDION_ITEMS);
  const openRef = useRef(open);
  openRef.current = open;
  const shape = useRef({ multiple, count: items.length });
  shape.current = { multiple, count: items.length };
  // The native Accordion's events: onExpand when a section opens, onCollapse when one closes (with onChange after).
  const apply = (next, fire = true) => {
    const prev = openRef.current;
    openRef.current = next;
    setOpen(next);
    setExposedVariables({ openIndexes: next.map(Number), isExpanded: next.length > 0 });
    if (!fire) return;
    if (next.some((i) => !prev.includes(i))) fireEvent('onExpand');
    if (prev.some((i) => !next.includes(i))) fireEvent('onCollapse');
    fireEvent('onChange');
  };
  const change = (value) => apply((Array.isArray(value) ? value : value ? [value] : []).map(String));
  // expand(index) and collapse(index) open or close one section (all of them without an index), like the native
  // Accordion's expand() and collapse(); a single-open accordion keeps one section open.
  const indexArg = (i) => {
    const n = Number(i);
    return Number.isInteger(n) && n >= 0 && n < shape.current.count ? String(n) : null;
  };
  const noIndex = (i) => i === undefined || i === null || i === '';
  useExposed(setExposedVariables, properties, {
    openIndexes: open.map(Number),
    isExpanded: open.length > 0,
    expand: async (index) => {
      const one = indexArg(index);
      if (!noIndex(index) && one === null) return;
      const all = Array.from({ length: shape.current.count }, (_, k) => String(k));
      const next = shape.current.multiple
        ? one === null
          ? all
          : [...new Set([...openRef.current, one])]
        : [one ?? all[0]].filter(Boolean);
      if (stringify(next) !== stringify(openRef.current)) apply(next);
    },
    collapse: async (index) => {
      const one = indexArg(index);
      if (!noIndex(index) && one === null) return;
      const next = one === null ? [] : openRef.current.filter((k) => k !== one);
      if (stringify(next) !== stringify(openRef.current)) apply(next);
    },
  });
  const rootProps = multiple
    ? { type: 'multiple', value: open, onValueChange: change }
    : { type: 'single', collapsible: true, value: open[0] ?? '', onValueChange: change };
  return (
    <Shell {...props} innerRef={ref}>
      <Accordion {...rootProps} className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={i} value={String(i)} className="border-[color:var(--lk-border,var(--sc-border))]">
            <AccordionTrigger className="text-[color:var(--lk-title,var(--sc-foreground))] [&>svg]:text-[color:var(--lk-icon,var(--sc-muted-foreground))]">
              {String(item?.title ?? item?.label ?? '')}
            </AccordionTrigger>
            <AccordionContent className="whitespace-pre-line text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
              {String(item?.content ?? item?.children ?? '')}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Shell>
  );
};

export const ShadEmpty = (props) => {
  const { properties, setExposedVariables, fireEvent, height } = props;
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props}>
      <div
        className="flex flex-col items-center justify-center gap-2 rounded-[var(--lk-radius,var(--sc-radius))] border border-dashed border-[color:var(--lk-border,var(--sc-border))] bg-[color:var(--lk-bg,transparent)] p-6 text-center"
        style={{ minHeight: height }}
      >
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--lk-icon-bg,var(--sc-muted))]">
          <Inbox className="h-5 w-5 text-[color:var(--lk-icon,var(--sc-muted-foreground))]" />
        </div>
        <p className="text-sm font-medium text-[color:var(--lk-title,var(--sc-foreground))]">
          {String(properties.title ?? '')}
        </p>
        {properties.description ? (
          <p className="max-w-xs text-sm text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
            {String(properties.description)}
          </p>
        ) : null}
        {properties.actionLabel ? (
          <Button size="sm" variant="outline" className="mt-2" onClick={() => fireEvent('onActionClicked')}>
            {String(properties.actionLabel)}
          </Button>
        ) : null}
      </div>
    </Shell>
  );
};

export const ShadInput = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { properties, fireEvent, id } = props;
  const [value, change] = useValue(props, String(properties.defaultValue ?? ''), (set) => ({
    setText: async (t) => set(String(t ?? '')),
    clear: async () => set(''),
  }));
  const check = useValidation(props, value, () => change('', 'onChange'));
  const box = useTextBox(props, check.touch);
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <Input
          ref={box.ref}
          id={`shad-${id}`}
          type={properties.inputType || 'text'}
          className={CONTROL}
          value={value}
          aria-invalid={!!check.error || undefined}
          aria-label={fieldName(props)}
          onFocus={box.onFocus}
          onBlur={box.onBlur}
          placeholder={String(properties.placeholder ?? '')}
          disabled={busy(properties)}
          onChange={(e) => change(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fireEvent('onEnterPressed')}
        />
      </Field>
    </Shell>
  );
};

export const ShadTextarea = (props) => {
  const { properties, id, height, fireEvent } = props;
  const [value, change] = useValue(props, String(properties.defaultValue ?? ''), (set) => ({
    setText: async (t) => set(String(t ?? '')),
    clear: async () => set(''),
  }));
  const check = useValidation(props, value, () => change('', 'onChange'));
  const box = useTextBox(props, check.touch);
  // The label, help text and message take what they draw and the text area the rest of the box. A one-line estimate
  // (22px label, 24px help) let a label or help text that wraps push the text area past the box's bottom edge.
  const estimate = (properties.label ? 22 : 0) + (properties.description || check.error ? 24 : 0);
  const [chrome, setChrome] = useState(estimate);
  const fieldRef = useRef(null);
  // When the label and help text leave the text area less than its 60px, the box grows to fit them (in view, with
  // dynamic height on); the text area itself is sized from the authored height, so the box comes back down.
  useAutoHeight(props, fieldRef);
  useLayoutEffect(() => {
    const field = fieldRef.current;
    const area = field?.querySelector('textarea');
    if (!field || !area) return undefined;
    const measure = () => {
      const next = Math.max(0, field.scrollHeight - area.offsetHeight);
      setChrome((current) => (Math.abs(current - next) < 1 ? current : next));
    };
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    [...(field.children[0]?.children ?? [])].forEach((part) => part !== area && observer?.observe(part));
    return () => observer?.disconnect();
  }, [properties.label, properties.description, check.error]);
  return (
    <Shell {...props}>
      <div ref={fieldRef}>
        <Field
          id={`shad-${id}`}
          label={properties.label}
          description={properties.description}
          error={check.error}
          required={check.required}
        >
          <Textarea
            ref={box.ref}
            id={`shad-${id}`}
            className={CONTROL}
            value={value}
            aria-invalid={!!check.error || undefined}
            aria-label={fieldName(props)}
            onFocus={box.onFocus}
            onBlur={box.onBlur}
            placeholder={String(properties.placeholder ?? '')}
            disabled={busy(properties)}
            style={{ height: Math.max(60, (Number(height) || 96) - chrome) }}
            onChange={(e) => change(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && fireEvent('onEnterPressed')}
          />
        </Field>
      </div>
    </Shell>
  );
};

const EMPTY_OPTION_KEY = '\u0000empty';

const MAX_SELECT_OPTIONS = 500;
// Radios and toggle buttons are laid out on the widget: past this many, a bound list is a mistake that froze the page.
const MAX_CHOICES = 100;

/** The options a widget draws: the first `max`, plus the selected one wherever it is (actions still reach them all). */
const shownOptions = (options, selected, max) => {
  const shown = options.slice(0, max);
  if (selected && !shown.includes(selected)) shown.push(selected);
  return shown;
};

export const ShadSelect = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { properties, setExposedVariable, setExposedVariables, fireEvent, id } = props;
  // Radix Select keys its items by string; keep the original values for the exposed value. It refuses an item keyed
  // by the empty string (that means "nothing selected"), so an option valued '' (an "All" choice) gets its own key.
  const options = toOptions(properties.options);
  const optionKey = (v) => (String(v) === '' ? EMPTY_OPTION_KEY : String(v));
  const byKey = new Map(options.map((o) => [optionKey(o.value), o]));
  const initial =
    properties.defaultValue === '' || properties.defaultValue === undefined ? '' : String(properties.defaultValue);
  const [key, setKey] = useState(initial);
  useEffect(() => setKey(initial), [initial]);
  const selectedOption = byKey.get(key) || {};
  // Radix mounts every item even while closed, so a 10k-option binding froze the page: the list shows the first
  // MAX_SELECT_OPTIONS (and the selected one, wherever it is); actions still reach every option.
  const shown = shownOptions(options, byKey.get(key), MAX_SELECT_OPTIONS);
  const triggerRef = useRef(null);
  const focus = useFocusEvents(fireEvent);
  useExposed(setExposedVariables, properties, {
    value: selectedOption.value ?? '',
    selectedOption,
    options,
    label: String(properties.label ?? ''),
    selectOption: async (v) => setKey(v === undefined || v === null || typeof v === 'object' ? '' : optionKey(v)),
    clear: async () => setKey(''),
    setFocus: async () => triggerRef.current?.focus(),
    setBlur: async () => triggerRef.current?.blur(),
  });
  const check = useValidation(props, selectedOption.value ?? '', () => {
    setKey('');
    setExposedVariable('value', '');
    setExposedVariable('selectedOption', {});
  });
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <Select
          value={key}
          disabled={busy(properties)}
          onOpenChange={(open) => {
            focus.opened(open);
            if (!open) check.touch();
          }}
          onValueChange={(next) => {
            setKey(next);
            setExposedVariable('value', byKey.get(next)?.value ?? '');
            setExposedVariable('selectedOption', byKey.get(next) || {});
            fireEvent('onSelect');
          }}
        >
          <SelectTrigger
            ref={triggerRef}
            id={`shad-${id}`}
            {...focus.handlers}
            className={cn(CONTROL, 'data-[placeholder]:text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]')}
          >
            <SelectValue placeholder={String(properties.placeholder ?? '')} />
          </SelectTrigger>
          {/* The list opens in the pack's portal root, outside the widget: it takes the widget's style variables itself. */}
          <SelectContent style={lookVars(props.componentType, props.styles)}>
            {shown.map((o) => (
              <SelectItem key={optionKey(o.value)} value={optionKey(o.value)}>
                {o.label}
              </SelectItem>
            ))}
            {options.length > shown.length ? (
              <div className={cn('px-2 py-1.5 text-xs', HELP)}>
                {`Showing ${MAX_SELECT_OPTIONS} of ${options.length} options. A Combobox searches them all.`}
              </div>
            ) : null}
          </SelectContent>
        </Select>
      </Field>
    </Shell>
  );
};

export const ShadCheckbox = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const [checked, change] = useChecked(props);
  const check = useValidation(props, checked, () => change(false));
  const id = `shad-${props.id}`;
  return (
    <Shell {...props} innerRef={fit}>
      <CheckedRow
        id={id}
        label={props.properties.label}
        description={props.properties.description}
        error={check.error}
        required={check.required}
        control={
          <Checkbox
            id={id}
            checked={checked}
            disabled={busy(props.properties)}
            onCheckedChange={(v) => {
              change(v);
              check.touch();
            }}
            aria-invalid={!!check.error || undefined}
            className="data-[state=unchecked]:border-[color:var(--lk-invalid,var(--lk-border,var(--sc-primary)))]"
          />
        }
      />
    </Shell>
  );
};

export const ShadSwitch = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const [checked, change] = useChecked(props);
  const id = `shad-${props.id}`;
  return (
    <Shell {...props} innerRef={fit}>
      <CheckedRow
        id={id}
        label={props.properties.label}
        description={props.properties.description}
        control={
          <Switch
            id={id}
            checked={checked}
            disabled={busy(props.properties)}
            onCheckedChange={change}
            className="data-[state=unchecked]:bg-[color:var(--lk-off,var(--sc-input))]"
          />
        }
      />
    </Shell>
  );
};

export const ShadRadioGroup = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { properties, id } = props;
  const options = toOptions(properties.options);
  const byKey = new Map(options.map((o) => [String(o.value), o]));
  const initial =
    properties.defaultValue === '' || properties.defaultValue === undefined ? '' : String(properties.defaultValue);
  const [key, change] = useValue(
    props,
    initial,
    (set) => ({
      selectOption: async (v) => set(v === undefined || v === null || typeof v === 'object' ? '' : String(v)),
      // The native Radio button's deselectOption() clears the choice.
      deselectOption: async () => set(''),
    }),
    (k) => byKey.get(k)?.value ?? ''
  );
  useExposed(props.setExposedVariables, properties, {
    label: String(properties.label ?? ''),
    selectedOption: byKey.get(key) || {},
    options,
  });
  const check = useValidation(props, byKey.get(key)?.value ?? '', () => change(''));
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <RadioGroup
          value={key}
          disabled={busy(properties)}
          className={properties.horizontal === true ? 'flex flex-wrap gap-4' : undefined}
          onValueChange={(next) => {
            change(next, 'onSelectionChange');
            check.touch();
          }}
        >
          {shownOptions(options, byKey.get(key), MAX_CHOICES).map((o) => {
            const itemId = `shad-${id}-${String(o.value)}`;
            return (
              <div key={String(o.value)} className="flex items-center gap-2">
                <RadioGroupItem
                  value={String(o.value)}
                  id={itemId}
                  className="border-[color:var(--lk-invalid,var(--sc-primary))]"
                />
                <Label htmlFor={itemId} className="font-normal text-[color:var(--lk-fg,var(--sc-foreground))]">
                  {o.label}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </Field>
    </Shell>
  );
};

export const ShadSlider = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { properties } = props;
  const raw = properties.defaultValue;
  const isRange = Array.isArray(raw);
  const bounds = sliderBounds(properties);
  const initial = sliderValues(raw, bounds);
  // The native Range slider's actions: setValue(n) for one value (a range's start), setRangeValue(start, end) for a
  // range, reset() back to the default. Values are kept inside min and max; a non-number changes nothing.
  const numeric = (n) =>
    (typeof n === 'number' || (typeof n === 'string' && n.trim() !== '')) && Number.isFinite(Number(n));
  const latest = useRef(null);
  const [value, change] = useValue(props, isRange ? initial : initial[0], (set) => ({
    setValue: async (n) => {
      const { bounds: b, isRange: range, value: current } = latest.current;
      if (!numeric(n)) return;
      const [v] = sliderValues(Number(n), b);
      set(range ? sliderValues([v, Math.max(v, list(current)[1] ?? v)], b) : v);
    },
    setRangeValue: async (a, z) => {
      const { bounds: b, isRange: range } = latest.current;
      if (!numeric(a) || !numeric(z)) return;
      const pair = sliderValues([Number(a), Number(z)], b);
      set(range ? pair : pair[0]);
    },
    reset: async () => {
      const { initial: start, isRange: range } = latest.current;
      set(range ? start : start[0]);
    },
  }));
  latest.current = { bounds, isRange, initial, value };
  useExposed(props.setExposedVariables, properties, { label: String(properties.label ?? '') });
  const [live, setLive] = useState(initial);
  useEffect(() => setLive(sliderValues(value, bounds)), [stringify(value), bounds.min, bounds.max]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        label={properties.label ? `${properties.label}${live.length ? `: ${live.join(' to ')}` : ''}` : ''}
        description={properties.description}
      >
        <div className="flex h-5 items-center">
          <Slider
            min={bounds.min}
            max={bounds.max}
            step={bounds.step}
            value={live}
            disabled={busy(properties)}
            thumbLabel={fieldName(props, 'Slider') ?? String(properties.label)}
            onValueChange={setLive}
            onValueCommit={(v) => change(isRange ? v : v[0])}
          />
        </div>
      </Field>
    </Shell>
  );
};

export const ShadDatePicker = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { setExposedVariables, fireEvent, id } = props;
  // setMinDate, setMaxDate and setDisabledDates change those properties until they change themselves.
  const [properties, override] = useOverrides(props.properties);
  const range = properties.mode === 'range';
  // Only text formats and valid dates: dayjs throws on a non-text format, and the calendar on an invalid date.
  const format =
    typeof properties.format === 'string' && properties.format.trim()
      ? toDayjsFormat(properties.format)
      : 'DD MMM YYYY';
  const rulesKey = stringify([
    properties.minDate ?? null,
    properties.maxDate ?? null,
    properties.disabledDates ?? null,
  ]);
  const rules = useMemo(
    () =>
      dateRules({
        minDate: properties.minDate,
        maxDate: properties.maxDate,
        disabledDates: properties.disabledDates,
        format,
      }),
    [rulesKey, format] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const raw = properties.defaultValue;
  const initial = range ? { from: toDate(list(raw)[0]), to: toDate(list(raw)[1]) } : toDate(raw);
  const [selected, setSelected] = useState(initial);
  useEffect(() => setSelected(initial), [stringify(raw ?? null), range]); // eslint-disable-line react-hooks/exhaustive-deps
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const focus = useFocusEvents(fireEvent);
  const shown = (d) => (d ? dayjs(d).format(format) : '');
  const unix = (d) => (d ? dayjs(d).valueOf() : null);
  // What the widget exposes for a selection: value, plus the native date pickers' unixTimestamp and displayValue, or a
  // range's startDate, endDate, startDateInUnix, endDateInUnix and selectedDateRange.
  const exposedOf = (sel) =>
    range
      ? {
          value: [ymd(sel?.from), ymd(sel?.to)],
          startDate: ymd(sel?.from),
          endDate: ymd(sel?.to),
          startDateInUnix: unix(sel?.from),
          endDateInUnix: unix(sel?.to),
          selectedDateRange: sel?.from ? `${shown(sel.from)}${sel.to ? ` – ${shown(sel.to)}` : ''}` : '',
        }
      : {
          value: ymd(sel),
          startDate: '',
          endDate: '',
          unixTimestamp: unix(sel),
          displayValue: shown(sel),
        };
  const commit = (next, fire = false) => {
    selectedRef.current = next;
    setSelected(next);
    setExposedVariables(exposedOf(next));
    if (fire) fireEvent('onSelect');
  };
  // A date from an action's argument, read with the format given (the native setters take one), else the display
  // format, else ISO; undefined when it is not a date.
  const latest = useRef(null);
  latest.current = { range, format };
  const parse = (v, fmt) => {
    const formats = typeof fmt === 'string' && fmt.trim() ? toDayjsFormat(fmt) : latest.current.format;
    const d = parseDateTime(v, formats);
    return d ? d.startOf('day').toDate() : undefined;
  };
  const blank = (v) => v === undefined || v === null || v === '';
  const setSingle = (v, fmt) => {
    if (latest.current.range) return;
    const d = parse(v, fmt);
    if (d || blank(v)) commit(d);
  };
  const setEnd = (end, v, fmt) => {
    if (!latest.current.range) return;
    const d = parse(v, fmt);
    if (d || blank(v)) commit({ ...(selectedRef.current || {}), [end]: d });
  };
  useExposed(setExposedVariables, properties, {
    ...exposedOf(selected),
    label: String(properties.label ?? ''),
    dateFormat: format,
    minDate: rules.min ? rules.min.format('YYYY-MM-DD') : '',
    maxDate: rules.max ? rules.max.format('YYYY-MM-DD') : '',
    clearValue: async () => commit(latest.current.range ? {} : undefined),
    setValue: async (v, fmt) => setSingle(v, fmt),
    setValueInTimestamp: async (ts) => {
      const n = Number(ts);
      if (!latest.current.range && ts !== '' && ts !== null && Number.isFinite(n)) commit(toDate(new Date(n)));
    },
    setStartDate: async (v, fmt) => setEnd('from', v, fmt),
    setEndDate: async (v, fmt) => setEnd('to', v, fmt),
    setDateRange: async (a, b, fmt) => {
      if (!latest.current.range) return;
      const from = parse(a, fmt);
      const to = parse(b, fmt);
      if ((from || blank(a)) && (to || blank(b)))
        commit(from && to && to < from ? { from: to, to: from } : { from, to });
    },
    clearStartDate: async () => latest.current.range && commit({ ...(selectedRef.current || {}), from: undefined }),
    clearEndDate: async () => latest.current.range && commit({ ...(selectedRef.current || {}), to: undefined }),
    clearDateRange: async () => latest.current.range && commit({}),
    setMinDate: async (v) => override('minDate', textArg(v)),
    setMaxDate: async (v) => override('maxDate', textArg(v)),
    setDisabledDates: async (v) => override('disabledDates', Array.isArray(v) ? v : blank(v) ? [] : [v]),
    clearDisabledDates: async () => override('disabledDates', []),
    setFocus: async () => triggerRef.current?.focus(),
    setBlur: async () => triggerRef.current?.blur(),
  });
  // A picked day outside minDate/maxDate or on a disabled date fails validation; a range counts as filled once both
  // ends are picked.
  const values = exposedOf(selected);
  const problem = range
    ? dateProblem(selected?.from ? dayjs(selected.from) : null, rules) ||
      dateProblem(selected?.to ? dayjs(selected.to) : null, rules)
    : dateProblem(selected ? dayjs(selected) : null, rules);
  const check = useValidation(
    {
      ...props,
      validate: (v) =>
        problem
          ? { isValid: false, validationError: problem }
          : typeof props.validate === 'function'
          ? props.validate(v)
          : { isValid: true },
    },
    range ? (values.startDate && values.endDate ? values.value : '') : values.value,
    () => commit(range ? {} : undefined)
  );
  const disabledMatchers = [
    ...(rules.min ? [{ before: rules.min.toDate() }] : []),
    ...(rules.max ? [{ after: rules.max.toDate() }] : []),
    ...rules.disabled.map((d) => dayjs(d).toDate()),
  ];
  const text = range
    ? selected?.from
      ? `${shown(selected.from)}${selected.to ? ` – ${shown(selected.to)}` : ''}`
      : ''
    : shown(selected);
  // Every close (Escape, a click outside, a completed pick) goes through here, so a close after a pick also marks the
  // field touched for validation and lets the focus tracking fire onBlur once focus leaves.
  const rangeClicks = useRef(0);
  const openChange = (next) => {
    if (next) rangeClicks.current = 0;
    setOpen(next);
    focus.opened(next);
    if (!next) check.touch();
  };
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <Popover open={open} onOpenChange={openChange}>
          <PopoverTrigger asChild>
            <Button
              ref={triggerRef}
              id={`shad-${id}`}
              variant="outline"
              disabled={busy(properties)}
              {...focus.handlers}
              className={cn(
                'w-full justify-start text-left font-normal',
                CONTROL,
                !text && 'text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]'
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {text || String(properties.placeholder ?? '')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start" style={lookVars(props.componentType, props.styles)}>
            <Calendar
              mode={range ? 'range' : 'single'}
              numberOfMonths={range ? 2 : 1}
              selected={selected}
              defaultMonth={(range ? selected?.from : selected) ?? (rules.min ? rules.min.toDate() : undefined)}
              startMonth={rules.min ? rules.min.toDate() : undefined}
              endMonth={rules.max ? rules.max.toDate() : undefined}
              disabled={disabledMatchers}
              onSelect={(next) => {
                commit(next, true);
                // A range's first click already sets both ends to that day: it closes on the second click.
                rangeClicks.current += 1;
                if (!range || rangeClicks.current >= 2) openChange(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </Field>
    </Shell>
  );
};

export const ShadToggleGroup = (props) => {
  // Fields fit their content (label, help text, validation message), so nothing below is overlapped.
  const fit = useRef(null);
  useAutoHeight(props, fit);
  const { properties } = props;
  const options = toOptions(properties.options);
  const byKey = new Map(options.map((o) => [String(o.value), o]));
  const initial =
    properties.defaultValue === '' || properties.defaultValue === undefined ? '' : String(properties.defaultValue);
  // The native Button group's actions: setSelected(value) picks an option (a value no option has changes nothing),
  // clear() leaves none picked.
  const keysRef = useRef(byKey);
  keysRef.current = byKey;
  const [key, change] = useValue(
    props,
    initial,
    (set) => ({
      setSelected: async (v) => {
        const k = v === undefined || v === null || typeof v === 'object' ? null : String(v);
        if (k !== null && keysRef.current.has(k)) set(k);
      },
      clear: async () => set(''),
    }),
    (k) => byKey.get(k)?.value ?? ''
  );
  return (
    <Shell {...props} innerRef={fit}>
      <ToggleGroup
        type="single"
        value={key}
        disabled={busy(properties)}
        className={cn(
          'rounded-[var(--lk-radius,var(--sc-radius))] bg-[color:var(--lk-bg,var(--sc-muted))] text-[color:var(--lk-fg,var(--sc-muted-foreground))]',
          properties.fullWidth === true && 'flex w-full'
        )}
        onValueChange={(next) => next && change(next)}
      >
        {shownOptions(options, byKey.get(key), MAX_CHOICES).map((o) => (
          <ToggleGroupItem
            key={String(o.value)}
            value={String(o.value)}
            className="rounded-[calc(var(--lk-radius,var(--sc-radius))*0.8)] data-[state=on]:bg-[color:var(--lk-on-bg,var(--sc-background))] data-[state=on]:text-[color:var(--lk-on-fg,var(--sc-foreground))]"
          >
            {o.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Shell>
  );
};
