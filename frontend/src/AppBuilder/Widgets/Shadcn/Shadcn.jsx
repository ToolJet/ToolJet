import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import { CalendarIcon, ChevronRight, Inbox, TrendingDown, TrendingUp } from 'lucide-react';
import { initials, list, toOptions, useAutoHeight, useExposed } from '../packHooks';
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
} from './ui';
import { badgeLook, isSet } from './kanbanLook';
import { toDate, ymd } from './actionsModel';
import { sliderBounds, sliderValues } from './sliderModel';
import { lookVars, whenSet } from './shadcnLook';
import { fontStack, textCase, typeClasses } from './typeLook';
import { useSizedBox } from './boxFit';
import { GROUP_LOADING } from './looks';
import { useFormClear, useShowValidationOnFormSubmit } from '@/AppBuilder/Widgets/Form/FormSignalContext';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { stringify } from '../packJson';
import { progressPercent, sparkPaths, statSize } from './statModel';
import { LoadingBox, Spinner, wantsSkeleton } from './loadingLook';
import './shadcn.scss';

export { withControlState } from '../packHooks';

// shadcn/ui pack (experiment, exp/antd-pack): native ToolJet widgets rendering shadcn/ui components. Configs live in
// WidgetManager/widgets/shadcn.js (generated from WidgetManager/shadcnSource.js).

// ---- Loading ------------------------------------------------------------------------------------------------------

// How each widget looks while loading (the loadingState property or the setLoading action). Controls stay in place,
// non-interactive, with a spinner: 'field' inside the text box (Field draws it), 'inline' right after the control,
// 'inline-top' after a multi-line control on its first line, 'wide' at the end of a control that spans the widget.
// Text and media become skeletons in their own shape ('heading', 'text', 'line', 'pill', 'avatar', 'bar',
// 'columns'); the rest a skeleton block at the widget's size ('block', the default). 'own': the widget draws its
// loading state itself (or has none to draw). Groups in their own modules add theirs in looks/<group>.js (LOADING).
const LOADING_LOOK = {
  ShadButton: 'own',
  ShadStat: 'own',
  ShadSkeleton: 'own',
  ShadSeparator: 'own',
  ShadTable: 'own',
  ShadTabs: 'own',
  ShadListView: 'own',
  ShadInput: 'field',
  ShadTextarea: 'field',
  ShadSelect: 'field',
  ShadDatePicker: 'field',
  ShadCheckbox: 'inline',
  ShadSwitch: 'inline',
  ShadRadioGroup: 'inline-top',
  ShadSlider: 'wide',
  ShadToggleGroup: 'inline',
  ShadHeading: 'heading',
  ShadText: 'text',
  ShadBreadcrumb: 'line',
  ShadBadge: 'pill',
  ShadAvatar: 'avatar',
  ShadProgress: 'bar',
  ShadKanban: 'columns',
};

/** A control is non-interactive while it is disabled or loading. */
export const busy = (properties) => !!properties.disabledState || !!properties.loadingState;

// True for the 'field' loading look (text-box controls): Field then puts the spinner inside the box.
const LoadingContext = createContext(false);

export { Spinner, LoadingBox, wantsSkeleton };

const loadingSkeleton = (look, { properties, height }) => {
  const h = Number(height) || 40;
  switch (look) {
    case 'heading':
      return <Skeleton className="h-8 w-1/2" />;
    case 'text': {
      const lines = Math.max(1, Math.min(8, Math.floor(h / 28)));
      return (
        <div className="flex flex-col gap-2 py-1">
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton key={i} className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full')} />
          ))}
        </div>
      );
    }
    case 'line':
      return <Skeleton className="h-4 w-48 max-w-full" />;
    case 'pill':
      return <Skeleton className="h-5 w-16 rounded-full" />;
    case 'avatar': {
      const size = Math.max(16, Math.min(256, Number(properties.size) || 32));
      const count = avatarPeople(properties.names).length;
      return (
        <div className="flex -space-x-2">
          {Array.from({ length: Math.max(1, Math.min(5, count)) }, (_, i) => (
            <Skeleton
              key={i}
              className="rounded-full ring-2 ring-[color:var(--sc-background)]"
              style={{ width: size, height: size }}
            />
          ))}
        </div>
      );
    }
    case 'bar':
      return (
        <div className="flex flex-col gap-2">
          {properties.label || properties.showValue ? <Skeleton className="h-4 w-1/3" /> : null}
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      );
    case 'columns':
      return (
        <div className="grid grid-cols-3 gap-3" style={{ height: h }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col gap-2 rounded-[var(--sc-radius)] bg-[color:var(--sc-muted)] p-3">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
              {i !== 2 ? <Skeleton className="h-16 w-full" /> : null}
            </div>
          ))}
        </div>
      );
    default:
      return <Skeleton className="w-full rounded-[var(--sc-radius)]" style={{ height: h }} />;
  }
};

/** The widget's root: `.tj-shadcn` scopes the pack's Tailwind and maps shadcn's tokens to the app theme; the widget's
 *  set styles arrive as CSS variables its classes read (shadcnLook.js). While loading it shows the widget's loading
 *  look (LOADING_LOOK). */
export const Shell = (props) => {
  const { properties, styles, componentType, dataCy, children, innerRef, className } = props;
  const loading = !!properties.loadingState;
  const look = LOADING_LOOK[componentType] || GROUP_LOADING[componentType] || 'block';
  let content = children;
  if (loading && ['field', 'inline', 'inline-top', 'wide'].includes(look)) {
    content = (
      <LoadingContext.Provider value={look === 'field'}>
        {look === 'field' ? (
          children
        ) : look === 'wide' ? (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">{children}</div>
            <Spinner />
          </div>
        ) : (
          <div
            className={cn(
              'inline-flex max-w-full gap-3',
              look === 'inline-top' ? 'items-start [&>[role=status]]:mt-0.5' : 'items-center'
            )}
          >
            {children}
            <Spinner />
          </div>
        )}
      </LoadingContext.Provider>
    );
  } else if (loading && look !== 'own') {
    content = wantsSkeleton(properties) ? loadingSkeleton(look, props) : <LoadingBox height={props.height} />;
  }
  return (
    <div
      ref={innerRef}
      data-cy={dataCy}
      aria-busy={loading || undefined}
      className={cn('tj-shadcn', className)}
      style={{
        width: '100%',
        display: properties.visibility === false ? 'none' : 'block',
        boxShadow: styles?.boxShadow,
        ...lookVars(componentType, styles),
      }}
    >
      {content}
    </div>
  );
};

// Label and help text colours of form controls: the labelColor and helpTextColor styles, else the theme's.
export const LABEL = 'text-[color:var(--lk-label,var(--sc-foreground))]';
export const HELP = 'text-[color:var(--lk-help,var(--sc-muted-foreground))]';
// A form control's box: the background, text, placeholder, border and radius styles, else shadcn's.
export const CONTROL =
  'bg-[color:var(--lk-bg,transparent)] text-[color:var(--lk-fg,var(--sc-foreground))] border-[color:var(--lk-invalid,var(--lk-border,var(--sc-input)))] rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))] placeholder:text-[color:var(--lk-placeholder,var(--sc-muted-foreground))]';

// A failed validation's colour: the errorColor style, else the theme's error colour.
export const ERROR = 'text-[color:var(--lk-error,var(--sc-destructive))]';
export const INVALID_VARS = { '--lk-invalid': 'var(--lk-error, var(--sc-destructive))' };

/** shadcn's form field: label above (with a mark when mandatory), control, then the validation error or the help
 *  text below. While loading, a spinner sits inside the control. An error also turns the control's border to the
 *  error colour (CONTROL reads --lk-invalid). */
export const Field = ({ id, label, description, error, required, children }) => {
  const loading = useContext(LoadingContext);
  return (
    <div className="flex w-full flex-col gap-2" style={error ? INVALID_VARS : undefined}>
      {label ? (
        <Label htmlFor={id} className={LABEL}>
          {String(label)}
          {required ? <span className={cn('ml-0.5', ERROR)}>*</span> : null}
        </Label>
      ) : null}
      {loading ? (
        <div className="relative">
          {children}
          <Spinner className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      ) : (
        children
      )}
      {error ? (
        <p role="alert" className={cn('text-[0.8rem] font-medium', ERROR)}>
          {String(error)}
        </p>
      ) : description ? (
        <p className={cn('text-[0.8rem]', HELP)}>{String(description)}</p>
      ) : null}
    </div>
  );
};

export const textAlign = (styles) =>
  ['left', 'center', 'right'].includes(styles?.textAlign) ? styles.textAlign : undefined;

// ---- Actions and feedback ------------------------------------------------------------------------------------------

export const ShadButton = (props) => {
  const { properties, styles, setExposedVariables, fireEvent } = props;
  useExposed(setExposedVariables, properties, {});
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
        disabled={!!properties.disabledState || !!properties.loadingState}
        onClick={() => fireEvent('onClick')}
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
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const all = list(properties.items);
  // A long trail keeps its first item and its last ones, with an ellipsis between (shadcn's collapsed breadcrumb), so
  // a list bound by mistake (10k items) draws a handful.
  const trail = all.length > MAX_CRUMBS ? [all[0], ELLIPSIS, ...all.slice(-(MAX_CRUMBS - 2))] : all;
  const items = trail.map((it) => (it === ELLIPSIS || typeof it === 'string' ? it : it?.title ?? ''));
  return (
    <Shell {...props}>
      <nav aria-label="breadcrumb">
        <ol className="flex flex-wrap items-center gap-1.5 break-words text-sm text-[color:var(--lk-fg,var(--sc-muted-foreground))]">
          {items.map((item, i) => (
            <li key={i} className="inline-flex items-center gap-1.5">
              <span
                className={
                  i === items.length - 1
                    ? 'font-normal text-[color:var(--lk-current,var(--sc-foreground))]'
                    : 'transition-colors'
                }
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

export const ShadHeading = (props) => {
  const { properties, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  const level = HEADING[properties.level] ? properties.level : 'h2';
  const Tag = level;
  return (
    <Shell {...props} innerRef={ref}>
      <Tag
        className={cn(HEADING[level], 'text-[color:var(--lk-fg,var(--sc-foreground))]', typeClasses(props.styles))}
        style={{ textAlign: textAlign(props.styles) }}
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
  const { properties, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  return (
    <Shell {...props} innerRef={ref}>
      <p
        className={cn(
          TONE[properties.tone] || TONE.paragraph,
          'whitespace-pre-line',
          whenSet(props.styles, 'textColor', 'text-[color:var(--lk-fg)]'),
          typeClasses(props.styles)
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
        'inline-flex shrink-0 items-center justify-center text-[color:var(--lk-icon,var(--sc-primary))]',
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
  const { properties, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, properties, {});
  const trend = properties.trend || 'neutral';
  const TrendIcon = trend === 'down' ? TrendingDown : TrendingUp;
  // The change badge takes the positive or negative colour for its trend (text, on a light tint) when set.
  const trendColor = { up: props.styles?.positiveColor, down: props.styles?.negativeColor }[trend];
  // In a fixed box (dynamic height off, or the editor) the card fills the box and its content stays inside it: a
  // footnote that wrapped past the box cut the card's bottom edge off. It keeps two lines, the rest in its title. An
  // auto-height box keeps fitting the content (the card is not stretched there, or the height could only grow).
  const fixed = !(fitsContentInView(props.componentType, properties) && props.currentMode === 'view');
  // Optional parts: an icon (a tinted tile at the right of the label, at the left of the whole figure, or on top), a
  // context line beside the change ("vs last month"), a trend line and a progress bar. Each shows only when set.
  const icon = typeof properties.icon === 'string' && properties.icon.trim() ? properties.icon.trim() : '';
  const iconPosition = ['left', 'top'].includes(properties.iconPosition) ? properties.iconPosition : 'right';
  const iconShape = ['circle', 'none'].includes(properties.iconStyle) ? properties.iconStyle : 'square';
  const size = ['sm', 'lg'].includes(properties.size) ? properties.size : 'default';
  const iconSize = size === 'lg' ? 20 : size === 'sm' ? 14 : 16;
  const iconNode = icon ? <StatIcon name={icon} shape={iconShape} size={iconSize} /> : null;
  const progress = progressPercent(properties.progress);
  const changeBadge = properties.change ? (
    <Badge
      variant="outline"
      style={isSet(trendColor) ? badgeLook('change', { change: trendColor }) : undefined}
      className={cn(
        'shrink-0 gap-1',
        isSet(trendColor) && 'border-transparent bg-[color:var(--kb-badge-bg)] text-[color:var(--kb-badge-fg)]'
      )}
    >
      {trend !== 'neutral' ? <TrendIcon className="h-3 w-3" /> : null}
      {String(properties.change)}
    </Badge>
  ) : null;
  // The badge sits in the label row unless the icon takes that corner; then it follows the figure.
  const badgeInHeader = !(icon && iconPosition === 'right');
  const changeLabel = properties.changeLabel ? (
    <span className="text-xs text-[color:var(--lk-help,var(--sc-muted-foreground))]">
      {String(properties.changeLabel)}
    </span>
  ) : null;
  const content = (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-1.5', fixed && 'min-h-0 overflow-hidden')}>
      {icon && iconPosition === 'top' ? <div className="mb-1">{iconNode}</div> : null}
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            'text-sm text-[color:var(--lk-label,var(--sc-muted-foreground))]',
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
            String(properties.value ?? '')
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
          className={cn(
            'rounded-[var(--lk-radius,calc(var(--sc-radius)+4px))] border-[color:var(--lk-border,var(--sc-border))] bg-[color:var(--lk-bg,var(--sc-card))] px-6 py-5',
            fixed && 'flex flex-col overflow-hidden'
          )}
          style={fixed && Number(props.height) > 0 ? { height: Number(props.height) } : undefined}
        >
          {body}
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

/** An avatar group's people: one name, a comma-separated list, or an array of names or { name, src }. */
export const avatarPeople = (names, src) => {
  const people = (
    Array.isArray(names)
      ? names
      : String(names ?? '')
          .split(',')
          .map((n) => n.trim())
          .filter(Boolean)
  ).flatMap((entry) => {
    if (entry !== null && typeof entry === 'object' && !Array.isArray(entry)) {
      const name = entry.name ?? entry.label ?? entry.title ?? '';
      return [{ name: String(name), src: typeof entry.src === 'string' ? entry.src : entry.image ?? '' }];
    }
    return entry === null || entry === undefined || entry === '' ? [] : [{ name: String(entry), src: '' }];
  });
  // The single-avatar image property applies when there is one person without their own photo.
  if (people.length === 1 && !people[0].src && src) people[0].src = String(src);
  return people;
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
  const { properties, setExposedVariables } = props;
  useExposed(setExposedVariables, properties, {});
  const value = Math.max(0, Math.min(100, Number(properties.value) || 0));
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
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const multiple = properties.multiple === true;
  const initial = list(properties.defaultOpen).map(String);
  const [open, setOpen] = useState(initial);
  useEffect(() => setOpen(initial), [stringify(initial)]); // eslint-disable-line react-hooks/exhaustive-deps
  useExposed(setExposedVariables, properties, { openIndexes: open.map(Number) });
  const change = (value) => {
    const next = (Array.isArray(value) ? value : value ? [value] : []).map(String);
    setOpen(next);
    setExposedVariable('openIndexes', next.map(Number));
    fireEvent('onChange');
  };
  // An accordion of thousands of sections is a binding mistake, and drawing them all freezes the page.
  const items = list(properties.items).slice(0, MAX_ACCORDION_ITEMS);
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
          <Button size="sm" variant="outline" className="mt-2" onClick={() => fireEvent('onAction')}>
            {String(properties.actionLabel)}
          </Button>
        ) : null}
      </div>
    </Shell>
  );
};

// ---- Inputs --------------------------------------------------------------------------------------------------------

/** A single-value input: local state seeded from defaultValue, published as `value` (through `toExposed`, for
 *  controls that key options by string), plus actions built from the setter. */
export const useValue = (props, initial, actions = () => ({}), toExposed = (v) => v) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [value, setValue] = useState(initial);
  const key = stringify(initial ?? null);
  useEffect(() => setValue(initial), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useExposed(setExposedVariables, properties, { value: toExposed(value) ?? '', ...actions(setValue) });
  const change = (v, event = 'onChange') => {
    setValue(v);
    setExposedVariable('value', toExposed(v) ?? '');
    fireEvent(event);
  };
  return [value, change];
};

/** Validation the native way: validate(value) (the widget's Validation section) gives isValid and the message, both
 *  exposed with isMandatory; the message shows once the user has left the control (touch) or a form around it tried to
 *  submit. A form's clearForm calls `clear`. */
export const useValidation = (props, value, clear) => {
  const { validate, validation, setExposedVariable } = props;
  const status = (typeof validate === 'function' ? validate(value) : null) || {};
  const isValid = status.isValid !== false;
  const isMandatory = validation?.mandatory === true;
  const [touched, setTouched] = useState(false);
  useShowValidationOnFormSubmit(setTouched);
  useFormClear(() => {
    clear?.();
    setTouched(false);
  });
  useEffect(() => {
    setExposedVariable('isValid', isValid);
  }, [isValid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setExposedVariable('isMandatory', isMandatory);
  }, [isMandatory]); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    error: touched && !isValid ? status.validationError || 'Invalid value' : '',
    required: isMandatory,
    touch: () => setTouched(true),
    untouch: () => setTouched(false),
  };
};

/** Text box events and actions shared by Input and Textarea: focus and blur (events and actions), and blur marks
 *  the field touched for validation. */
export const useTextBox = (props, touch) => {
  const { fireEvent, setExposedVariables } = props;
  const ref = useRef(null);
  useEffect(() => {
    setExposedVariables({
      setFocus: async () => ref.current?.focus(),
      setBlur: async () => ref.current?.blur(),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    ref,
    onFocus: () => setTimeout(() => fireEvent('onFocus'), 0),
    onBlur: () => {
      touch();
      fireEvent('onBlur');
    },
  };
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
  const { properties, id, height } = props;
  const [value, change] = useValue(props, String(properties.defaultValue ?? ''), (set) => ({
    setText: async (t) => set(String(t ?? '')),
    clear: async () => set(''),
  }));
  const check = useValidation(props, value, () => change('', 'onChange'));
  const box = useTextBox(props, check.touch);
  const chrome = (properties.label ? 22 : 0) + (properties.description || check.error ? 24 : 0);
  return (
    <Shell {...props}>
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
          onFocus={box.onFocus}
          onBlur={box.onBlur}
          placeholder={String(properties.placeholder ?? '')}
          disabled={busy(properties)}
          style={{ height: Math.max(60, (Number(height) || 96) - chrome) }}
          onChange={(e) => change(e.target.value)}
        />
      </Field>
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
  useExposed(setExposedVariables, properties, {
    value: selectedOption.value ?? '',
    selectedOption,
    selectOption: async (v) => setKey(v === undefined || v === null ? '' : optionKey(v)),
    clear: async () => setKey(''),
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
          onOpenChange={(open) => !open && check.touch()}
          onValueChange={(next) => {
            setKey(next);
            setExposedVariable('value', byKey.get(next)?.value ?? '');
            setExposedVariable('selectedOption', byKey.get(next) || {});
            fireEvent('onChange');
          }}
        >
          <SelectTrigger
            id={`shad-${id}`}
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

export const useChecked = (props) => {
  const { properties, setExposedVariable, setExposedVariables, fireEvent } = props;
  const [checked, setChecked] = useState(!!properties.defaultChecked);
  useEffect(() => setChecked(!!properties.defaultChecked), [properties.defaultChecked]);
  useExposed(setExposedVariables, properties, { value: checked });
  const change = (v) => {
    setChecked(v === true);
    setExposedVariable('value', v === true);
    fireEvent('onChange');
    if (props.componentType === 'ShadCheckbox') fireEvent(v === true ? 'onCheck' : 'onUnCheck');
  };
  return [checked, change];
};

export const CheckedRow = ({ id, control, label, description, error, required }) => (
  <div className="flex items-start gap-3" style={error ? INVALID_VARS : undefined}>
    {control}
    <div className="grid gap-1.5 leading-none">
      <Label htmlFor={id} className={LABEL}>
        {String(label ?? '')}
        {required ? <span className={cn('ml-0.5', ERROR)}>*</span> : null}
      </Label>
      {error ? (
        <p role="alert" className={cn('text-sm font-medium', ERROR)}>
          {String(error)}
        </p>
      ) : description ? (
        <p className={cn('text-sm', HELP)}>{String(description)}</p>
      ) : null}
    </div>
  </div>
);

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
    (set) => ({ selectOption: async (v) => set(v === undefined || v === null ? '' : String(v)) }),
    (k) => byKey.get(k)?.value ?? ''
  );
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
            change(next);
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
  const [value, change] = useValue(props, isRange ? initial : initial[0]);
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
  const { properties, setExposedVariable, setExposedVariables, fireEvent, id } = props;
  const range = properties.mode === 'range';
  // Only text formats and valid dates: dayjs throws on a non-text format, and the calendar on an invalid date.
  const format = typeof properties.format === 'string' && properties.format.trim() ? properties.format : 'DD MMM YYYY';
  const raw = properties.defaultValue;
  const initial = range ? { from: toDate(list(raw)[0]), to: toDate(list(raw)[1]) } : toDate(raw);
  const [selected, setSelected] = useState(initial);
  useEffect(() => setSelected(initial), [stringify(raw ?? null), range]); // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = useState(false);
  const values = range
    ? { value: [ymd(selected?.from), ymd(selected?.to)], startDate: ymd(selected?.from), endDate: ymd(selected?.to) }
    : { value: ymd(selected), startDate: '', endDate: '' };
  useExposed(setExposedVariables, properties, { ...values, clear: async () => setSelected(range ? {} : undefined) });
  // A range counts as filled once both ends are picked.
  const check = useValidation(
    props,
    range ? (values.startDate && values.endDate ? values.value : '') : values.value,
    () => {
      setSelected(range ? {} : undefined);
      setExposedVariables(
        range ? { value: ['', ''], startDate: '', endDate: '' } : { value: '', startDate: '', endDate: '' }
      );
    }
  );
  const text = range
    ? selected?.from
      ? `${dayjs(selected.from).format(format)}${selected.to ? ` – ${dayjs(selected.to).format(format)}` : ''}`
      : ''
    : selected
    ? dayjs(selected).format(format)
    : '';
  return (
    <Shell {...props} innerRef={fit}>
      <Field
        id={`shad-${id}`}
        label={properties.label}
        description={properties.description}
        error={check.error}
        required={check.required}
      >
        <Popover
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) check.touch();
          }}
        >
          <PopoverTrigger asChild>
            <Button
              id={`shad-${id}`}
              variant="outline"
              disabled={busy(properties)}
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
              defaultMonth={range ? selected?.from : selected}
              onSelect={(next) => {
                setSelected(next);
                if (range) {
                  setExposedVariable('value', [ymd(next?.from), ymd(next?.to)]);
                  setExposedVariable('startDate', ymd(next?.from));
                  setExposedVariable('endDate', ymd(next?.to));
                  if (next?.from && next?.to) setOpen(false);
                } else {
                  setExposedVariable('value', ymd(next));
                  setOpen(false);
                }
                fireEvent('onChange');
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
  const [key, change] = useValue(props, initial, undefined, (k) => byKey.get(k)?.value ?? '');
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
