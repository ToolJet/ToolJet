import React, { useMemo, useRef } from 'react';
import * as Lucide from 'lucide-react';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { fitsContentInView } from '@/AppBuilder/_helpers/dynamicHeightPolicy';
import { Button, Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { resolveIcon } from '@/AppBuilder/Widgets/Ui2/_display/iconModel';
import { heroAside, heroMeta } from '@/AppBuilder/Widgets/Ui2/_sections/sectionsModel';
import { ACCENT, ACCENT_INK, TITLE_FONT } from '@/AppBuilder/Widgets/Ui2/_sections/sectionParts';
import type { StyleWithVars, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { toText } from '@/AppBuilder/Widgets/Ui2/_shared/values';

// ---- Hero ------------------------------------------------------------------------------------------------------------

const ASIDE_FIGURE: Record<string, string> = { compact: 'tw-text-2xl', large: 'tw-text-4xl' };

export const HERO_SIZE: Record<string, { pad: string; title: string; gap: string }> = {
  compact: { pad: 'tw-px-6 tw-py-5', title: 'tw-text-2xl', gap: 'tw-gap-1.5' },
  default: { pad: 'tw-px-8 tw-py-7', title: 'tw-text-3xl', gap: 'tw-gap-2' },
  large: { pad: 'tw-px-10 tw-py-12', title: 'tw-text-4xl md:tw-text-5xl', gap: 'tw-gap-3' },
};

/** The panel behind the hero for its background style: plain draws none; tint, gradient and dark derive from the
 *  accent; image puts the URL behind a dark overlay. The panel background style overrides any of them. */
export const heroPanel = (background: string, imageUrl: unknown): StyleWithVars => {
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

export const ShadHero = (props: WidgetProps) => {
  const { properties: p, fireEvent } = props;
  const ref = useRef<HTMLDivElement>(null);
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
  const metaSource = useStable(p.meta);
  const asideValue = useStable(p.asideValue);
  const asideLabel = p.asideLabel;
  const meta = useMemo(() => heroMeta(metaSource), [metaSource]);
  const aside = useMemo(() => heroAside(asideValue, asideLabel), [asideValue, asideLabel]);
  const Icon = toText(p.icon) ? resolveIcon(p.icon, [Lucide.icons, Lucide], null) : null;
  const primary = toText(p.actionLabel);
  const secondary = toText(p.secondaryActionLabel);
  const fg = onDark ? '#ffffff' : 'var(--lk-title,var(--sc-foreground))';
  const muted = onDark ? 'rgba(255,255,255,0.78)' : 'var(--lk-fg,var(--sc-muted-foreground))';
  const style: StyleWithVars = {
    ...heroPanel(background, p.imageUrl),
    borderRadius: background === 'plain' ? undefined : 'var(--lk-radius,calc(var(--sc-radius) + 6px))',
  };
  if (props.styles?.backgroundColor) style.background = 'var(--lk-bg)';
  // The tint and gradient panels' hairline: the pack's border reset beats an inline border, so it never drew.
  const panel = cn(
    background !== 'plain' && size.pad,
    style['--hero-border'] && 'tw-border tw-border-[color:var(--hero-border)]'
  );

  const actions =
    primary || secondary ? (
      <div className={cn('tw-flex tw-min-w-0 tw-max-w-full tw-flex-wrap tw-gap-2', center && 'tw-justify-center')}>
        {secondary ? (
          <Button
            variant="outline"
            disabled={busy(p)}
            onClick={() => fireEvent('onSecondaryActionClicked')}
            className={cn(
              onDark && 'tw-border-white/40 tw-bg-transparent tw-text-white hover:tw-bg-white/10 hover:tw-text-white'
            )}
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
                  'tw-bg-white tw-text-[#0f172a] hover:tw-bg-white/90'
                : 'tw-bg-[color:var(--lk-accent,var(--sc-primary))] tw-text-[color:var(--sc-primary-foreground)] hover:tw-opacity-90'
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
        'sc-hero-aside tw-flex tw-shrink-0 tw-flex-col tw-gap-1',
        center ? 'tw-mt-5 tw-items-center' : 'tw-min-w-[150px] tw-items-end tw-border-l tw-pl-6 tw-text-right'
      )}
      style={{
        borderColor: onDark ? 'rgba(255,255,255,0.22)' : 'var(--lk-border,var(--sc-border))',
      }}
      data-aside={aside.kind}
    >
      {aside.label ? (
        <span className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-[0.08em]" style={{ color: muted }}>
          {aside.label}
        </span>
      ) : null}
      {aside.kind === 'figure' ? (
        <span
          className={cn(
            'tw-font-semibold tw-leading-none tw-tracking-tight tw-tabular-nums',
            ASIDE_FIGURE[p.size] || 'tw-text-3xl'
          )}
          style={{ color: fg, fontFamily: TITLE_FONT }}
        >
          {aside.value}
        </span>
      ) : (
        <dl className="tw-m-0 tw-flex tw-flex-col tw-gap-1.5" style={{ minWidth: 170 }}>
          {aside.facts.map((fact, i) => (
            <div key={i} className="tw-flex tw-items-baseline tw-justify-between tw-gap-6 tw-text-ui2-sm">
              <dt className="tw-m-0" style={{ color: muted }}>
                {fact.label || ''}
              </dt>
              <dd className="tw-m-0 tw-font-semibold tw-tabular-nums" style={{ color: fg }}>
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
      <div className={cn('tw-flex tw-flex-col', size.gap, panel)} style={style}>
        <Skeleton className="tw-h-3 tw-w-24" />
        <Skeleton className="tw-h-8 tw-w-2/3" />
        <Skeleton className="tw-h-4 tw-w-1/2" />
      </div>
    );
  } else {
    body = (
      <div className={cn('sc-hero-box', fixed && 'tw-h-full')}>
        <section
          className={cn(
            'sc-hero tw-w-full',
            panel,
            fixed && 'tw-max-h-full tw-overflow-y-auto',
            // With an aside, a grid: text and actions on the left, the aside right of both; in a narrow hero, text,
            // aside, actions (shadcn.scss).
            grid
              ? 'sc-hero-grid'
              : cn(
                  'tw-flex',
                  center
                    ? 'tw-flex-col tw-items-center tw-text-center'
                    : 'tw-flex-wrap tw-items-center tw-gap-x-6 tw-gap-y-4'
                )
          )}
          style={style}
          data-background={background}
        >
          <div
            className={cn(
              'sc-hero-text tw-flex tw-min-w-0',
              center ? 'tw-flex-col tw-items-center' : 'tw-flex-[1_1_20rem] tw-items-start tw-gap-4'
            )}
          >
            {Icon ? (
              <span
                className={cn(
                  'tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-ui2-xl',
                  center ? 'tw-mb-3' : 'tw-mt-1'
                )}
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
            <div className={cn('tw-flex tw-min-w-0 tw-flex-col', size.gap, center && 'tw-items-center')}>
              {toText(p.eyebrow) ? (
                <span
                  className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em]"
                  style={{
                    color: onDark ? 'rgba(255,255,255,0.85)' : ACCENT_INK,
                  }}
                >
                  {toText(p.eyebrow)}
                </span>
              ) : null}
              <h1
                className={cn('tw-m-0 tw-font-semibold tw-leading-tight tw-tracking-tight', size.title)}
                style={{
                  color: fg,
                  fontFamily: TITLE_FONT,
                  textWrap: 'balance',
                }}
              >
                {toText(p.title)}
              </h1>
              {toText(p.subtitle) ? (
                <p className="tw-m-0 tw-max-w-[68ch] tw-text-ui2-base tw-leading-relaxed" style={{ color: muted }}>
                  {toText(p.subtitle)}
                </p>
              ) : null}
              {meta.length ? (
                <ul
                  className={cn(
                    'tw-m-0 tw-mt-1 tw-flex tw-list-none tw-flex-wrap tw-gap-2 tw-p-0',
                    center && 'tw-justify-center'
                  )}
                >
                  {meta.map((fact, i) => (
                    <li
                      key={i}
                      className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-px-3 tw-py-1 tw-text-xs tw-font-medium tw-tabular-nums"
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
            <div className={cn('tw-min-w-0 tw-max-w-full', grid ? 'sc-hero-actions' : center && 'tw-mt-5')}>
              {actions}
            </div>
          ) : null}
        </section>
      </div>
    );
  }
  return (
    <Shell {...props} innerRef={ref} className={cn(fixed && 'tw-h-full tw-overflow-y-auto')}>
      {body}
    </Shell>
  );
};

export default withControlState(ShadHero);
