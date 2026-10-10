import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as Lucide from 'lucide-react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import useStore from '@/AppBuilder/_stores/store';
import { Shell, Spinner, busy } from './Shadcn';
import { initials, useAutoHeight, useExposed } from '../packHooks';
import { Button, Skeleton, cn, getPortalRoot } from './ui';
import { isSet } from './kanbanLook';
import {
  clamp,
  clampPage,
  colorFor,
  formatTime,
  formatValue,
  keyValueItems,
  linkHref,
  normalizeSteps,
  pageCountOf,
  pageItems,
  resolveIcon,
  ringGeometry,
  statusColor,
  stepIndexOf,
  timelineItems,
  toTags,
} from './displayModel';
import './shadcn.scss';

export { withControlState } from '../packHooks';

// shadcn/ui pack (experiment): display widgets. Configs in WidgetManager/shadcnSource.display.js, style variables and
// loading looks in looks/display.js, data logic in displayModel.js. Colours come from the theme (shadcn tokens) and
// each is overridable by a style through a CSS variable.

const {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  CircleDashed,
  Copy,
  ExternalLink,
  ImageIcon,
  ImageOff,
  MoreHorizontal,
  X,
} = Lucide;
const ICON_MAPS = [Lucide.icons, Lucide];
const NEUTRAL_ICON = CircleDashed || Circle;
const iconFor = (name, fallback = NEUTRAL_ICON) => resolveIcon(name, ICON_MAPS, fallback);

/** A map entry for a property value, never an inherited key (a "constructor" from junk data). */
const own = (map, key) =>
  typeof key === 'string' && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : undefined;
const JUSTIFY = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };
const justify = (styles, fallback = 'left') => own(JUSTIFY, styles?.alignment) || JUSTIFY[fallback];

/** Whether the app wires `eventId` on this widget (a pointer cursor then shows it is clickable). */
const useHasEvent = (id, eventId) =>
  useStore((state) => {
    const modules = state?.eventsSlice?.module;
    if (!modules || !id) return false;
    return Object.values(modules).some((m) =>
      (Array.isArray(m?.events) ? m.events : []).some(
        (e) => e?.sourceId === id && e?.event?.eventId === eventId && !e?.event?.disabled
      )
    );
  });

/** Enter or Space activates a div acting as a button. */
const onKeyActivate = (handler) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handler(e);
  }
};

// ---- Image -----------------------------------------------------------------------------------------------------------

const FIT = new Set(['cover', 'contain', 'fill']);
const ratioOf = (value) => {
  if (!isSet(value) || value === 'auto') return null;
  const [w, h] = String(value)
    .split(/[/:x]/)
    .map((n) => Number(n));
  if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) return `${w} / ${h}`;
  const single = Number(value);
  return Number.isFinite(single) && single > 0 ? String(single) : null;
};

const ImageFallback = ({ kind, text }) => {
  const name = String(text ?? '').trim();
  const fg = 'text-[color:var(--lk-fg,var(--sc-muted-foreground))]';
  if (kind === 'initials' && initials(name)) {
    return (
      <span className={cn('select-none text-2xl font-semibold tracking-wide', fg)} aria-label={name}>
        {initials(name)}
      </span>
    );
  }
  if (kind === 'icon' || kind === 'initials') return <ImageOff className={cn('h-8 w-8', fg)} aria-label="No image" />;
  return (
    <span className={cn('flex flex-col items-center gap-2 px-3 text-center', fg)}>
      <ImageIcon className="h-7 w-7" aria-hidden="true" />
      <span className="text-xs">{name || 'No image'}</span>
    </span>
  );
};

export const ShadImage = (props) => {
  const { properties: p, setExposedVariables, fireEvent, height, id } = props;
  const ref = useRef(null);
  const imgRef = useRef(null);
  // With a ratio the image sizes itself from the width and the widget fits it; "auto" fills the drawn height instead.
  const ratio = ratioOf(p.aspectRatio);
  useAutoHeight({ ...props, properties: { ...p, dynamicHeight: ratio ? p.dynamicHeight : false } }, ref);
  const src = String(p.source ?? p.src ?? '').trim();
  const alt = String(p.alternativeText ?? p.alt ?? '');
  const [status, setStatus] = useState(src ? 'loading' : 'error');
  const [open, setOpen] = useState(false);
  useEffect(() => setStatus(src ? 'loading' : 'error'), [src]);
  // A cached image can finish before React listens for its load event.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setStatus('loaded');
  }, [src]);
  useExposed(setExposedVariables, p, { hasError: status === 'error' });
  const hasClick = useHasEvent(id, 'onClick');
  const zoom = p.zoomOnClick === true && status === 'loaded';
  const clickable = !busy(p) && (hasClick || zoom);
  const caption = isSet(p.caption) ? String(p.caption) : '';
  const fit = FIT.has(p.imageFit ?? p.fit) ? p.imageFit ?? p.fit : 'cover';
  const frameHeight = Math.max(24, (Number(height) || 200) - (caption ? 28 : 0));
  const click = () => {
    if (busy(p)) return;
    fireEvent('onClick');
    if (zoom) setOpen(true);
  };
  return (
    <Shell {...props} innerRef={ref}>
      <figure className="m-0 flex w-full flex-col">
        <div
          role={clickable ? 'button' : undefined}
          tabIndex={clickable ? 0 : undefined}
          aria-label={clickable ? alt || 'Image' : undefined}
          onClick={click}
          onKeyDown={clickable ? onKeyActivate(click) : undefined}
          className={cn(
            'relative flex w-full items-center justify-center overflow-hidden rounded-[var(--lk-radius,var(--sc-radius))] bg-[color:var(--lk-bg,transparent)]',
            p.showBorder === true && 'border border-[color:var(--lk-border,var(--sc-border))]',
            status === 'error' && 'bg-[color:var(--lk-bg,var(--sc-muted))]',
            clickable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            zoom && 'cursor-zoom-in'
          )}
          style={ratio ? { aspectRatio: ratio } : { height: frameHeight }}
        >
          {status !== 'error' ? (
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              draggable={false}
              onLoad={() => setStatus('loaded')}
              onError={() => setStatus('error')}
              className={cn(
                'block h-full w-full transition-opacity duration-300',
                status === 'loaded' ? 'opacity-100' : 'opacity-0'
              )}
              style={{ objectFit: fit }}
            />
          ) : (
            <ImageFallback kind={p.fallback} text={isSet(p.fallbackText) ? p.fallbackText : alt} />
          )}
          {status === 'loading' ? <Skeleton className="absolute inset-0 rounded-none" /> : null}
        </div>
        {caption ? (
          <figcaption className="mt-2 truncate text-center text-sm leading-5 text-[color:var(--lk-caption,var(--sc-muted-foreground))]">
            {caption}
          </figcaption>
        ) : null}
      </figure>
      {p.zoomOnClick === true ? (
        <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
          <DialogPrimitive.Portal container={getPortalRoot()}>
            <DialogPrimitive.Overlay className="fixed inset-0 z-[1300] bg-black/80" />
            <DialogPrimitive.Content
              aria-describedby={undefined}
              className="fixed left-1/2 top-1/2 z-[1300] -translate-x-1/2 -translate-y-1/2 outline-none"
            >
              <DialogPrimitive.Title className="sr-only">{alt || 'Image'}</DialogPrimitive.Title>
              <img
                src={src}
                alt={alt}
                className="block max-h-[90vh] max-w-[90vw] rounded-lg object-contain shadow-lg"
                draggable={false}
              />
              <DialogPrimitive.Close
                aria-label="Close"
                className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border bg-background text-foreground shadow-md transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
      ) : null}
    </Shell>
  );
};

// ---- Icon ------------------------------------------------------------------------------------------------------------

const TONE_COLOR = {
  default: 'var(--sc-foreground)',
  muted: 'var(--sc-muted-foreground)',
  primary: 'var(--sc-primary)',
  success: 'var(--sc-success)',
  warning: 'var(--sc-warning)',
  destructive: 'var(--sc-destructive)',
};

export const ShadIcon = (props) => {
  const { properties: p, setExposedVariables, fireEvent, height, id } = props;
  useExposed(setExposedVariables, p, {});
  const hasClick = useHasEvent(id, 'onClick');
  const Icon = iconFor(p.icon);
  const size = clamp(p.size, 8, 512, 20);
  const stroke = clamp(p.strokeWidth, 0.5, 4, 2);
  const chip = p.chip === 'circle' || p.chip === 'square' ? p.chip : 'none';
  const chipSize = chip === 'none' ? size : clamp(p.chipSize, size, 1024, Math.round(size * 2));
  const clickable = hasClick && !busy(p);
  const click = () => !busy(p) && fireEvent('onClick');
  const shape = chip === 'circle' ? 'rounded-full' : 'rounded-[var(--lk-radius,var(--sc-radius))]';
  return (
    <Shell {...props}>
      <div
        className={cn('flex items-center', justify(props.styles))}
        style={{ minHeight: Math.min(height || 0, 2000) }}
      >
        {p.loadingState ? (
          <Skeleton
            className={cn('shrink-0', chip === 'none' ? 'rounded-md' : shape)}
            style={{ width: chipSize, height: chipSize }}
          />
        ) : (
          <span
            role={clickable ? 'button' : 'img'}
            aria-label={typeof p.icon === 'string' && p.icon ? p.icon : 'icon'}
            tabIndex={clickable ? 0 : undefined}
            onClick={click}
            onKeyDown={clickable ? onKeyActivate(click) : undefined}
            className={cn(
              'inline-flex shrink-0 items-center justify-center text-[color:var(--lk-icon,var(--ic-tone))]',
              chip !== 'none' &&
                cn(shape, 'bg-[color:var(--lk-chip,color-mix(in_srgb,var(--lk-icon,var(--ic-tone))_12%,transparent))]'),
              clickable &&
                'cursor-pointer transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              p.disabledState && 'opacity-50'
            )}
            style={{ width: chipSize, height: chipSize, '--ic-tone': own(TONE_COLOR, p.tone) || TONE_COLOR.default }}
          >
            <Icon size={size} strokeWidth={stroke} aria-hidden="true" />
          </span>
        )}
      </div>
    </Shell>
  );
};

// ---- Link ------------------------------------------------------------------------------------------------------------

const UNDERLINE = { always: 'underline', hover: 'on-hover', none: 'no-underline', never: 'no-underline' };
const WEIGHT = { normal: 'font-normal', medium: 'font-medium', semibold: 'font-semibold', bold: 'font-bold' };

export const ShadLink = (props) => {
  const { properties: p, setExposedVariables, fireEvent, height } = props;
  useExposed(setExposedVariables, p, {});
  const href = String(p.linkTarget ?? p.href ?? '').trim();
  const sameTab = p.targetType === 'same' || p.target === '_self' || p.target === 'same';
  const underline = own(UNDERLINE, p.underline) || (typeof p.underline === 'string' && p.underline) || 'on-hover';
  const disabled = busy(p);
  const className = cn(
    'inline-flex max-w-full items-center gap-1 rounded-sm text-[color:var(--lk-fg,var(--sc-primary))] underline-offset-4 transition-colors hover:text-[color:var(--lk-hover,var(--lk-fg,var(--sc-primary)))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    underline === 'underline' && 'underline',
    underline === 'on-hover' && 'no-underline hover:underline',
    underline === 'no-underline' && 'no-underline hover:no-underline',
    own(WEIGHT, p.fontWeight) || WEIGHT.medium,
    disabled && 'pointer-events-none opacity-50'
  );
  const style = { fontSize: clamp(p.fontSize, 8, 96, 14), lineHeight: 1.4 };
  const content = (
    <>
      <span className="truncate">{String(p.linkText ?? p.text ?? '')}</span>
      {p.showIcon === true ? <ExternalLink className="shrink-0" style={{ width: '0.85em', height: '0.85em' }} /> : null}
    </>
  );
  const onHover = () => fireEvent('onHover');
  return (
    <Shell {...props}>
      <div
        className={cn('flex items-center', justify(props.styles))}
        style={{ minHeight: Math.min(height || 0, 2000) }}
      >
        {href ? (
          <a
            href={href}
            target={sameTab ? '_self' : '_blank'}
            rel={sameTab ? undefined : 'noopener noreferrer'}
            aria-disabled={disabled || undefined}
            tabIndex={disabled ? -1 : undefined}
            className={className}
            style={style}
            onMouseEnter={onHover}
            onClick={(e) => {
              if (disabled) {
                e.preventDefault();
                return;
              }
              fireEvent('onClick');
            }}
          >
            {content}
          </a>
        ) : (
          <button
            type="button"
            disabled={disabled}
            className={cn(className, 'cursor-pointer bg-transparent p-0')}
            style={style}
            onMouseEnter={onHover}
            onClick={() => fireEvent('onClick')}
          >
            {content}
          </button>
        )}
      </div>
    </Shell>
  );
};

// ---- Tags ------------------------------------------------------------------------------------------------------------

const TAG_SIZE = {
  sm: 'h-5 px-1.5 text-[11px]',
  default: 'h-6 px-2 text-xs',
  lg: 'h-7 px-2.5 text-sm',
};
const TAG_GAP = 6;

const tagClasses = (variant, mapped) => {
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
const useFit = (enabled, tags, rowRef, measureRef) => {
  const [fit, setFit] = useState(tags.length);
  const key = tags.join('\u0000');
  useLayoutEffect(() => {
    if (!enabled) return undefined;
    const measure = () => {
      const row = rowRef.current;
      const probe = measureRef.current;
      if (!row || !probe) return;
      const available = row.clientWidth;
      const chips = Array.from(probe.children);
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

export const ShadTags = (props) => {
  const { properties: p, setExposedVariables, setExposedVariable, fireEvent, id } = props;
  const ref = useRef(null);
  const rowRef = useRef(null);
  const measureRef = useRef(null);
  useAutoHeight(props, ref);
  const tags = useMemo(() => toTags(p.tags), [JSON.stringify(p.tags ?? null)]); // eslint-disable-line react-hooks/exhaustive-deps
  const [last, setLast] = useState('');
  useExposed(setExposedVariables, p, { lastClickedTag: last, tags });
  const hasClick = useHasEvent(id, 'onTagClick');
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
  const chip = (tag, i, interactive) => {
    const colour = colorFor(tag, p.tagColors);
    const className = cn(
      base,
      tagClasses(variant, !!colour),
      interactive && hasClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default disabled:opacity-50'
    );
    const style = colour ? { '--tg': colour } : undefined;
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
          fireEvent('onTagClick');
        }}
      >
        {tag}
      </button>
    );
  };
  const hidden = tags.length - shown;
  let body;
  if (p.loadingState) {
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

// ---- Circular progress -----------------------------------------------------------------------------------------------

export const ShadCircularProgress = (props) => {
  const { properties: p, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, p, {});
  const g = ringGeometry(p.value, p.size, p.thickness);
  const mode = ['value', 'custom', 'none'].includes(p.centerText) ? p.centerText : 'value';
  const centre = mode === 'value' ? `${Math.round(g.percent)}%` : mode === 'custom' ? String(p.text ?? '') : '';
  const label = isSet(p.label) ? String(p.label) : '';
  const centreSize = Math.max(10, Math.round(g.size * 0.22));
  const labelSize = Math.max(9, Math.min(14, Math.round(g.size * 0.11)));
  const c = g.size / 2;
  return (
    <Shell {...props} innerRef={ref}>
      <div className={cn('flex', justify(props.styles, 'center'))}>
        {p.loadingState ? (
          <Skeleton className="rounded-full" style={{ width: g.size, height: g.size }} />
        ) : (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(g.percent)}
            aria-label={label || 'Progress'}
            className="relative shrink-0"
            style={{ width: g.size, height: g.size }}
          >
            <svg width={g.size} height={g.size} viewBox={`0 0 ${g.size} ${g.size}`} className="-rotate-90">
              <circle
                cx={c}
                cy={c}
                r={g.radius}
                fill="none"
                strokeWidth={g.thickness}
                className="stroke-[color:var(--lk-track,color-mix(in_srgb,var(--sc-primary)_15%,transparent))]"
              />
              {g.percent > 0 ? (
                <circle
                  cx={c}
                  cy={c}
                  r={g.radius}
                  fill="none"
                  strokeWidth={g.thickness}
                  strokeLinecap={p.lineCap === 'flat' ? 'butt' : 'round'}
                  strokeDasharray={g.circumference}
                  strokeDashoffset={g.offset}
                  className="stroke-[color:var(--sc-primary)] transition-[stroke-dashoffset] duration-500 ease-out"
                />
              ) : null}
            </svg>
            {centre || label ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center leading-tight">
                {centre ? (
                  <span
                    className="max-w-full truncate font-semibold tabular-nums tracking-tight text-[color:var(--lk-fg,var(--sc-foreground))]"
                    style={{ fontSize: centreSize }}
                  >
                    {centre}
                  </span>
                ) : null}
                {label ? (
                  <span
                    className="max-w-full truncate text-[color:var(--lk-label,var(--sc-muted-foreground))]"
                    style={{ fontSize: labelSize }}
                  >
                    {label}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </Shell>
  );
};

// ---- Spinner ---------------------------------------------------------------------------------------------------------

const SPINNER_SIZE = { sm: 16, default: 24, lg: 32 };

export const ShadSpinner = (props) => {
  const { properties: p, setExposedVariables } = props;
  useExposed(setExposedVariables, p, {});
  const size = own(SPINNER_SIZE, p.size) ?? clamp(p.size, 8, 200, 24);
  const label = isSet(p.label) ? String(p.label) : '';
  const below = p.labelPosition === 'bottom';
  const stroke = Math.max(2, Math.round(size / 10));
  const r = (size - stroke) / 2;
  const indicator =
    p.variant === 'dots' ? (
      <span className="inline-flex shrink-0 items-center" style={{ height: size, gap: Math.max(2, size / 8) }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-bounce rounded-full bg-[color:var(--sc-primary)]"
            style={{ width: size / 4, height: size / 4, animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    ) : (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="shrink-0 animate-spin"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-[color:var(--lk-track,color-mix(in_srgb,var(--sc-primary)_18%,transparent))]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${Math.PI * r * 0.5} ${Math.PI * r * 2}`}
          className="stroke-[color:var(--sc-primary)]"
        />
      </svg>
    );
  return (
    <Shell {...props}>
      <div className={cn('flex', justify(props.styles))}>
        <div
          role="status"
          aria-label={label || 'Loading'}
          className={cn('inline-flex items-center', below ? 'flex-col gap-2' : 'flex-row gap-2')}
        >
          {indicator}
          {label ? (
            <span className="text-sm text-[color:var(--lk-label,var(--sc-muted-foreground))]">{label}</span>
          ) : null}
        </div>
      </div>
    </Shell>
  );
};

// ---- Key-value list --------------------------------------------------------------------------------------------------

const cssSize = (value, fallback) => {
  if (!isSet(value)) return fallback;
  const text = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(text)) return `${Math.min(Number(text), 2000)}px`;
  if (/^\d+(\.\d+)?(px|%|rem|em|ch)$/.test(text)) return text;
  return fallback;
};

const CopyButton = ({ text }) => {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const t = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(t);
  }, [copied]);
  return (
    <button
      type="button"
      aria-label="Copy value"
      className="ml-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-accent hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
      onClick={() => {
        try {
          navigator.clipboard?.writeText(text);
        } catch {
          // Clipboard access can be refused; nothing to do.
        }
        setCopied(true);
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
};

const KeyValueValue = ({ row, text, emptyText, badgeColors }) => {
  const empty = <span className="text-[color:var(--sc-muted-foreground)]">{emptyText}</span>;
  if (row.type === 'boolean') {
    if (row.value === undefined || row.value === null || row.value === '') return empty;
    const yes = text === 'Yes';
    return (
      <span className="inline-flex items-center gap-1.5">
        {yes ? (
          <Check className="h-4 w-4 text-[color:var(--sc-success)]" aria-hidden="true" />
        ) : (
          <X className="h-4 w-4 text-[color:var(--sc-muted-foreground)]" aria-hidden="true" />
        )}
        {text}
      </span>
    );
  }
  if (!text) return empty;
  if (row.type === 'badge') {
    const colour = colorFor(text, badgeColors) ?? (isSet(row.color) ? String(row.color) : undefined);
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium',
          colour
            ? 'border-transparent bg-[color:color-mix(in_srgb,var(--tg)_14%,transparent)] text-[color:var(--tg)]'
            : 'border-transparent bg-secondary text-secondary-foreground'
        )}
        style={colour ? { '--tg': colour } : undefined}
      >
        {text}
      </span>
    );
  }
  if (row.type === 'link') {
    const href = linkHref(row);
    const shown = isSet(row.linkText) ? String(row.linkText) : text;
    if (!href) return <span className="break-words">{shown}</span>;
    const external = /^https?:/i.test(href);
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="break-all font-medium text-[color:var(--lk-link,var(--sc-primary))] no-underline underline-offset-4 hover:underline"
      >
        {shown}
      </a>
    );
  }
  return (
    <span className={cn('break-words', (row.type === 'number' || row.type === 'currency') && 'tabular-nums')}>
      {text}
    </span>
  );
};

export const ShadKeyValue = (props) => {
  const { properties: p, setExposedVariables } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  useExposed(setExposedVariables, p, {});
  const rows = useMemo(() => keyValueItems(p.data), [JSON.stringify(p.data ?? null)]); // eslint-disable-line react-hooks/exhaustive-deps
  const columns = Math.floor(clamp(p.columns, 1, 4, 1));
  const inline = p.layout !== 'stacked';
  const dividers = p.dividers !== false;
  const emptyText = p.emptyText === undefined || p.emptyText === null ? '—' : String(p.emptyText);
  const labelWidth = cssSize(p.labelWidth, '40%');
  const defaults = { currency: p.currency || 'USD', locale: p.locale || 'en-US', dateFormat: p.dateFormat };
  const lastRowStart = rows.length - (rows.length % columns || columns);
  let body;
  if (p.loadingState) {
    body = (
      <div className="flex flex-col">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={cn('flex gap-4 py-2.5', inline ? 'flex-row items-center' : 'flex-col gap-1.5')}>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-40 max-w-full" />
          </div>
        ))}
      </div>
    );
  } else if (!rows.length) {
    body = <p className="py-4 text-center text-sm text-muted-foreground">No details</p>;
  } else {
    body = (
      <dl className="m-0 grid gap-x-8" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {rows.map((row, index) => {
          const text = formatValue(row, defaults);
          return (
            <div
              key={row.key}
              className={cn(
                'group flex min-w-0 text-sm',
                inline ? 'flex-row items-start gap-4 py-2.5' : 'flex-col gap-1 py-3',
                dividers && index < lastRowStart && 'border-b border-[color:var(--lk-border,var(--sc-border))]'
              )}
            >
              <dt
                className="m-0 min-w-0 break-words font-normal text-[color:var(--lk-label,var(--sc-muted-foreground))]"
                style={inline ? { width: labelWidth, flexShrink: 0 } : undefined}
              >
                {row.label}
              </dt>
              <dd className="m-0 flex min-w-0 flex-1 items-start font-medium text-[color:var(--lk-fg,var(--sc-foreground))]">
                <KeyValueValue row={row} text={text} emptyText={emptyText} badgeColors={p.badgeColors} />
                {p.allowCopy === true && text ? <CopyButton text={text} /> : null}
              </dd>
            </div>
          );
        })}
      </dl>
    );
  }
  return (
    <Shell {...props} innerRef={ref}>
      {body}
    </Shell>
  );
};

// ---- Timeline --------------------------------------------------------------------------------------------------------

const LINE_HEIGHT = 20; // the title's line, which the marker centres on

export const ShadTimeline = (props) => {
  const { properties: p, setExposedVariables, setExposedVariable, fireEvent, id } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const items = useMemo(
    () => timelineItems(p.items, p.newestFirst === true),
    [JSON.stringify(p.items ?? null), p.newestFirst] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [last, setLast] = useState({});
  useExposed(setExposedVariables, p, { lastClickedItem: last });
  const hasClick = useHasEvent(id, 'onItemClick');
  const compact = p.density === 'compact';
  const icons = p.marker === 'icon';
  const marker = icons ? (compact ? 24 : 28) : compact ? 8 : 10;
  const markerTop = Math.max(0, (LINE_HEIGHT - marker) / 2);
  const contentTop = Math.max(0, (marker - LINE_HEIGHT) / 2);
  const column = Math.max(marker, 12);
  const click = (item) => {
    if (busy(p)) return;
    const { key, ...rest } = item; // eslint-disable-line no-unused-vars
    setLast(rest);
    setExposedVariable('lastClickedItem', rest);
    fireEvent('onItemClick');
  };
  let body;
  if (p.loadingState) {
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
          const markerVars = { '--tl-c': colour || 'var(--lk-marker,var(--sc-primary))' };
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

// ---- Steps -----------------------------------------------------------------------------------------------------------

const stepState = (index, current) => (index < current ? 'done' : index === current ? 'current' : 'upcoming');
const STEP_LABEL = {
  done: 'text-[color:var(--lk-done-label,var(--sc-foreground))]',
  current: 'text-[color:var(--lk-current-label,var(--sc-foreground))]',
  upcoming: 'text-[color:var(--lk-idle-label,var(--sc-muted-foreground))]',
};
const IDLE = 'var(--lk-idle,var(--sc-border))';

const StepMarker = ({ state, number, dots }) => {
  if (dots) {
    return (
      <span
        className={cn(
          'block h-3 w-3 shrink-0 rounded-full',
          state === 'upcoming' ? 'bg-[color:var(--lk-idle,var(--sc-border))]' : 'bg-primary',
          state === 'current' && 'ring-4 ring-[color:color-mix(in_srgb,var(--sc-primary)_18%,transparent)]'
        )}
      />
    );
  }
  return (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium tabular-nums transition-colors',
        state === 'done' && 'border-primary bg-primary text-primary-foreground',
        state === 'current' &&
          'border-primary bg-background text-primary ring-4 ring-[color:color-mix(in_srgb,var(--sc-primary)_15%,transparent)]',
        state === 'upcoming' &&
          'border-[color:var(--lk-idle,var(--sc-border))] bg-background text-[color:var(--lk-idle-label,var(--sc-muted-foreground))]'
      )}
    >
      {state === 'done' ? <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" /> : number}
    </span>
  );
};

export const ShadSteps = (props) => {
  const { properties: p, setExposedVariables, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const source = p.steps ?? p.schema;
  const base = useMemo(() => normalizeSteps(source), [JSON.stringify(source ?? null)]); // eslint-disable-line react-hooks/exhaustive-deps
  const [overrides, setOverrides] = useState({});
  useEffect(() => setOverrides({}), [base]);
  const all = base.map((s) => ({ ...s, ...(overrides[String(s.id)] || {}) }));
  const shown = all.filter((s) => s.visible);
  const [current, setCurrent] = useState(p.currentStep);
  useEffect(() => setCurrent(p.currentStep), [p.currentStep]);
  const index = stepIndexOf(shown, current);
  const live = useRef({});
  live.current = { all, shown, index, properties: p };
  const exposedSteps = all.map(({ id, name, description, visible, disabled }) => ({
    id,
    name,
    description,
    visible,
    disabled,
  }));
  const moveTo = (id) => {
    setCurrent(id);
    const i = stepIndexOf(live.current.shown, id);
    setExposedVariables({ currentStepId: id, currentStepIndex: i });
  };
  const override = (id, patch) =>
    setOverrides((prev) => ({ ...prev, [String(id)]: { ...(prev[String(id)] || {}), ...patch } }));
  useExposed(setExposedVariables, p, {
    currentStepId: current ?? null,
    currentStepIndex: index,
    steps: exposedSteps,
    setStep: async (id) => {
      if (live.current.properties.disabledState) return;
      const i = stepIndexOf(live.current.all, id);
      if (i !== -1) moveTo(live.current.all[i].id);
    },
    nextStep: async () => {
      const { shown: s, index: i } = live.current;
      if (s[i + 1]) moveTo(s[i + 1].id);
    },
    previousStep: async () => {
      const { shown: s, index: i } = live.current;
      if (i > 0 && s[i - 1]) moveTo(s[i - 1].id);
    },
    resetSteps: async () => {
      const first = live.current.shown[0];
      if (first) moveTo(first.id);
    },
    setStepVisible: async (id, visibility) => override(id, { visible: visibility !== false && visibility !== 'false' }),
    setStepDisable: async (id, disabled) => override(id, { disabled: disabled !== false && disabled !== 'false' }),
  });
  const selectable = p.stepsSelectable !== false;
  const select = (step) => {
    if (!selectable || busy(p) || step.disabled) return;
    moveTo(step.id);
    fireEvent('onSelect');
  };
  const vertical = p.orientation === 'vertical';
  const dots = p.variant === 'dots';
  const markerSize = dots ? 12 : 32;
  if (p.loadingState) {
    const n = Math.max(2, Math.min(6, shown.length || 4));
    return (
      <Shell {...props} innerRef={ref}>
        <div className={cn('flex', vertical ? 'flex-col gap-6' : 'flex-row items-start gap-4')}>
          {Array.from({ length: n }, (_, i) => (
            <div
              key={i}
              className={cn('flex flex-1 gap-2', vertical ? 'flex-row items-center' : 'flex-col items-center')}
            >
              <Skeleton className="shrink-0 rounded-full" style={{ width: markerSize, height: markerSize }} />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </Shell>
    );
  }
  const stepButton = (step, i, state, children, className) => {
    const interactive = selectable && !step.disabled && !p.disabledState;
    return (
      <button
        type="button"
        title={step.tooltip || undefined}
        aria-current={state === 'current' ? 'step' : undefined}
        disabled={!interactive || !!p.loadingState}
        onClick={() => select(step)}
        className={cn(
          'group flex bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default',
          interactive && 'cursor-pointer',
          step.disabled && 'opacity-50',
          'rounded-md',
          className
        )}
      >
        {children}
      </button>
    );
  };
  return (
    <Shell {...props} innerRef={ref}>
      {!shown.length ? (
        <p className="py-2 text-sm text-muted-foreground">No steps</p>
      ) : vertical ? (
        <ol className="m-0 flex list-none flex-col p-0" aria-label="Steps">
          {shown.map((step, i) => {
            const state = stepState(i, index);
            const isLast = i === shown.length - 1;
            return (
              <li key={String(step.id)} className={cn('relative', !isLast && 'pb-6')}>
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className="absolute w-0.5 rounded-full"
                    style={{
                      left: markerSize / 2 - 1,
                      top: markerSize + 4,
                      bottom: 4,
                      background: i < index ? 'var(--sc-primary)' : IDLE,
                    }}
                  />
                ) : null}
                {stepButton(
                  step,
                  i,
                  state,
                  <>
                    <StepMarker state={state} number={i + 1} dots={dots} />
                    <span className="flex min-w-0 flex-col" style={{ paddingTop: dots ? 0 : 6 }}>
                      <span
                        className={cn(
                          'text-sm leading-5',
                          state === 'upcoming' ? 'font-medium' : 'font-semibold',
                          STEP_LABEL[state]
                        )}
                        style={dots ? { marginTop: -4 } : undefined}
                      >
                        {step.name}
                      </span>
                      {step.description ? (
                        <span className="text-xs text-[color:var(--lk-help,var(--sc-muted-foreground))]">
                          {step.description}
                        </span>
                      ) : null}
                    </span>
                  </>,
                  'w-full items-start gap-3'
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <ol className="m-0 flex w-full list-none items-start p-0" aria-label="Steps">
          {shown.map((step, i) => {
            const state = stepState(i, index);
            const isLast = i === shown.length - 1;
            return (
              <li key={String(step.id)} className="relative flex min-w-0 flex-1 flex-col items-center">
                {!isLast ? (
                  <span
                    aria-hidden="true"
                    className="absolute h-0.5 rounded-full"
                    style={{
                      top: markerSize / 2 - 1,
                      left: `calc(50% + ${markerSize / 2 + 8}px)`,
                      right: `calc(-50% + ${markerSize / 2 + 8}px)`,
                      background: i < index ? 'var(--sc-primary)' : IDLE,
                    }}
                  />
                ) : null}
                {stepButton(
                  step,
                  i,
                  state,
                  <>
                    <StepMarker state={state} number={i + 1} dots={dots} />
                    <span
                      className={cn(
                        'mt-2 block max-w-full truncate text-sm leading-5',
                        state === 'upcoming' ? 'font-medium' : 'font-semibold',
                        STEP_LABEL[state]
                      )}
                    >
                      {step.name}
                    </span>
                    {step.description ? (
                      <span className="line-clamp-2 block max-w-full text-xs text-[color:var(--lk-help,var(--sc-muted-foreground))]">
                        {step.description}
                      </span>
                    ) : null}
                  </>,
                  'max-w-full flex-col items-center px-1 text-center'
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Shell>
  );
};

// ---- Pagination ------------------------------------------------------------------------------------------------------

const PAGE_RADIUS = 'rounded-[var(--lk-radius,calc(var(--sc-radius)-2px))]';
const PAGE_IDLE =
  'border border-transparent text-[color:var(--lk-fg,var(--sc-foreground))] hover:bg-[color:var(--lk-hover,var(--sc-accent))] hover:text-[color:var(--lk-fg,var(--sc-accent-foreground))]';
const PAGE_ACTIVE =
  'border border-[color:var(--lk-on-border,var(--sc-input))] bg-[color:var(--lk-on-bg,var(--sc-background))] text-[color:var(--lk-on-fg,var(--sc-foreground))] shadow-sm hover:bg-[color:var(--lk-on-bg,var(--sc-accent))]';

export const ShadPagination = (props) => {
  const { properties: p, setExposedVariables, setExposedVariable, fireEvent } = props;
  const count = pageCountOf(p);
  const [page, setPage] = useState(() => clampPage(p.defaultPageIndex, count));
  const live = useRef({});
  live.current = { page, count };
  const go = (target) => {
    const { page: now, count: total } = live.current;
    const next = clampPage(target, total, now);
    if (next === now) return;
    setPage(next);
    live.current.page = next;
    setExposedVariable('currentPageIndex', next);
    fireEvent('onPageChange');
  };
  // A changed default page moves the pager (and fires onPageChange), as the native Pagination does.
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    go(clampPage(p.defaultPageIndex, count));
  }, [p.defaultPageIndex]); // eslint-disable-line react-hooks/exhaustive-deps
  // Fewer pages than the current one: stay on the last page.
  useEffect(() => {
    if (page > count) {
      setPage(count);
      setExposedVariable('currentPageIndex', count);
    }
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps
  const shownPage = Math.min(page, count);
  useExposed(setExposedVariables, p, {
    totalPages: count,
    currentPageIndex: shownPage,
    setPage: async (n) => go(n),
  });
  const disabled = busy(p);
  const small = p.size === 'sm';
  const square = small ? 'h-8 min-w-8 px-2 text-xs' : 'h-9 min-w-9 px-2.5 text-sm';
  const labelled = p.showLabels !== false;
  const button = (key, { label, onClick, active, isDisabled, children, wide }) => (
    <li key={key}>
      <Button
        type="button"
        variant="ghost"
        aria-label={label}
        aria-current={active ? 'page' : undefined}
        disabled={disabled || isDisabled}
        onClick={onClick}
        className={cn(
          PAGE_RADIUS,
          square,
          'tabular-nums shadow-none',
          active ? PAGE_ACTIVE : PAGE_IDLE,
          wide && (small ? 'gap-1 px-2.5' : 'gap-1 px-3')
        )}
      >
        {children}
      </Button>
    </li>
  );
  const items = pageItems(shownPage, count, p.siblingCount ?? 1);
  return (
    <Shell {...props}>
      <nav
        role="navigation"
        aria-label="pagination"
        className={cn('flex w-full items-center gap-3', justify(props.styles))}
      >
        <ul className="m-0 flex list-none flex-row flex-wrap items-center gap-1 p-0">
          {p.showFirstLast === true
            ? button('first', {
                label: 'Go to first page',
                onClick: () => go(1),
                isDisabled: shownPage <= 1,
                children: <ChevronsLeft className="h-4 w-4" />,
              })
            : null}
          {button('prev', {
            label: 'Go to previous page',
            onClick: () => go(shownPage - 1),
            isDisabled: shownPage <= 1,
            wide: labelled,
            children: (
              <>
                <ChevronLeft className="h-4 w-4" />
                {labelled ? <span>Previous</span> : null}
              </>
            ),
          })}
          {items.map((item) =>
            typeof item === 'string' ? (
              <li key={item} aria-hidden="true">
                <span
                  className={cn(
                    'flex items-center justify-center text-[color:var(--lk-fg,var(--sc-muted-foreground))]',
                    small ? 'h-8 w-8' : 'h-9 w-9'
                  )}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              </li>
            ) : (
              button(`page-${item}`, {
                label: `Page ${item}`,
                onClick: () => go(item),
                active: item === shownPage,
                children: item,
              })
            )
          )}
          {button('next', {
            label: 'Go to next page',
            onClick: () => go(shownPage + 1),
            isDisabled: shownPage >= count,
            wide: labelled,
            children: (
              <>
                {labelled ? <span>Next</span> : null}
                <ChevronRight className="h-4 w-4" />
              </>
            ),
          })}
          {p.showFirstLast === true
            ? button('last', {
                label: 'Go to last page',
                onClick: () => go(count),
                isDisabled: shownPage >= count,
                children: <ChevronsRight className="h-4 w-4" />,
              })
            : null}
        </ul>
        {p.loadingState ? <Spinner /> : null}
      </nav>
    </Shell>
  );
};
