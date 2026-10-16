import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as Lucide from 'lucide-react';
import useStore from '@/AppBuilder/_stores/store';
import { LoadingBox, Shell, busy, wantsSkeleton } from './Shadcn';
import { initials, useAutoHeight, useExposed } from '../packHooks';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { Button, Skeleton, cn } from './ui';
import { resolveIcon } from './displayModel';
import {
  barWidth,
  cardItems,
  gridColumns,
  heroAside,
  heroMeta,
  percentLabel,
  progressItems,
  recordItems,
  stripColumns,
  summaryFigures,
} from './sectionsModel';
import { chipLabel, chipTone } from '../NewTable/_utils/chipTone';
import { avatarHue } from '../NewTable/_utils/avatarHue';
import { stringify } from '../packJson';
import './shadcn.scss';

export { withControlState } from '../packHooks';

// shadcn/ui pack: page sections (a hero, a card grid, a record list, a progress list and a summary strip). Configs in WidgetManager/widgets/shad*.js, style variables and loading looks
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

const ASIDE_FIGURE = { compact: 'text-2xl', large: 'text-4xl' };
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
        '--hero-border': `color-mix(in srgb, ${ACCENT} 18%, var(--sc-border))`,
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
        : {
            background: `linear-gradient(135deg, color-mix(in srgb, ${ACCENT} 78%, #000), #111)`,
          };
    default:
      return {
        background: `color-mix(in srgb, ${ACCENT} 7%, var(--sc-background))`,
        '--hero-border': `color-mix(in srgb, ${ACCENT} 16%, var(--sc-border))`,
      };
  }
};

export const ShadHero = (props) => {
  const { properties: p, fireEvent } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  // The viewer grows the box to the content and moves the widgets below it (dynamic height). In a fixed box (the
  // editor, which draws every widget at its saved size, or dynamic height turned off) the panel stops at the box and its
  // content scrolls inside it: a 236px hero in a 200px box drew over a task board's column headers (Daymark,
  // 2026-10-15), and cut off at the box it lost its bottom edge mid-button.
  const fixed = !(fitsContentInView(props.componentType ?? 'ShadHero', p) && props.currentMode === 'view');
  const background = ['plain', 'tint', 'gradient', 'image', 'dark'].includes(p.background) ? p.background : 'tint';
  const onDark = background === 'dark' || background === 'image';
  const size = HERO_SIZE[p.size] || HERO_SIZE.default;
  const center = p.align === 'center';
  const meta = useMemo(() => heroMeta(p.meta), [stringify(p.meta ?? null)]); // eslint-disable-line react-hooks/exhaustive-deps
  const aside = useMemo(() => heroAside(p.asideValue, p.asideLabel), [stringify(p.asideValue ?? null), p.asideLabel]); // eslint-disable-line react-hooks/exhaustive-deps
  const Icon = text(p.icon) ? resolveIcon(p.icon, [Lucide.icons, Lucide], null) : null;
  const primary = text(p.actionLabel);
  const secondary = text(p.secondaryActionLabel);
  const fg = onDark ? '#ffffff' : 'var(--lk-title,var(--sc-foreground))';
  const muted = onDark ? 'rgba(255,255,255,0.78)' : 'var(--lk-fg,var(--sc-muted-foreground))';
  const style = {
    ...heroPanel(background, p.imageUrl),
    borderRadius: background === 'plain' ? undefined : 'var(--lk-radius,calc(var(--sc-radius) + 6px))',
  };
  if (props.styles?.backgroundColor) style.background = 'var(--lk-bg)';
  // The tint and gradient panels' hairline: the pack's border reset beats an inline border, so it never drew.
  const panel = cn(
    background !== 'plain' && size.pad,
    style['--hero-border'] && 'border border-[color:var(--hero-border)]'
  );

  const actions =
    primary || secondary ? (
      <div className={cn('flex min-w-0 max-w-full flex-wrap gap-2', center && 'justify-center')}>
        {secondary ? (
          <Button
            variant="outline"
            disabled={busy(p)}
            onClick={() => fireEvent('onSecondaryActionClicked')}
            className={cn(onDark && 'border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white')}
          >
            {secondary}
          </Button>
        ) : null}
        {primary ? (
          <Button
            disabled={busy(p)}
            onClick={() => fireEvent('onActionClicked')}
            className={cn(
              onDark
                ? // A fixed dark ink: the theme foreground is near-white in a dark app, which drew a blank white button.
                  'bg-white text-[#0f172a] hover:bg-white/90'
                : 'bg-[color:var(--lk-accent,var(--sc-primary))] text-[color:var(--sc-primary-foreground)] hover:opacity-90'
            )}
          >
            {primary}
          </Button>
        ) : null}
      </div>
    ) : null;

  // The aside: a headline figure with its caption above, or a short list of facts, right of the text behind a
  // hairline (under it when centred, or when the hero is narrow: shadcn.scss).
  const grid = !!aside && !center;
  const asideBlock = aside ? (
    <div
      className={cn(
        'sc-hero-aside flex shrink-0 flex-col gap-1',
        center ? 'mt-5 items-center' : 'min-w-[150px] items-end border-l pl-6 text-right'
      )}
      style={{
        borderColor: onDark ? 'rgba(255,255,255,0.22)' : 'var(--lk-border,var(--sc-border))',
      }}
      data-aside={aside.kind}
    >
      {aside.label ? (
        <span className="text-xs font-medium uppercase tracking-[0.08em]" style={{ color: muted }}>
          {aside.label}
        </span>
      ) : null}
      {aside.kind === 'figure' ? (
        <span
          className={cn('font-semibold leading-none tracking-tight tabular-nums', ASIDE_FIGURE[p.size] || 'text-3xl')}
          style={{ color: fg, fontFamily: TITLE_FONT }}
        >
          {aside.value}
        </span>
      ) : (
        <dl className="m-0 flex flex-col gap-1.5" style={{ minWidth: 170 }}>
          {aside.facts.map((fact, i) => (
            <div key={i} className="flex items-baseline justify-between gap-6 text-sm">
              <dt className="m-0" style={{ color: muted }}>
                {fact.label || ''}
              </dt>
              <dd className="m-0 font-semibold tabular-nums" style={{ color: fg }}>
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
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
      <div className={cn('sc-hero-box', fixed && 'h-full')}>
        <section
          className={cn(
            'sc-hero w-full',
            panel,
            fixed && 'max-h-full overflow-y-auto',
            // With an aside, a grid: text and actions on the left, the aside right of both; in a narrow hero, text,
            // aside, actions (shadcn.scss).
            grid
              ? 'sc-hero-grid'
              : cn('flex', center ? 'flex-col items-center text-center' : 'flex-wrap items-center gap-x-6 gap-y-4')
          )}
          style={style}
          data-background={background}
        >
          <div
            className={cn(
              'sc-hero-text flex min-w-0',
              center ? 'flex-col items-center' : 'flex-[1_1_20rem] items-start gap-4'
            )}
          >
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
                  style={{
                    color: onDark ? 'rgba(255,255,255,0.85)' : ACCENT_INK,
                  }}
                >
                  {text(p.eyebrow)}
                </span>
              ) : null}
              <h1
                className={cn('m-0 font-semibold leading-tight tracking-tight', size.title)}
                style={{
                  color: fg,
                  fontFamily: TITLE_FONT,
                  textWrap: 'balance',
                }}
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
          {asideBlock}
          {actions ? (
            <div className={cn('min-w-0 max-w-full', grid ? 'sc-hero-actions' : center && 'mt-5')}>{actions}</div>
          ) : null}
        </section>
      </div>
    );
  }
  return (
    <Shell {...props} innerRef={ref} className={cn(fixed && 'h-full overflow-y-auto')}>
      {body}
    </Shell>
  );
};

// ---- Card grid -------------------------------------------------------------------------------------------------------

const TONE_VAR = {
  success: 'var(--sc-success)',
  warning: 'var(--sc-warning)',
  danger: 'var(--sc-destructive)',
  // A fixed blue, as charts and the map use: in the brand colour, Booked and In progress read as Completed under a green
  // theme and as Pending under an orange one (pet salon, helpdesk, 2026-10-14).
  info: 'var(--sc-chart-info)',
  neutral: 'var(--sc-muted-foreground)',
};

// A tone as text: deep enough to read on the background.
const TONE_INK = Object.fromEntries(
  Object.entries(TONE_VAR).map(([k, v]) => [k, `color-mix(in srgb, ${v} 80%, var(--sc-foreground))`])
);

/** A status chip toned by its words, or by `toneName` where the widget already knows the tone (a progress row). */
const Chip = ({ value, onImage, toneName }) => {
  const toneKey = toneName || chipTone(value);
  const tone = TONE_VAR[toneKey] || TONE_VAR.neutral;
  return (
    // A block box, so a chip too long for its room ends in an ellipsis (a flex box clips its text without one); the
    // full text is its tooltip.
    <span
      className="inline-block max-w-full truncate whitespace-nowrap rounded-full px-2.5 py-0.5 align-middle text-xs font-semibold"
      title={String(value)}
      style={
        onImage
          ? {
              background: 'rgba(255,255,255,0.92)',
              color: `color-mix(in srgb, ${tone} 80%, #000)`,
            }
          : {
              background: `color-mix(in srgb, ${tone} 14%, transparent)`,
              color: `color-mix(in srgb, ${tone} 80%, var(--sc-foreground))`,
            }
      }
      data-tone={toneKey}
    >
      {chipLabel(value)}
    </span>
  );
};

/** The picture of a card: its image, or (none, or one that fails to load) a tinted panel with the title's initials.
 *  Its badges sit over its top left corner. `fill` makes it a side panel as tall as the card (the row layout). */
const CardImage = ({ src, title, aspect, badges = [], fill = false }) => {
  const [failed, setFailed] = useState(false);
  const hue = avatarHue(title);
  const showImg = src && !failed;
  return (
    <div
      className={cn(
        'relative overflow-hidden',
        fill ? 'w-[38%] min-w-[96px] max-w-[200px] shrink-0 self-stretch' : 'w-full'
      )}
      style={fill ? { minHeight: 120 } : { aspectRatio: aspect }}
      data-image-layout={fill ? 'side' : 'top'}
    >
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
      {badges.length ? (
        <span className="absolute left-3 top-3 flex max-w-[80%] flex-wrap gap-1">
          {badges.map((badge, i) => (
            <Chip key={i} value={badge} onImage />
          ))}
        </span>
      ) : null}
    </div>
  );
};

/** A slim progress bar in the accent (or a tone), as wide as its box. */
const Bar = ({ pct, tone, height = 6, label }) => (
  <div
    role="progressbar"
    aria-label={label || undefined}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(barWidth(pct))}
    className="relative w-full min-w-0 overflow-hidden rounded-full"
    style={{
      height,
      background: 'var(--lk-track,color-mix(in srgb, var(--sc-foreground) 9%, transparent))',
    }}
  >
    <div
      className="h-full rounded-full transition-[width] duration-500 ease-out"
      style={{
        width: `${barWidth(pct)}%`,
        background: tone ? TONE_VAR[tone] || ACCENT : ACCENT,
      }}
    />
  </div>
);

/** A bar with its percentage after it, for a card or a record row. */
const InlineProgress = ({ pct, className }) => (
  <div className={cn('flex min-w-0 items-center gap-2', className)} data-progress={Math.round(barWidth(pct))}>
    <Bar pct={pct} height={6} />
    <span
      className="shrink-0 text-xs font-medium tabular-nums"
      style={{
        color: 'var(--lk-fg,var(--sc-muted-foreground))',
        // Room for "100.0%", so every bar in a list is the same length: at 2.5rem a "10.2%" row's bar came out shorter
        // than its neighbours' (nonprofit programmes, 2026-10-14).
        minWidth: '3rem',
        textAlign: 'right',
      }}
    >
      {percentLabel(pct)}
    </span>
  </div>
);

const CARD_STYLE = {
  elevated: 'border shadow-sm hover:shadow-md hover:-translate-y-0.5',
  outline: 'border',
  flat: 'border-0',
};

const CARDS_PER_STEP = 48;

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
        badgeFields: p.badgeFields,
        eyebrowField: p.eyebrowField,
        avatarField: p.avatarField,
        descriptionField: p.descriptionField,
        progressField: p.progressField,
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
      stringify(p.badgeFields ?? null),
      p.eyebrowField,
      p.avatarField,
      p.descriptionField,
      p.progressField,
      p.metaFields,
      p.idField,
    ]
  );
  // A grid draws its first CARDS_PER_STEP cards and a button for the next ones: a 10,000-row binding drew every card
  // (over 100,000 elements) and froze the page. A new data binding starts again from the first step.
  const [shownCount, setShownCount] = useState(CARDS_PER_STEP);
  useEffect(() => setShownCount(CARDS_PER_STEP), [cards]);
  const [selected, setSelected] = useState(null);
  useExposed(setExposedVariables, p, {
    selectedItem: selected?.row ?? {},
    selectedItemId: selected ? selected.row?.[text(p.idField) || 'id'] ?? null : null,
  });
  const hasClick = useHasEvent(id, 'onCardClicked');
  const columns = gridColumns(p.columns, width || Number(props.width) || 960, p.minCardWidth);
  const aspect = ['16/9', '4/3', '1/1'].includes(p.imageAspect) ? p.imageAspect.replace('/', ' / ') : '4 / 3';
  // The picture area only when an image field is mapped: without one every card got a large initials panel, which
  // took most of the card on menus, tickets and figures that have no picture.
  const showImage = p.showImage !== false && typeof p.imageField === 'string' && p.imageField.trim() !== '';
  const style = ['elevated', 'outline', 'flat'].includes(p.cardStyle) ? p.cardStyle : 'elevated';
  const row = p.layout === 'row';

  const click = (card) => {
    if (busy(p)) return;
    setSelected(card);
    setExposedVariable('selectedItem', card.row);
    setExposedVariable('selectedItemId', card.row?.[text(p.idField) || 'id'] ?? null);
    fireEvent('onCardClicked');
  };

  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (p.loadingState) {
    body = (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className={cn('flex gap-3 rounded-xl border p-0', row ? 'flex-row' : 'flex-col')}>
            {showImage ? (
              <Skeleton
                className={cn('rounded-none', row ? 'w-[38%] max-w-[200px]' : 'w-full')}
                style={row ? { minHeight: 120 } : { aspectRatio: aspect }}
              />
            ) : null}
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
        {cards.slice(0, shownCount).map((card) => {
          const isSelected = p.highlightSelected !== false && selected?.key === card.key;
          // With a picture on top, the badges sit on it; otherwise one badge goes beside the title and several in a
          // row under it.
          const badgesOnImage = showImage && !row;
          const badgeBeside = !badgesOnImage && card.badges.length === 1;
          const badgeRow = !badgesOnImage && card.badges.length > 1;
          return (
            <div
              key={card.key}
              role="button"
              tabIndex={0}
              onClick={() => click(card)}
              onKeyDown={onKeyActivate(() => click(card))}
              data-layout={row ? 'row' : 'stacked'}
              className={cn(
                'group flex min-w-0 overflow-hidden text-left outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[color:var(--lk-accent,var(--sc-ring))]',
                row ? 'flex-row' : 'flex-col',
                CARD_STYLE[style],
                // The pack's border reset beats an inline border colour, so Card border color and the selected card's
                // accent edge never showed; the colour goes through a variable the border class reads.
                'border-[color:var(--cg-border)]',
                (hasClick || p.highlightSelected !== false) && !busy(p) && 'cursor-pointer'
              )}
              style={{
                borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
                '--cg-border': isSelected ? ACCENT : 'var(--lk-border,var(--sc-border))',
                boxShadow: isSelected ? `0 0 0 2px ${ACCENT}` : undefined,
                background: style === 'flat' ? 'var(--lk-bg,var(--sc-muted))' : 'var(--lk-bg,var(--sc-card))',
              }}
              data-selected={isSelected || undefined}
            >
              {showImage ? (
                <CardImage
                  src={card.image}
                  title={card.title}
                  aspect={aspect}
                  badges={badgesOnImage ? card.badges : []}
                  fill={row}
                />
              ) : null}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
                {card.eyebrow ? (
                  <span
                    className="truncate text-[11px] font-semibold uppercase tracking-[0.12em]"
                    style={{ color: ACCENT_INK }}
                    data-part="eyebrow"
                  >
                    {card.eyebrow}
                  </span>
                ) : null}
                <div className="flex min-w-0 items-start gap-3">
                  {card.avatar ? <RecordAvatar src={card.avatar.image} name={card.avatar.name} size={36} /> : null}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {/* The title takes 60% of the row; a badge wider than the room left wraps under it, and one wider
                        than the card ends in an ellipsis. A long badge beside the title ("-$19,305.50 vs last week")
                        was cut off. */}
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-2 gap-y-1.5">
                      <span
                        className="line-clamp-2 min-w-0 flex-[1_1_60%] text-base font-semibold leading-snug"
                        style={{
                          color: 'var(--lk-title,var(--sc-foreground))',
                          fontFamily: TITLE_FONT,
                        }}
                      >
                        {card.title}
                      </span>
                      {badgeBeside ? (
                        <span className="flex min-w-0 max-w-full">
                          <Chip value={card.badges[0]} />
                        </span>
                      ) : null}
                    </div>
                    {card.subtitle ? (
                      <span
                        className="truncate text-sm"
                        style={{
                          color: 'var(--lk-fg,var(--sc-muted-foreground))',
                        }}
                      >
                        {card.subtitle}
                      </span>
                    ) : null}
                  </div>
                </div>
                {badgeRow ? (
                  <span className="flex min-w-0 flex-wrap gap-1.5">
                    {card.badges.map((badge, i) => (
                      <Chip key={i} value={badge} />
                    ))}
                  </span>
                ) : null}
                {card.description ? (
                  <p className="m-0 line-clamp-2 text-sm leading-relaxed text-[color:var(--sc-foreground)] opacity-80">
                    {card.description}
                  </p>
                ) : null}
                {card.progress !== null ? <InlineProgress pct={card.progress} className="mt-auto pt-2" /> : null}
                {card.meta ? (
                  <span
                    className={cn(
                      'pt-2 text-xs font-medium tabular-nums',
                      card.progress === null ? 'mt-auto' : 'pt-0.5'
                    )}
                    style={{ color: 'var(--lk-fg,var(--sc-muted-foreground))' }}
                  >
                    {card.meta}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
        {cards.length > shownCount ? (
          <div className="col-span-full flex justify-center pt-1">
            <button
              type="button"
              onClick={() => setShownCount((n) => n + CARDS_PER_STEP)}
              className="rounded-md border border-[color:var(--lk-border,var(--sc-border))] px-3 py-1.5 text-sm text-[color:var(--sc-muted-foreground)] transition-colors hover:bg-[color:var(--sc-muted)] hover:text-[color:var(--sc-foreground)]"
            >
              {`Show ${Math.min(CARDS_PER_STEP, cards.length - shownCount)} more of ${cards.length - shownCount}`}
            </button>
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

// ---- Record list -----------------------------------------------------------------------------------------------------

const ROWS_PER_STEP = 100;

const DENSITY = {
  compact: { pad: 'py-2', avatar: 28, title: 'text-sm', meta: 'text-xs' },
  default: { pad: 'py-3', avatar: 36, title: 'text-sm', meta: 'text-xs' },
  comfortable: { pad: 'py-4', avatar: 40, title: 'text-base', meta: 'text-sm' },
};

/** A row's avatar: its image, or (none, or one that fails to load) the initials on a tint of the name's hue. */
const RecordAvatar = ({ src, name, size, shape }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const hue = avatarHue(name);
  const radius = shape === 'rounded' ? 'rounded-lg' : 'rounded-full';
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn('shrink-0 object-cover', radius)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn('tj-record-avatar flex shrink-0 items-center justify-center font-semibold', radius)}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `color-mix(in srgb, hsl(${hue} 70% 55%) 16%, var(--sc-background))`,
        // Mixed toward the foreground: a deeper ink on a light theme, a lighter one on a dark theme.
        color: `color-mix(in srgb, hsl(${hue} 65% 48%) 62%, var(--sc-foreground))`,
      }}
      aria-hidden="true"
      data-fallback="initials"
    >
      {initials(name)}
    </span>
  );
};

export const ShadRecordList = (props) => {
  const { properties: p, setExposedVariables, fireEvent, id } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const rows = useMemo(
    () =>
      recordItems(p.data, {
        titleField: p.titleField,
        avatarField: p.avatarField,
        metaFields: p.metaFields,
        statusField: p.statusField,
        progressField: p.progressField,
        valueField: p.valueField,
        valueFormat: p.valueFormat,
        currency: p.currency,
        idField: p.idField,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      stringify(p.data ?? null),
      p.titleField,
      p.avatarField,
      p.metaFields,
      p.statusField,
      p.progressField,
      p.valueField,
      p.valueFormat,
      p.currency,
      p.idField,
    ]
  );
  // The first ROWS_PER_STEP rows and a button for the next ones, as the card grid does: a 10,000-row binding froze the
  // page. A new data binding starts again from the first step.
  const [shownCount, setShownCount] = useState(ROWS_PER_STEP);
  useEffect(() => setShownCount(ROWS_PER_STEP), [rows]);
  const [selected, setSelected] = useState(null);
  const idKey = text(p.idField) || 'id';
  // selectedItem is the row's data, selectedItemId its idField value.
  const selection = (row) => ({
    selectedItem: row?.row ?? {},
    selectedItemId: row ? row.row?.[idKey] ?? null : null,
  });
  useExposed(setExposedVariables, p, selection(selected));
  const hasClick = useHasEvent(id, 'onItemClicked');
  const density = DENSITY[p.density] || DENSITY.default;
  const showAvatar = p.showAvatar !== false;
  const dividers = p.showDividers !== false;
  const card = p.listStyle !== 'plain';
  const clickable = (hasClick || p.highlightSelected !== false) && !busy(p);
  // A selected row draws a 3px accent bar and a tint: a plain list that can show it pads its rows 12px, or the bar sat
  // against the title (a field service app, 2026-10-13).
  const inset = card ? 'px-4' : p.highlightSelected !== false ? 'px-3' : 'px-1';

  const click = (row) => {
    if (busy(p)) return;
    setSelected(row);
    setExposedVariables(selection(row));
    fireEvent('onItemClicked');
  };

  // Borders are classes: the pack's preflight sets every border width to 0 with !important, so an inline border
  // never shows. The colour stays inline.
  const BORDER = 'var(--lk-border,var(--sc-border))';
  const frameClass = card ? 'border' : '';
  const frame = card
    ? {
        borderColor: BORDER,
        borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
        background: 'var(--lk-bg,var(--sc-card))',
      }
    : { background: 'var(--lk-bg,transparent)' };
  const divided = (i) => (dividers && i > 0 ? 'border-t' : '');

  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (p.loadingState) {
    body = (
      <div className={cn('overflow-hidden', frameClass)} style={frame}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn('flex items-center gap-3', inset, density.pad, divided(i))}
            style={{ borderColor: BORDER }}
          >
            {showAvatar ? (
              <Skeleton
                className={cn('shrink-0', p.avatarShape === 'rounded' ? 'rounded-lg' : 'rounded-full')}
                style={{ width: density.avatar, height: density.avatar }}
              />
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-3/5" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  } else if (!rows.length) {
    body = (
      <div className={frameClass} style={frame}>
        <p className="m-0 py-10 text-center text-sm text-muted-foreground">{text(p.emptyText) || 'Nothing here yet'}</p>
      </div>
    );
  } else {
    body = (
      <div className={cn('overflow-hidden', frameClass)} style={frame}>
        <ul className="m-0 list-none p-0" role="list">
          {rows.slice(0, shownCount).map((row, i) => {
            const isSelected = p.highlightSelected !== false && selected?.key === row.key;
            return (
              <li
                key={row.key}
                role="button"
                tabIndex={0}
                onClick={() => click(row)}
                onKeyDown={onKeyActivate(() => click(row))}
                className={cn(
                  'flex min-w-0 items-center gap-3 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--lk-accent,var(--sc-ring))]',
                  inset,
                  density.pad,
                  divided(i),
                  clickable && 'cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--sc-foreground)_4%,transparent)]'
                )}
                style={{
                  borderColor: BORDER,
                  background: isSelected ? `color-mix(in srgb, ${ACCENT} 9%, transparent)` : undefined,
                  boxShadow: isSelected ? `inset 3px 0 0 ${ACCENT}` : undefined,
                }}
                data-selected={isSelected || undefined}
              >
                {showAvatar ? (
                  <RecordAvatar src={row.image} name={row.avatarName} size={density.avatar} shape={p.avatarShape} />
                ) : null}
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  {/* Two lines before it clips: in a narrow column beside a chip and a time, one line left titles such as
                      "Workspace setti…" that said nothing (a content calendar's drafts list, 2026-10-14). */}
                  <span
                    className={cn('line-clamp-2 break-words font-medium leading-snug', density.title)}
                    title={typeof row.title === 'string' ? row.title : undefined}
                    style={{
                      color: 'var(--lk-title,var(--sc-foreground))',
                      fontFamily: TITLE_FONT,
                    }}
                  >
                    {row.title}
                  </span>
                  {row.meta ? (
                    <span
                      className={cn('truncate tabular-nums leading-snug', density.meta)}
                      style={{
                        color: 'var(--lk-fg,var(--sc-muted-foreground))',
                      }}
                    >
                      {row.meta}
                    </span>
                  ) : null}
                  {row.progress !== null ? <InlineProgress pct={row.progress} className="mt-1 max-w-[240px]" /> : null}
                </div>
                {row.status ? (
                  <span className="flex min-w-0 max-w-[40%] shrink-0 justify-end">
                    <Chip value={row.status} />
                  </span>
                ) : null}
                {row.value ? (
                  <span
                    className={cn('shrink-0 text-right font-semibold tabular-nums', density.title)}
                    style={{
                      color: 'var(--lk-title,var(--sc-foreground))',
                      minWidth: '4.5rem',
                    }}
                  >
                    {row.value}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
        {rows.length > shownCount ? (
          <div className="flex justify-center border-t py-2" style={{ borderColor: BORDER }}>
            <button
              type="button"
              onClick={() => setShownCount((n) => n + ROWS_PER_STEP)}
              className="rounded-md px-3 py-1.5 text-sm text-[color:var(--sc-muted-foreground)] transition-colors hover:bg-[color:var(--sc-muted)] hover:text-[color:var(--sc-foreground)]"
            >
              {`Show ${Math.min(ROWS_PER_STEP, rows.length - shownCount)} more of ${rows.length - shownCount}`}
            </button>
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

// ---- Progress list ---------------------------------------------------------------------------------------------------

const BAR_HEIGHT = { thin: 4, default: 8, thick: 12 };
const PROGRESS_ROWS_PER_STEP = 100;

export const ShadProgressList = (props) => {
  const { properties: p, setExposedVariables, fireEvent, id } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const rows = useMemo(
    () =>
      progressItems(p.data, {
        labelField: p.labelField,
        valueField: p.valueField,
        targetField: p.targetField,
        percentField: p.percentField,
        captionField: p.captionField,
        statusField: p.statusField,
        valueFormat: p.valueFormat,
        currency: p.currency,
        idField: p.idField,
        autoTone: p.autoTone,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      stringify(p.data ?? null),
      p.labelField,
      p.valueField,
      p.targetField,
      p.percentField,
      p.captionField,
      p.statusField,
      p.valueFormat,
      p.currency,
      p.idField,
      p.autoTone,
    ]
  );
  // The first rows and a button for the next ones: a 10,000-row binding froze the page in the other lists.
  const [shownCount, setShownCount] = useState(PROGRESS_ROWS_PER_STEP);
  useEffect(() => setShownCount(PROGRESS_ROWS_PER_STEP), [rows]);
  const [selected, setSelected] = useState(null);
  const idKey = text(p.idField) || 'id';
  const selection = (row) => ({
    selectedItem: row?.row ?? {},
    selectedItemId: row ? row.row?.[idKey] ?? null : null,
  });
  useExposed(setExposedVariables, p, selection(selected));
  const clickable = useHasEvent(id, 'onItemClicked') && !busy(p);
  const barHeight = BAR_HEIGHT[p.barSize] || BAR_HEIGHT.default;
  const card = p.listStyle !== 'plain';
  const showValues = p.showValues !== false;
  const showPercent = p.showPercent !== false;
  const inset = card ? 'px-4' : 'px-0';

  const click = (row) => {
    if (busy(p)) return;
    setSelected(row);
    setExposedVariables(selection(row));
    fireEvent('onItemClicked');
  };

  // Borders are classes (the pack's preflight zeroes inline border widths); the colour stays inline.
  const BORDER = 'var(--lk-border,var(--sc-border))';
  const frameClass = card ? 'border' : '';
  const frame = card
    ? {
        borderColor: BORDER,
        borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
        background: 'var(--lk-bg,var(--sc-card))',
      }
    : { background: 'var(--lk-bg,transparent)' };

  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (p.loadingState) {
    body = (
      <div className={cn('flex flex-col', frameClass, card && 'py-1')} style={frame}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn('flex flex-col gap-2 py-3', inset)}>
            <div className="flex justify-between gap-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/5" />
            </div>
            <Skeleton className="w-full rounded-full" style={{ height: barHeight }} />
          </div>
        ))}
      </div>
    );
  } else if (!rows.length) {
    body = (
      <div className={frameClass} style={frame}>
        <p className="m-0 py-10 text-center text-sm text-muted-foreground">
          {text(p.emptyText) || 'Nothing to track yet'}
        </p>
      </div>
    );
  } else {
    body = (
      <div className={cn('overflow-hidden', frameClass, card && 'py-1')} style={frame}>
        <ul className="m-0 list-none p-0" role="list">
          {rows.slice(0, shownCount).map((row) => {
            const figure = showValues && row.value ? (row.target ? `${row.value} of ${row.target}` : row.value) : '';
            const pct = Number.isFinite(row.pct) ? percentLabel(row.pct) : '';
            return (
              <li
                key={row.key}
                {...(clickable
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      onClick: () => click(row),
                      onKeyDown: onKeyActivate(() => click(row)),
                    }
                  : { onClick: () => click(row) })}
                className={cn(
                  'flex min-w-0 flex-col gap-2 py-3 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--lk-accent,var(--sc-ring))]',
                  inset,
                  clickable && 'cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--sc-foreground)_4%,transparent)]'
                )}
                data-tone={row.tone || undefined}
              >
                <div className="flex min-w-0 items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="truncate text-sm font-medium leading-snug"
                      style={{
                        color: 'var(--lk-title,var(--sc-foreground))',
                        fontFamily: TITLE_FONT,
                      }}
                    >
                      {row.label}
                    </span>
                    {row.status ? (
                      <span className="flex min-w-0 shrink">
                        <Chip value={row.status} toneName={row.tone} />
                      </span>
                    ) : null}
                  </span>
                  {figure || (pct && showPercent && !row.caption) ? (
                    <span
                      className="shrink-0 text-sm tabular-nums"
                      style={{ color: 'var(--lk-title,var(--sc-foreground))' }}
                    >
                      {figure ? <span className="font-semibold">{figure}</span> : null}
                      {pct && showPercent && !row.caption ? (
                        <span
                          className={cn(figure && 'ml-2')}
                          style={{
                            color: 'var(--lk-fg,var(--sc-muted-foreground))',
                          }}
                        >
                          {pct}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </div>
                <Bar pct={row.pct} tone={row.tone} height={barHeight} label={row.label} />
                {row.caption ? (
                  <div className="flex min-w-0 items-baseline justify-between gap-3 text-xs">
                    <span
                      className="truncate"
                      style={{
                        color: 'var(--lk-fg,var(--sc-muted-foreground))',
                      }}
                    >
                      {row.caption}
                    </span>
                    {pct && showPercent ? (
                      <span
                        className="shrink-0 font-medium tabular-nums"
                        style={{
                          color: row.tone ? TONE_INK[row.tone] : 'var(--lk-fg,var(--sc-muted-foreground))',
                        }}
                      >
                        {pct}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        {rows.length > shownCount ? (
          <div className="flex justify-center border-t py-2" style={{ borderColor: BORDER }}>
            <button
              type="button"
              onClick={() => setShownCount((n) => n + PROGRESS_ROWS_PER_STEP)}
              className="rounded-md px-3 py-1.5 text-sm text-[color:var(--sc-muted-foreground)] transition-colors hover:bg-[color:var(--sc-muted)] hover:text-[color:var(--sc-foreground)]"
            >
              {`Show ${Math.min(PROGRESS_ROWS_PER_STEP, rows.length - shownCount)} more of ${rows.length - shownCount}`}
            </button>
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

// ---- Summary strip ---------------------------------------------------------------------------------------------------

const STRIP_SIZE = {
  sm: { value: 'text-lg', pad: 'px-4 py-3', min: 120 },
  default: { value: 'text-2xl', pad: 'px-5 py-4', min: 140 },
  lg: { value: 'text-3xl', pad: 'px-6 py-5', min: 170 },
};
const DELTA_TONE = {
  positive: 'var(--lk-pos,var(--sc-success))',
  negative: 'var(--lk-neg,var(--sc-destructive))',
  neutral: 'var(--sc-muted-foreground)',
};

export const ShadSummaryStrip = (props) => {
  const { properties: p } = props;
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
  const figures = useMemo(
    () =>
      summaryFigures(p.items, {
        valueFormat: p.valueFormat,
        currency: p.currency,
        deltaFormat: p.deltaFormat,
      }),
    [stringify(p.items ?? null), p.valueFormat, p.currency, p.deltaFormat] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const size = STRIP_SIZE[p.size] || STRIP_SIZE.default;
  const panel = p.appearance !== 'plain';
  const center = p.align === 'center';
  const count = p.loadingState ? 4 : figures.length;
  const columns = stripColumns(count, width || Number(props.width) || 960, size.min);
  // Borders are classes (the pack's preflight zeroes inline border widths); the colour stays inline.
  const hairline = 'var(--lk-border,var(--sc-border))';
  const frame = panel
    ? {
        borderColor: hairline,
        borderRadius: 'var(--lk-radius,calc(var(--sc-radius) + 4px))',
        background: 'var(--lk-bg,var(--sc-card))',
      }
    : { background: 'var(--lk-bg,transparent)' };
  // A hairline before every figure but the first of its row, and above every row but the first.
  // Without a panel, the first figure of each row starts at the strip's edge.
  const cellBorders = (i) =>
    cn(i % columns && 'border-l', i >= columns && 'border-t', !panel && !(i % columns) && 'pl-0');
  const pad = size.pad;

  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (!figures.length && !p.loadingState) {
    body = (
      <div className={panel ? 'border' : ''} style={frame}>
        <p className="m-0 py-6 text-center text-sm text-muted-foreground">No figures yet</p>
      </div>
    );
  } else {
    body = (
      <dl
        className={cn('m-0 grid overflow-hidden', panel && 'border')}
        style={{
          ...frame,
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        }}
      >
        {p.loadingState
          ? Array.from({ length: count }).map((_, i) => (
              <div
                key={i}
                className={cn('flex flex-col gap-2', pad, center && 'items-center', cellBorders(i))}
                style={{ borderColor: hairline }}
              >
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-24" />
              </div>
            ))
          : figures.map((f, i) => (
              <div
                key={f.key}
                className={cn('flex min-w-0 flex-col gap-1', pad, center && 'items-center text-center', cellBorders(i))}
                style={{ borderColor: hairline }}
              >
                {f.label ? (
                  // A long label wraps rather than being cut ("Technicians on the...", 2026-10-13); it takes the cell's
                  // spare height, so the figures in a row of the grid stay level whatever their labels' lengths.
                  <dt
                    className="flex-1 break-words text-xs font-medium"
                    style={{ color: 'var(--lk-fg,var(--sc-muted-foreground))' }}
                  >
                    {f.label}
                  </dt>
                ) : null}
                <dd
                  className={cn(
                    'm-0 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5',
                    center && 'justify-center'
                  )}
                >
                  <span
                    className={cn('truncate font-semibold leading-tight tracking-tight tabular-nums', size.value)}
                    style={{
                      color: 'var(--lk-title,var(--sc-foreground))',
                      fontFamily: TITLE_FONT,
                    }}
                  >
                    {f.value || '–'}
                  </span>
                  {f.delta ? (
                    <span
                      className="text-xs font-semibold tabular-nums"
                      style={{
                        color: DELTA_TONE[f.delta.tone] || DELTA_TONE.neutral,
                      }}
                      data-tone={f.delta.tone}
                    >
                      {f.delta.text}
                    </span>
                  ) : null}
                </dd>
                {f.caption ? (
                  <dd className="m-0 break-words text-xs" style={{ color: 'var(--lk-fg,var(--sc-muted-foreground))' }}>
                    {f.caption}
                  </dd>
                ) : figures.some((other) => other.caption) ? (
                  // A line held where a neighbour has a caption, so the figure stays level with theirs: "28" and "433"
                  // sat a line lower than "11" and "£6,467.11" (bookshop stock strip, 2026-10-14).
                  <dd aria-hidden="true" className="invisible m-0 text-xs">
                    &nbsp;
                  </dd>
                ) : null}
              </div>
            ))}
      </dl>
    );
  }
  return (
    <Shell {...props} innerRef={ref}>
      {body}
    </Shell>
  );
};
