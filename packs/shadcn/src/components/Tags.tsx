import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { cn } from '../lib/cn';
import { colorFor, isRecord, isScalar, px, styleVars } from '../lib/ui2/display/lists/model';
import { LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { ChipsSkel } from '../lib/ui2/loading/shapes';
import { TOKEN, useThemeColor, useThemeRadius } from '../lib/styleDefaults';
import '../styles/ui2-display.css';

type TagItem = { label: string; color?: string };

const MAX_ITEMS = 500;
const TAG_GAP = 6;

// UI 2.0's toTags: an array (of text, or { label | name | title | value }, plus the pack's own { color }) or a
// comma-separated string. Empty entries are dropped; duplicates stay.
const toTags = (raw: unknown, colors: unknown): TagItem[] => {
  const source: unknown[] = Array.isArray(raw) ? raw : isScalar(raw) ? String(raw).split(',') : [];
  const tags: TagItem[] = [];
  for (const entry of source) {
    let label: string | undefined;
    let color: string | undefined;
    if (isScalar(entry)) label = String(entry);
    else if (isRecord(entry)) {
      const name = entry.label ?? entry.name ?? entry.title ?? entry.value;
      label = isScalar(name) ? String(name) : undefined;
      if (isScalar(entry.color) && String(entry.color).trim()) color = String(entry.color);
    }
    if (label === undefined || label.trim() === '') continue;
    tags.push({ label: label.trim(), color: color ?? colorFor(label.trim(), colors) });
  }
  return tags;
};

// How many tags fit on one line, leaving room for the +N chip when some do not (UI 2.0's useFit).
const useFit = (
  enabled: boolean,
  count: number,
  row: HTMLDivElement | null,
  probe: HTMLDivElement | null,
  key: unknown
): number => {
  const [fit, setFit] = useState(count);
  useLayoutEffect(() => {
    if (!enabled || !row || !probe) return undefined;
    const measure = () => {
      const available = row.clientWidth;
      const chips = Array.from(probe.children) as HTMLElement[];
      const plus = chips.pop();
      if (!available || !chips.length) return setFit(count);
      const widths = chips.map((c) => c.offsetWidth);
      if (widths.every((w) => !w)) return setFit(count);
      const total = widths.reduce((s, w) => s + w, 0) + TAG_GAP * (widths.length - 1);
      if (total <= available) return setFit(count);
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
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [enabled, count, row, probe, key]);
  return enabled ? Math.min(fit, count) : count;
};

// Read-only tag list (statuses, categories). Clicking a tag exposes it as lastClickedTag.
export const Tags = () => {
  const [tags] = ToolJet.useStateArray({
    name: 'tags',
    label: 'Tags (array or comma-separated)',
    description: 'Strings or { label, color } objects.',
    initialValue: ['Design', 'Frontend', 'Urgent'],
  });
  const [tagColors] = ToolJet.useStateObject({
    name: 'tagColors',
    label: 'Colours by tag',
    description: 'Map of tag to color.',
    initialValue: { Urgent: '#dc2626' },
  });
  const [variant] = ToolJet.useStateEnumeration({
    name: 'variant',
    label: 'Variant',
    enumDefinition: ['soft', 'outline', 'solid'],
    enumLabels: { soft: 'Soft', outline: 'Outline', solid: 'Solid' },
    initialValue: 'soft',
    inspector: 'switch',
  });
  const [size] = ToolJet.useStateEnumeration({
    name: 'size',
    label: 'Size',
    enumDefinition: ['sm', 'default', 'lg'],
    enumLabels: { sm: 'Sm', default: 'Default', lg: 'Lg' },
    initialValue: 'default',
    inspector: 'switch',
  });
  // 'scroll' is the pack's own extra: one line that scrolls sideways.
  const [overflow] = ToolJet.useStateEnumeration({
    name: 'overflow',
    label: 'Overflow',
    enumDefinition: ['wrap', 'single', 'scroll'],
    enumLabels: { wrap: 'Wrap', single: 'One line, +N', scroll: 'Scroll' },
    initialValue: 'wrap',
    inspector: 'switch',
  });
  const [pill] = ToolJet.useStateBoolean({ name: 'pill', label: 'Pill shape', initialValue: false });
  const [, setLastClickedTag] = ToolJet.useStateString({
    name: 'lastClickedTag',
    initialValue: '',
    inspector: 'hidden',
  });
  const onTagClicked = ToolJet.useEventCallback({ name: 'onTagClicked' });
  const background = useThemeColor('backgroundColor', 'Tag background (unmapped tags)', TOKEN.muted);
  const textColor = useThemeColor('textColor', 'Tag text color (unmapped tags)', TOKEN.text);
  const borderColor = useThemeColor('borderColor', 'Tag border color', 'transparent');
  const borderRadius = useThemeRadius('borderRadius', 'Tag radius');
  const ld = useLoadingLook();
  ToolJet.useComponentSettings({ role: 'tags', fit: true, loading: 'own', defaultWidth: 12, defaultHeight: 3 });

  const items = useMemo(() => toTags(tags, tagColors), [tags, tagColors]);
  const [shownCount, setShownCount] = useState(MAX_ITEMS);
  const drawn = items.slice(0, shownCount);
  const single = overflow === 'single';
  const [row, setRow] = useState<HTMLDivElement | null>(null);
  const [probe, setProbe] = useState<HTMLDivElement | null>(null);
  const shown = useFit(single, drawn.length, row, probe, items);
  const look = ['soft', 'outline', 'solid'].includes(variant) ? variant : 'soft';
  const sizeClass = size === 'sm' ? 'is-sm' : size === 'lg' ? 'is-lg' : '';
  const chip = (t: TagItem, i: number, interactive: boolean) => {
    const className = cn('ui2-tag', sizeClass, `is-${look}`, t.color && 'is-mapped', pill && 'is-pill');
    const style = t.color ? ({ ['--tg' as string]: t.color } as React.CSSProperties) : undefined;
    if (!interactive)
      return (
        <span key={`${t.label}-${i}`} className={className} style={style}>
          <span className="ui2-truncate">{t.label}</span>
        </span>
      );
    return (
      <button
        key={`${t.label}-${i}`}
        type="button"
        role="listitem"
        className={className}
        style={style}
        title={t.label}
        onClick={() => {
          setLastClickedTag(t.label);
          onTagClicked();
        }}
      >
        <span className="ui2-truncate">{t.label}</span>
      </button>
    );
  };
  const hidden = items.length - (single ? shown : drawn.length);
  const vars = styleVars([
    [background, '--lk-bg'],
    [textColor, '--lk-fg'],
    [borderColor, '--lk-border'],
    [borderRadius, '--lk-radius', px],
  ]);

  if (!items.length)
    return (
      <div className="ui ui2-tags" style={vars}>
        <span className="ui-description">—</span>
      </div>
    );
  return (
    <LoadingFrame loading={ld.loading} minHeight={32} look={ld.skeleton ? <ChipsSkel /> : <LoadingBox />}>
      <div className="ui ui2-tags" style={vars}>
        <div
          ref={setRow}
          role="list"
          aria-label="Tags"
          className={cn('ui2-tags-row', single && 'is-single', overflow === 'scroll' && 'is-scroll')}
          style={{ gap: TAG_GAP }}
        >
          {drawn.slice(0, single ? shown : drawn.length).map((t, i) => chip(t, i, true))}
          {single && hidden > 0 ? (
            <span
              className={cn('ui2-tag', sizeClass, 'is-outline', 'is-more', pill && 'is-pill')}
              title={drawn
                .slice(shown)
                .map((t) => t.label)
                .join(', ')}
            >
              +{hidden}
            </span>
          ) : null}
        </div>
        {single ? (
          // Measures every tag (and a +N chip) off-screen, so the row knows how many fit.
          <div ref={setProbe} aria-hidden="true" className="ui2-tags-probe" style={{ gap: TAG_GAP }}>
            {drawn.map((t, i) => chip(t, i, false))}
            <span className={cn('ui2-tag', sizeClass, 'is-outline')}>+{items.length}</span>
          </div>
        ) : null}
        {!single && items.length > drawn.length ? (
          <button type="button" className="ui2-show-more" onClick={() => setShownCount((n) => n + MAX_ITEMS)}>
            Show {Math.min(MAX_ITEMS, items.length - drawn.length)} more
          </button>
        ) : null}
      </div>
    </LoadingFrame>
  );
};
