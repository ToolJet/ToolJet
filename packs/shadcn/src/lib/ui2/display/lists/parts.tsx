// UI 2.0's section parts (Ui2/_sections/sectionParts.tsx, CardGrid's CardImage, _shared/Pager.tsx) in the pack's CSS
// (ui2-display-lists.css).
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../../cn';
import { avatarHue, barWidth, chipLabel, chipTone, initials, pageWindow, percentLabel } from './model';

/** A status chip toned by its words ('Paid' success, 'Overdue' danger); `onImage` draws it over a picture. */
export const Chip = ({ value, onImage }: { value: unknown; onImage?: boolean }) => (
  <span className={cn('u2l-chip', onImage && 'is-on-image')} data-tone={chipTone(value)} title={String(value)}>
    {chipLabel(value)}
  </span>
);

/** A slim bar in the accent with its percentage after it. */
export const InlineProgress = ({ pct, className }: { pct: number | null; className?: string }) => (
  <div className={cn('u2l-progress', className)} data-progress={Math.round(barWidth(pct))}>
    <div
      className="u2l-bar"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={typeof pct === 'number' && Number.isFinite(pct) ? Math.round(barWidth(pct)) : undefined}
    >
      <div className="u2l-bar-fill" style={{ width: `${barWidth(pct)}%` }} />
    </div>
    <span className="u2l-progress-label">{percentLabel(pct)}</span>
  </div>
);

/** A row's avatar: its image, or (none, or one that fails to load) the initials on a tint of the name's hue. */
export const RecordAvatar = ({ src, name, size, shape }: { src?: string; name: string; size: number; shape?: string }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const radius = shape === 'rounded' ? 'is-rounded' : '';
  if (src && !failed)
    return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className={cn('u2l-avatar', radius)} style={{ width: size, height: size }} />;
  const hue = avatarHue(name);
  return (
    <span
      className={cn('u2l-avatar is-initials', radius)}
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        background: `color-mix(in srgb, hsl(${hue} 70% 55%) 16%, var(--ui-bg))`,
        color: `color-mix(in srgb, hsl(${hue} 65% 48%) 62%, var(--ui-fg))`,
      }}
    >
      {initials(name)}
    </span>
  );
};

/** A card's picture: its image, or a tinted panel with the title's initials; badges sit over its top left corner. */
export const CardImage = ({ src, title, aspect, badges = [], fill = false }: { src: string; title: string; aspect: string; badges?: string[]; fill?: boolean }) => {
  const [failed, setFailed] = useState<string | null>(null);
  const hue = avatarHue(title);
  return (
    <div className={cn('u2l-card-image', fill && 'is-side')} style={fill ? undefined : { aspectRatio: aspect }}>
      {src && failed !== src ? (
        <img src={src} alt={title} loading="lazy" onError={() => setFailed(src)} />
      ) : (
        <div
          className="u2l-card-image-fallback"
          style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 92%) 0%, hsl(${(hue + 40) % 360} 65% 84%) 100%)` }}
        >
          <span style={{ color: `hsl(${hue} 45% 32%)` }}>{initials(title)}</span>
        </div>
      )}
      {badges.length ? (
        <span className="u2l-card-image-badges">
          {badges.map((badge, i) => (
            <Chip key={i} value={badge} onImage />
          ))}
        </span>
      ) : null}
    </div>
  );
};

/** The element's content width, kept current. */
export const useWidth = <T extends HTMLElement>(): [React.RefObject<T>, number] => {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
};

/** UI 2.0's pager: page numbers around the current one when the count is known, else previous / next only. */
export const Pager = ({
  page,
  pageCount,
  hasPrevious,
  hasNext,
  onPage,
}: {
  page: number;
  pageCount: number | null;
  hasPrevious: boolean;
  hasNext: boolean;
  onPage: (page: number) => void;
}) => (
  <div className="u2l-pager-buttons">
    <button type="button" className="ui-btn ui-btn--outline ui-btn--sm u2l-page-btn" aria-label="Previous page" disabled={!hasPrevious} onClick={() => onPage(page - 1)}>
      <ChevronLeft size={16} />
    </button>
    {pageWindow(page, pageCount).map((p) =>
      typeof p === 'string' ? (
        <span key={p} className="u2l-page-gap">
          …
        </span>
      ) : (
        <button
          key={p}
          type="button"
          className={cn('ui-btn ui-btn--sm u2l-page-btn', p === page ? 'ui-btn--outline is-current' : 'ui-btn--ghost')}
          aria-current={p === page ? 'page' : undefined}
          onClick={() => p !== page && onPage(p)}
        >
          {p}
        </button>
      )
    )}
    <button type="button" className="ui-btn ui-btn--outline ui-btn--sm u2l-page-btn" aria-label="Next page" disabled={!hasNext} onClick={() => onPage(page + 1)}>
      <ChevronRight size={16} />
    </button>
  </div>
);

/** Enter or Space on a focused row activates it. */
export const onKeyActivate = (fn: () => void) => (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fn();
  }
};
