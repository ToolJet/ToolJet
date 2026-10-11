import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as Lucide from 'lucide-react';
import useStore from '@/AppBuilder/_stores/store';
import { LoadingBox, Shell, busy, wantsSkeleton } from './Shadcn';
import { initials, useAutoHeight, useExposed } from '../packHooks';
import { Button, Skeleton, cn } from './ui';
import { resolveIcon } from './displayModel';
import { cardItems, gridColumns, heroMeta } from './sectionsModel';
import { chipTone } from '../NewTable/_utils/chipTone';
import { avatarHue } from '../NewTable/_utils/avatarHue';
import { stringify } from '../packJson';
import './shadcn.scss';

export { withControlState } from '../packHooks';

// shadcn/ui pack: page sections. Configs in WidgetManager/shadcnSource.sections.js, style variables and loading looks
// in looks/sections.js, data logic in sectionsModel.js. A section draws a designed layout from properties only, so it
// stays editable in the inspector. Colours come from the theme (shadcn tokens) and the accent style.

const ACCENT = 'var(--lk-accent,var(--sc-primary))';
// The accent as text (the eyebrow, an icon on its tint): the theme primary kept readable on the background.
const ACCENT_INK = 'var(--lk-accent,var(--sc-primary-ink))';
const TITLE_FONT = 'var(--lk-title-font,inherit)';

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

const onKeyActivate = (handler) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handler(e);
  }
};

const text = (v) => (v === null || v === undefined || typeof v === 'object' ? '' : String(v));

// ---- Hero ------------------------------------------------------------------------------------------------------------

const HERO_SIZE = {
  compact: { pad: 'px-6 py-5', title: 'text-2xl', gap: 'gap-1.5' },
  default: { pad: 'px-8 py-7', title: 'text-3xl', gap: 'gap-2' },
  large: { pad: 'px-10 py-12', title: 'text-4xl md:text-5xl', gap: 'gap-3' },
};

/** The panel behind the hero for its background style: plain draws none; tint, gradient and dark derive from the
 *  accent; image puts the URL behind a dark overlay. The panel background style overrides any of them. */
const heroPanel = (background, imageUrl) => {
  switch (background) {
    case 'plain':
      return {};
    case 'gradient':
      return {
        background: `radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, ${ACCENT} 22%, var(--sc-background)) 0%, color-mix(in srgb, ${ACCENT} 6%, var(--sc-background)) 55%, var(--sc-background) 100%)`,
        border: `1px solid color-mix(in srgb, ${ACCENT} 18%, var(--sc-border))`,
      };
    case 'dark':
      return {
        background: `linear-gradient(135deg, color-mix(in srgb, ${ACCENT} 78%, #000) 0%, color-mix(in srgb, ${ACCENT} 55%, #000) 100%)`,
      };
    case 'image':
      return imageUrl
        ? {
            backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.2) 100%), url("${String(
              imageUrl
            ).replace(/"/g, '%22')}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : { background: `linear-gradient(135deg, color-mix(in srgb, ${ACCENT} 78%, #000), #111)` };
    default:
      return {
        background: `color-mix(in srgb, ${ACCENT} 7%, var(--sc-background))`,
        border: `1px solid color-mix(in srgb, ${ACCENT} 16%, var(--sc-border))`,
      };
  }
};

export const ShadHero = (props) => {
  const { properties: p, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const background = ['plain', 'tint', 'gradient', 'image', 'dark'].includes(p.background) ? p.background : 'tint';
  const onDark = background === 'dark' || background === 'image';
  const size = HERO_SIZE[p.size] || HERO_SIZE.default;
  const center = p.align === 'center';
  const meta = useMemo(() => heroMeta(p.meta), [stringify(p.meta ?? null)]); // eslint-disable-line react-hooks/exhaustive-deps
  const Icon = text(p.icon) ? resolveIcon(p.icon, [Lucide.icons, Lucide], null) : null;
  const primary = text(p.actionLabel);
  const secondary = text(p.secondaryActionLabel);
  const fg = onDark ? '#ffffff' : 'var(--lk-title,var(--sc-foreground))';
  const muted = onDark ? 'rgba(255,255,255,0.78)' : 'var(--lk-fg,var(--sc-muted-foreground))';
  const panel = background === 'plain' ? '' : size.pad;
  const style = {
    ...heroPanel(background, p.imageUrl),
    borderRadius: background === 'plain' ? undefined : 'var(--lk-radius,calc(var(--sc-radius) + 6px))',
  };
  if (props.styles?.backgroundColor) style.background = 'var(--lk-bg)';

  const actions =
    primary || secondary ? (
      <div className={cn('flex flex-wrap gap-2', center ? 'justify-center' : 'shrink-0')}>
        {secondary ? (
          <Button
            variant="outline"
            disabled={busy(p)}
            onClick={() => fireEvent('onSecondaryActionClick')}
            className={cn(onDark && 'border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white')}
          >
            {secondary}
          </Button>
        ) : null}
        {primary ? (
          <Button
            disabled={busy(p)}
            onClick={() => fireEvent('onActionClick')}
            className={cn(
              onDark
                ? 'bg-white text-[color:var(--sc-foreground)] hover:bg-white/90'
                : 'bg-[color:var(--lk-accent,var(--sc-primary))] text-[color:var(--sc-primary-foreground)] hover:opacity-90'
            )}
          >
            {primary}
          </Button>
        ) : null}
      </div>
    ) : null;

  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (p.loadingState) {
    body = (
      <div className={cn('flex flex-col', size.gap, panel)} style={style}>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  } else {
    body = (
      <section
        className={cn('flex w-full', panel, center ? 'flex-col items-center text-center' : 'items-center gap-6')}
        style={style}
        data-background={background}
      >
        <div className={cn('flex min-w-0 flex-1', center ? 'flex-col items-center' : 'items-start gap-4')}>
          {Icon ? (
            <span
              className={cn('flex shrink-0 items-center justify-center rounded-xl', center ? 'mb-3' : 'mt-1')}
              style={{
                width: 48,
                height: 48,
                background: onDark
                  ? 'rgba(255,255,255,0.14)'
                  : `color-mix(in srgb, ${ACCENT} 14%, var(--sc-background))`,
                color: onDark ? '#ffffff' : ACCENT_INK,
              }}
              aria-hidden="true"
            >
              <Icon size={24} strokeWidth={2} />
            </span>
          ) : null}
          <div className={cn('flex min-w-0 flex-col', size.gap, center && 'items-center')}>
            {text(p.eyebrow) ? (
              <span
                className="text-xs font-semibold uppercase tracking-[0.14em]"
                style={{ color: onDark ? 'rgba(255,255,255,0.85)' : ACCENT_INK }}
              >
                {text(p.eyebrow)}
              </span>
            ) : null}
            <h1
              className={cn('m-0 font-semibold leading-tight tracking-tight', size.title)}
              style={{ color: fg, fontFamily: TITLE_FONT, textWrap: 'balance' }}
            >
              {text(p.title)}
            </h1>
            {text(p.subtitle) ? (
              <p className="m-0 max-w-[68ch] text-base leading-relaxed" style={{ color: muted }}>
                {text(p.subtitle)}
              </p>
            ) : null}
            {meta.length ? (
              <ul className={cn('m-0 mt-1 flex list-none flex-wrap gap-2 p-0', center && 'justify-center')}>
                {meta.map((fact, i) => (
                  <li
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium tabular-nums"
                    style={{
                      background: onDark
                        ? 'rgba(255,255,255,0.14)'
                        : 'color-mix(in srgb, var(--sc-foreground) 6%, transparent)',
                      color: onDark ? '#ffffff' : 'var(--sc-foreground)',
                    }}
                  >
                    {fact.label ? <span style={{ color: muted }}>{fact.label}</span> : null}
                    {fact.value}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
        {actions ? <div className={cn(center && 'mt-5')}>{actions}</div> : null}
      </section>
    );
  }
  return (
    <Shell {...props} innerRef={ref}>
      {body}
    </Shell>
  );
};

// ---- Card grid -------------------------------------------------------------------------------------------------------

const TONE_VAR = {
  success: 'var(--sc-success)',
  warning: 'var(--sc-warning)',
  danger: 'var(--sc-destructive)',
  info: 'var(--sc-primary)',
  neutral: 'var(--sc-muted-foreground)',
};

const Chip = ({ value, onImage }) => {
  const tone = TONE_VAR[chipTone(value)] || TONE_VAR.neutral;
  return (
    <span
      className="inline-flex max-w-full items-center truncate rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={
        onImage
          ? { background: 'rgba(255,255,255,0.92)', color: `color-mix(in srgb, ${tone} 80%, #000)` }
          : {
              background: `color-mix(in srgb, ${tone} 14%, transparent)`,
              color: `color-mix(in srgb, ${tone} 80%, var(--sc-foreground))`,
            }
      }
      data-tone={chipTone(value)}
    >
      {value}
    </span>
  );
};

/** The picture of a card: its image, or (none, or one that fails to load) a tinted panel with the title's initials. */
const CardImage = ({ src, title, aspect, badge }) => {
  const [failed, setFailed] = useState(false);
  const hue = avatarHue(title);
  const showImg = src && !failed;
  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: aspect }}>
      {showImg ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 70% 92%) 0%, hsl(${(hue + 40) % 360} 65% 84%) 100%)`,
          }}
          data-fallback="initials"
        >
          <span
            className="text-3xl font-semibold tracking-tight"
            style={{ color: `hsl(${hue} 45% 32%)`, fontFamily: TITLE_FONT }}
          >
            {initials(title)}
          </span>
        </div>
      )}
      {badge ? (
        <span className="absolute left-3 top-3 max-w-[80%]">
          <Chip value={badge} onImage />
        </span>
      ) : null}
    </div>
  );
};

const CARD_STYLE = {
  elevated: 'border shadow-sm hover:shadow-md hover:-translate-y-0.5',
  outline: 'border',
  flat: 'border-0',
};

export const ShadCardGrid = (props) => {
  const { properties: p, setExposedVariables, setExposedVariable, fireEvent, id } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const [width, setWidth] = useState(Number(props.width) || 0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    setWidth(el.getBoundingClientRect().width || Number(props.width) || 0);
    return () => ro.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const cards = useMemo(
    () =>
      cardItems(p.data, {
        titleField: p.titleField,
        subtitleField: p.subtitleField,
        imageField: p.imageField,
        badgeField: p.badgeField,
        descriptionField: p.descriptionField,
        metaFields: p.metaFields,
        idField: p.idField,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      stringify(p.data ?? null),
      p.titleField,
      p.subtitleField,
      p.imageField,
      p.badgeField,
      p.descriptionField,
      p.metaFields,
      p.idField,
    ]
  );
  const [selected, setSelected] = useState(null);
  useExposed(setExposedVariables, p, {
    selectedItem: selected?.row ?? {},
    selectedItemId: selected ? selected.row?.[text(p.idField) || 'id'] ?? null : null,
  });
  const hasClick = useHasEvent(id, 'onCardClick');
  const columns = gridColumns(p.columns, width || Number(props.width) || 960, p.minCardWidth);
  const aspect = ['16/9', '4/3', '1/1'].includes(p.imageAspect) ? p.imageAspect.replace('/', ' / ') : '4 / 3';
  const showImage = p.showImage !== false;
  const style = ['elevated', 'outline', 'flat'].includes(p.cardStyle) ? p.cardStyle : 'elevated';

  const click = (card) => {
    if (busy(p)) return;
    setSelected(card);
    setExposedVariable('selectedItem', card.row);
    setExposedVariable('selectedItemId', card.row?.[text(p.idField) || 'id'] ?? null);
    fireEvent('onCardClick');
  };

  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (p.loadingState) {
    body = (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border p-0">
            {showImage ? <Skeleton className="w-full rounded-none" style={{ aspectRatio: aspect }} /> : null}
            <div className="flex flex-col gap-2 p-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  } else if (!cards.length) {
    body = (
      <p className="m-0 py-10 text-center text-sm text-muted-foreground">{text(p.emptyText) || 'Nothing here yet'}</p>
    );
  } else {
    body = (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {cards.map((card) => {
          const isSelected = p.highlightSelected !== false && selected?.key === card.key;
          return (
            <div
              key={card.key}
              role="button"
              tabIndex={0}
              onClick={() => click(card)}
              onKeyDown={onKeyActivate(() => click(card))}
              className={cn(
                'group flex min-w-0 flex-col overflow-hidden text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[color:var(--lk-accent,var(--sc-ring))]',
                CARD_STYLE[style],
                (hasClick || p.highlightSelected !== false) && !busy(p) && 'cursor-pointer'
              )}
              style={{
                borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
                borderColor: isSelected ? ACCENT : 'var(--lk-border,var(--sc-border))',
                boxShadow: isSelected ? `0 0 0 2px ${ACCENT}` : undefined,
                background: style === 'flat' ? 'var(--lk-bg,var(--sc-muted))' : 'var(--lk-bg,var(--sc-card))',
              }}
              data-selected={isSelected || undefined}
            >
              {showImage ? <CardImage src={card.image} title={card.title} aspect={aspect} badge={card.badge} /> : null}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <span
                    className="line-clamp-2 min-w-0 text-base font-semibold leading-snug"
                    style={{ color: 'var(--lk-title,var(--sc-foreground))', fontFamily: TITLE_FONT }}
                  >
                    {card.title}
                  </span>
                  {!showImage && card.badge ? <Chip value={card.badge} /> : null}
                </div>
                {card.subtitle ? (
                  <span className="truncate text-sm" style={{ color: 'var(--lk-fg,var(--sc-muted-foreground))' }}>
                    {card.subtitle}
                  </span>
                ) : null}
                {card.description ? (
                  <p className="m-0 line-clamp-2 text-sm leading-relaxed text-[color:var(--sc-foreground)] opacity-80">
                    {card.description}
                  </p>
                ) : null}
                {card.meta ? (
                  <span
                    className="mt-auto pt-2 text-xs font-medium tabular-nums"
                    style={{ color: 'var(--lk-fg,var(--sc-muted-foreground))' }}
                  >
                    {card.meta}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <Shell {...props} innerRef={ref}>
      {body}
    </Shell>
  );
};
