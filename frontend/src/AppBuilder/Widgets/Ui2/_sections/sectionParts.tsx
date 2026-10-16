import React, { useEffect, useState } from 'react';
import { initials } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { barWidth, percentLabel } from './sectionsModel';
import { chipLabel, chipTone } from '@/AppBuilder/Widgets/Ui2/_shared/chipTone';
import { avatarHue } from '@/AppBuilder/Widgets/Ui2/_shared/avatarHue';
import '@/AppBuilder/Widgets/Ui2/_shared/styles/shadcn.scss';
import type { KeyboardEvent } from 'react';

// ToolJet UI 2.0: page sections (a hero, a card grid, a record list, a progress list and a summary strip). Configs in WidgetManager/widgets/shad*.js, style variables and loading looks
// in looks/sections.ts, data logic in sectionsModel.ts. A section draws a designed layout from properties only, so it
// stays editable in the inspector. Colours come from the theme (shadcn tokens) and the accent style.

export const ACCENT = 'var(--lk-accent,var(--sc-primary))';
// The accent as text (the eyebrow, an icon on its tint): the theme primary kept readable on the background.
export const ACCENT_INK = 'var(--lk-accent,var(--sc-primary-ink))';
export const TITLE_FONT = 'var(--lk-title-font,inherit)';

export const onKeyActivate =
  <E extends HTMLElement>(handler: (e: KeyboardEvent<E>) => void) =>
  (e: KeyboardEvent<E>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler(e);
    }
  };

export const text = (v: unknown): string => (v === null || v === undefined || typeof v === 'object' ? '' : String(v));

// ---- Card grid -------------------------------------------------------------------------------------------------------

export const TONE_VAR: Record<string, string> = {
  success: 'var(--sc-success)',
  warning: 'var(--sc-warning)',
  danger: 'var(--sc-destructive)',
  // A fixed blue, as charts and the map use: in the brand colour, Booked and In progress read as Completed under a green
  // theme and as Pending under an orange one (pet salon, helpdesk, 2026-10-14).
  info: 'var(--sc-chart-info)',
  neutral: 'var(--sc-muted-foreground)',
};

/** A status chip toned by its words, or by `toneName` where the widget already knows the tone (a progress row). */
export const Chip = ({ value, onImage, toneName }: { value: unknown; onImage?: boolean; toneName?: string }) => {
  const toneKey = toneName || chipTone(value);
  const tone = TONE_VAR[toneKey] || TONE_VAR.neutral;
  return (
    // A block box, so a chip too long for its room ends in an ellipsis (a flex box clips its text without one); the
    // full text is its tooltip.
    <span
      className="tw-inline-block tw-max-w-full tw-truncate tw-whitespace-nowrap tw-rounded-full tw-px-2.5 tw-py-0.5 tw-align-middle tw-text-xs tw-font-semibold"
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

/** A slim progress bar in the accent (or a tone), as wide as its box. */
export const Bar = ({
  pct,
  tone,
  height = 6,
  label,
}: {
  pct: number | null;
  tone?: string;
  height?: number;
  label?: string;
}) => (
  <div
    role="progressbar"
    aria-label={label || undefined}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(barWidth(pct))}
    className="tw-relative tw-w-full tw-min-w-0 tw-overflow-hidden tw-rounded-full"
    style={{
      height,
      background: 'var(--lk-track,color-mix(in srgb, var(--sc-foreground) 9%, transparent))',
    }}
  >
    <div
      className="tw-h-full tw-rounded-full tw-transition-[width] tw-duration-500 tw-ease-out"
      style={{
        width: `${barWidth(pct)}%`,
        background: tone ? TONE_VAR[tone] || ACCENT : ACCENT,
      }}
    />
  </div>
);

/** A bar with its percentage after it, for a card or a record row. */
export const InlineProgress = ({ pct, className }: { pct: number | null; className?: string }) => (
  <div
    className={cn('tw-flex tw-min-w-0 tw-items-center tw-gap-2', className)}
    data-progress={Math.round(barWidth(pct))}
  >
    <Bar pct={pct} height={6} />
    <span
      className="tw-shrink-0 tw-text-xs tw-font-medium tw-tabular-nums"
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

/** A row's avatar: its image, or (none, or one that fails to load) the initials on a tint of the name's hue. */
export const RecordAvatar = ({
  src,
  name,
  size,
  shape,
}: {
  src?: string;
  name: string;
  size: number;
  shape?: string;
}) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const hue = avatarHue(name);
  const radius = shape === 'rounded' ? 'tw-rounded-ui2-lg' : 'tw-rounded-full';
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn('tw-shrink-0 tw-object-cover', radius)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={cn('tj-record-avatar tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-font-semibold', radius)}
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
