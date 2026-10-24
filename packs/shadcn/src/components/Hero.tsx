import React from 'react';
import type { CSSProperties } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { iconFor } from '../lib/icons';
import { cn } from '../lib/cn';
import { FONT_LABELS, FONT_VALUES, fontStack, formatValue, isRecord, px, styleVars, toText } from '../lib/ui2/display/lists/model';
import { LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { HeroSkel } from '../lib/ui2/loading/shapes';
import '../styles/ui2-display.css';

type Fact = { label?: string; value: string };

// UI 2.0's heroMeta: a list of text or { label, value }, or one string split on ' · '.
const heroMeta = (meta: unknown): Fact[] => {
  const list: unknown[] = Array.isArray(meta) ? meta : typeof meta === 'string' && meta.trim() ? meta.split(/\s+·\s+/) : [];
  return list.flatMap((entry): Fact[] => {
    if (isRecord(entry)) {
      const value = toText(entry.value);
      return value ? [{ ...(typeof entry.label === 'string' && entry.label.trim() ? { label: entry.label } : {}), value }] : [];
    }
    const value = toText(entry).trim();
    return value ? [{ value }] : [];
  });
};

// The aside: a headline figure from a number or text, or up to four facts from a list.
type Aside = { kind: 'figure'; value: string; label: string } | { kind: 'facts'; facts: Fact[]; label: string };
const heroAside = (value: unknown, label: unknown): Aside | null => {
  const heading = toText(label).trim();
  let v = value;
  if (typeof v === 'string' && /^\s*\[/.test(v)) {
    try {
      v = JSON.parse(v);
    } catch {
      // Text that only starts with a bracket stays text.
    }
  }
  if (Array.isArray(v)) {
    const facts = heroMeta(v).slice(0, 4);
    return facts.length ? { kind: 'facts', facts, label: heading } : null;
  }
  const figure = typeof v === 'number' ? formatValue(v, 'auto') : toText(v).trim();
  return figure ? { kind: 'figure', value: figure, label: heading } : null;
};

const ACCENT = 'var(--lk-accent, var(--ui-primary))';
const safeUrl = (v: unknown) => (typeof v === 'string' && /^(https?:|data:image\/|\/)/i.test(v.trim()) ? v.trim() : '');

// The panel for each Background: plain draws none; tint, gradient and dark derive from the accent; image puts the URL
// behind a dark overlay. The pack's own 'solid' is a flat accent panel.
const heroPanel = (background: string, imageUrl: unknown): CSSProperties => {
  switch (background) {
    case 'plain':
      return {};
    case 'gradient':
      return {
        background: `radial-gradient(120% 140% at 0% 0%, color-mix(in srgb, ${ACCENT} 22%, var(--ui-bg)) 0%, color-mix(in srgb, ${ACCENT} 6%, var(--ui-bg)) 55%, var(--ui-bg) 100%)`,
        ['--hero-border' as string]: `color-mix(in srgb, ${ACCENT} 18%, var(--ui-border))`,
      };
    case 'dark':
      return { background: `linear-gradient(135deg, color-mix(in srgb, ${ACCENT} 78%, #000) 0%, color-mix(in srgb, ${ACCENT} 55%, #000) 100%)` };
    case 'solid':
      return { background: ACCENT };
    case 'image': {
      const url = safeUrl(imageUrl);
      return url
        ? {
            backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.2) 100%), url("${url.replace(/["\\\n\r]/g, encodeURIComponent)}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : { background: `linear-gradient(135deg, color-mix(in srgb, ${ACCENT} 78%, #000), #111)` };
    }
    default:
      return {
        background: `color-mix(in srgb, ${ACCENT} 7%, var(--ui-bg))`,
        ['--hero-border' as string]: `color-mix(in srgb, ${ACCENT} 16%, var(--ui-border))`,
      };
  }
};

// Page header banner: eyebrow, title, subtitle, meta chips, actions, and an optional figure or facts aside.
export const Hero = () => {
  const [eyebrow] = ToolJet.useStateString({ name: 'eyebrow', label: 'Eyebrow', initialValue: 'Operations' });
  const [title] = ToolJet.useStateString({ name: 'title', label: 'Title', initialValue: 'Good morning, Ada' });
  const [subtitle] = ToolJet.useStateString({ name: 'subtitle', label: 'Subtitle', initialValue: 'Here is what needs you today.' });
  const [meta] = ToolJet.useStateArray({ name: 'meta', label: 'Meta facts', initialValue: ['Sun, 11 Oct', '14 bookings', '3 need a reply'] });
  const [actionLabel] = ToolJet.useStateString({ name: 'actionLabel', label: 'Primary action label (empty hides it)', initialValue: 'New booking' });
  const [secondaryActionLabel] = ToolJet.useStateString({ name: 'secondaryActionLabel', label: 'Secondary action label (empty hides it)', initialValue: '' });
  const [asideValue] = ToolJet.useStateString({ name: 'asideValue', label: 'Aside: a figure, or a list of facts', initialValue: '' });
  const [asideLabel] = ToolJet.useStateString({ name: 'asideLabel', label: "Aside label (the figure's caption, the facts' heading)", initialValue: '' });
  const [icon] = ToolJet.useStateString({ name: 'icon', label: 'Icon (lucide name, e.g. sparkles)', initialValue: '', inspector: 'icon' });
  const [background] = ToolJet.useStateEnumeration({
    name: 'background',
    label: 'Background',
    enumDefinition: ['plain', 'tint', 'gradient', 'image', 'dark', 'solid'],
    enumLabels: { plain: 'Plain', tint: 'Tint', gradient: 'Gradient', image: 'Image', dark: 'Dark', solid: 'Solid' },
    initialValue: 'tint',
  });
  const [imageUrl] = ToolJet.useStateString({
    name: 'imageUrl',
    label: 'Background image URL (when Background is Image)',
    initialValue: '',
    visibleWhen: { key: 'background', value: 'image' },
  } as Parameters<typeof ToolJet.useStateString>[0]);
  const [align] = ToolJet.useStateEnumeration({
    name: 'align',
    label: 'Align',
    enumDefinition: ['left', 'center'],
    enumLabels: { left: 'Left', center: 'Center' },
    initialValue: 'left',
    inspector: 'switch',
  });
  const [size] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['compact', 'default', 'large'],
    enumLabels: { compact: 'Compact', default: 'Default', large: 'Large' },
    initialValue: 'default',
    inspector: 'switch',
  });
  const onActionClicked = ToolJet.useEventCallback({ name: 'onActionClicked' });
  const onSecondaryActionClicked = ToolJet.useEventCallback({ name: 'onSecondaryActionClicked' });
  const accent = ToolJet.useStyleString({ name: 'accentColor', label: 'Accent color', inspector: 'color', initialValue: '' });
  const backgroundColor = ToolJet.useStyleString({ name: 'backgroundColor', label: 'Panel background color (replaces the Background choice)', inspector: 'color', initialValue: '' });
  const titleColor = ToolJet.useStyleString({ name: 'titleColor', label: 'Title color', inspector: 'color', initialValue: '' });
  const textColor = ToolJet.useStyleString({ name: 'textColor', label: 'Subtitle and meta color', inspector: 'color', initialValue: '' });
  const radius = ToolJet.useStyleNumber({ name: 'borderRadius', label: 'Panel radius', initialValue: '' });
  const titleFontFamily = ToolJet.useStyleEnumeration({ name: 'titleFontFamily', label: 'Title typeface', enumDefinition: FONT_VALUES, enumLabels: FONT_LABELS, initialValue: 'theme' });
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ defaultWidth: 43, defaultHeight: 20 });

  const look = ['plain', 'tint', 'gradient', 'image', 'dark', 'solid'].includes(background) ? background : 'tint';
  const onDark = look === 'dark' || look === 'image' || look === 'solid';
  const sizeKey = ['compact', 'default', 'large'].includes(size) ? size : 'default';
  const center = align === 'center';
  const facts = heroMeta(meta);
  const aside = heroAside(asideValue, asideLabel);
  const Glyph = toText(icon) ? iconFor(icon) : null;
  const primary = toText(actionLabel);
  const secondary = toText(secondaryActionLabel);
  const grid = !!aside && !center;
  const panel: CSSProperties = {
    ...heroPanel(look, imageUrl),
    ...(backgroundColor ? { background: 'var(--lk-bg)' } : {}),
    borderRadius: look === 'plain' ? undefined : 'var(--lk-radius, calc(var(--ui-radius) + 6px))',
  };
  const hasBorder = !!(panel as Record<string, unknown>)['--hero-border'];
  const vars = styleVars([
    [accent, '--lk-accent'],
    [backgroundColor, '--lk-bg'],
    [titleColor, '--lk-title'],
    [textColor, '--lk-fg'],
    [radius, '--lk-radius', px],
    [titleFontFamily, '--lk-title-font', fontStack],
  ]);

  const actions =
    primary || secondary ? (
      <div className={cn('ui2-hero-buttons', center && 'is-centered')}>
        {secondary ? (
          <button type="button" className="ui-btn ui-btn--outline ui-btn--auto ui2-hero-secondary" onClick={onSecondaryActionClicked}>
            {secondary}
          </button>
        ) : null}
        {primary ? (
          <button type="button" className={cn('ui-btn ui-btn--default ui-btn--auto ui2-hero-primary', accent && 'has-accent')} onClick={onActionClicked}>
            {primary}
          </button>
        ) : null}
      </div>
    ) : null;

  return (
    <LoadingFrame loading={ld.loading} minHeight={120} look={ld.skeleton ? <HeroSkel /> : <LoadingBox />}>
      <div className="ui ui2-hero-box" style={vars}>
        <section
          className={cn('ui2-hero', `is-${sizeKey}`, look !== 'plain' && 'has-panel', hasBorder && 'has-border', onDark && 'on-dark', grid ? 'is-grid' : center ? 'is-centered' : 'is-row')}
          style={panel}
          data-background={look}
        >
          <div className={cn('ui2-hero-text', center && 'is-centered')}>
            {Glyph ? (
              <span className="ui2-hero-icon" aria-hidden="true">
                <Glyph size={24} strokeWidth={2} />
              </span>
            ) : null}
            <div className="ui2-hero-copy">
              {toText(eyebrow) ? <span className="ui2-hero-eyebrow">{toText(eyebrow)}</span> : null}
              <h1 className="ui2-hero-title">{toText(title)}</h1>
              {toText(subtitle) ? <p className="ui2-hero-subtitle">{toText(subtitle)}</p> : null}
              {facts.length ? (
                <ul className="ui2-hero-meta">
                  {facts.map((fact, i) => (
                    <li key={i} className="ui2-hero-chip">
                      {fact.label ? <span className="ui2-hero-muted">{fact.label}</span> : null}
                      {fact.value}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
          {aside ? (
            <div className={cn('ui2-hero-aside', center && 'is-centered')} data-aside={aside.kind}>
              {aside.label ? <span className="ui2-hero-aside-label">{aside.label}</span> : null}
              {aside.kind === 'figure' ? (
                <span className="ui2-hero-figure">{aside.value}</span>
              ) : (
                <dl className="ui2-hero-facts">
                  {aside.facts.map((fact, i) => (
                    <div key={i}>
                      <dt>{fact.label || ''}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ) : null}
          {actions ? <div className={cn('ui2-hero-actions', center && 'is-centered')}>{actions}</div> : null}
        </section>
      </div>
    </LoadingFrame>
  );
};
