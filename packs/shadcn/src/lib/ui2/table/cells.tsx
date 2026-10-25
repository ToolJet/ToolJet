import React from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Check } from 'lucide-react';
import DOMPurify from 'dompurify';
import { cn } from '../../cn';
import { avatarHue, chipLabel, chipTone } from '../display/lists/model';
import {
  BADGE_BY_STATUS,
  badgeLook,
  formatCell,
  initials,
  isSet,
  matchesCondition,
  readCell,
  safeImageUrl,
  safeUrl,
} from './model';
import type { Row, TableColumn } from './model';
import type { RowResolve } from './rowResolver';

type Loose = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export type OnAction = (buttonId: string, column: TableColumn, row: Row, rowIndex: number) => void;

/** Table-wide cell options: currency, locale, date format and badge colours for columns that set none. */
export interface CellDefaults {
  currency?: string;
  locale?: string;
  dateFormat?: string;
  badgeColors?: unknown;
}

/** Keeps one broken cell (a bad value) from taking the table down: it renders a dash instead. */
export class CellBoundary extends React.Component<{ resetKey: unknown; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(previous: { resetKey: unknown }) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? <span className="t2-muted">-</span> : this.props.children;
  }
}

// An HTML cell is the row's data, sanitised as UI 2.0's Table does: DOMPurify's defaults keep <style> (which restyles
// the whole page) and forms (a password box in a cell), so both are dropped too.
const CELL_HTML = { FORBID_TAGS: ['style', 'form', 'input', 'button', 'select', 'textarea'] };

// A badge's tone from its value: UI 2.0's Table's status words first, then the native Table's chip words ("Medium" and
// "At risk" warning, "Critical" destructive, "In progress" info), then a calm tone for a low priority.
const TONE_CLASS: Record<string, string> = { success: 'success', warning: 'warning', danger: 'destructive', info: 'info' };
const CALM = /^(low|minor|trivial|normal|standard|routine|p[34])$/i;
const toneOf = (value: string): string | null => {
  const known = BADGE_BY_STATUS[value.toLowerCase()];
  if (known) return known;
  const tone = TONE_CLASS[chipTone(value)];
  if (tone) return tone;
  return CALM.test(value.trim()) ? 'info' : null;
};
// Any other value (a tier, a region, a category) takes a colour of its own from a seven-hue palette, the same for the
// same value on every row and every table, instead of an uncoloured outline beside coloured badges.
// The hues keep clear of the status tones' red, amber and green, so a tier or a region never reads as a state.
const PALETTE_HUES = [262, 199, 172, 330, 230, 290, 186];
const paletteLook = (value: string): CSSProperties => {
  // avatarHue spreads values over seven slots (12 + 51n degrees); each slot takes one of the palette's hues.
  const hue = PALETTE_HUES[Math.round((avatarHue(value.trim().toLowerCase()) - 12) / 51) % PALETTE_HUES.length];
  return {
    '--t2-badge-fg': `color-mix(in srgb, hsl(${hue} 70% 34%) 85%, var(--ui-fg))`,
    '--t2-badge-bg': `hsl(${hue} 75% 50% / 0.13)`,
  } as CSSProperties;
};

const BadgeCell = ({ value, column, badgeColors }: { value: unknown; column: TableColumn; badgeColors: unknown }) => {
  if (!isSet(value)) return null;
  const own = badgeLook(value, column.badgeColors) ?? badgeLook(value, badgeColors);
  const option = column.options?.find((o: Loose) => String(o?.value ?? o) === String(value));
  const label = option?.label !== undefined ? String(option.label) : chipLabel(value);
  if (own) {
    return (
      <span className="t2-badge t2-badge--custom" style={own}>
        {label}
      </span>
    );
  }
  const tone = toneOf(String(value));
  return tone ? (
    <span className={cn('t2-badge', `t2-badge--${tone}`)}>{label}</span>
  ) : (
    <span className="t2-badge t2-badge--custom" style={paletteLook(String(value))}>
      {label}
    </span>
  );
};

const BUTTON_VARIANTS = new Set(['default', 'outline', 'secondary', 'ghost', 'destructive', 'link']);

interface RenderCellArgs {
  value: unknown;
  row: Row;
  column: TableColumn;
  defaults: CellDefaults;
  onAction: OnAction;
  rowIndex: number;
  disabled: boolean;
  /** Evaluates the column's per-row bindings (transformation, link text, button label, visibility and disable). */
  resolve: RowResolve;
}

const isFalse = (v: unknown) => v === false || v === 'false';
const isTrue = (v: unknown) => v === true || v === 'true';

/** A cell as the column type draws it. */
export const renderCell = ({ value: cellValue, row, column, defaults, onAction, rowIndex, disabled, resolve }: RenderCellArgs): ReactNode => {
  // As UI 2.0's Table: a transformation changes what the cell shows; sort, search and filters keep the data's value.
  const value = column.transformation !== undefined && column.transformation !== '' ? resolve(column.transformation, { rowData: row, cellValue, rowIndex }) : cellValue;
  const at = { rowData: row, cellValue, rowIndex };
  const format = {
    ...column.format,
    currency: column.format.currency ?? defaults.currency,
    locale: column.format.locale ?? defaults.locale,
    dateFormat: column.format.dateFormat ?? defaults.dateFormat,
  };
  switch (column.type) {
    case 'badge':
      return <BadgeCell value={value} column={column} badgeColors={defaults.badgeColors} />;
    case 'tags': {
      const tags = (Array.isArray(value) ? value : isSet(value) ? String(value).split(',') : [])
        .map((t) => String((t as Loose)?.label ?? t).trim())
        .filter(Boolean);
      return (
        <span className="t2-tags">
          {tags.map((tag, i) => (
            <span key={`${tag}-${i}`} className="t2-badge t2-badge--outline t2-badge--tag">
              {tag}
            </span>
          ))}
        </span>
      );
    }
    case 'boolean':
      return value === true || value === 'true' ? (
        <Check size={16} className="t2-yes" aria-label="Yes" />
      ) : (
        <span className="t2-muted" aria-label="No">
          -
        </span>
      );
    case 'link': {
      if (!isSet(value)) return null;
      const linkText = resolve(column.linkText, { rowData: row, cellValue: value, rowIndex });
      const text = isSet(linkText) ? String(linkText) : String(value);
      const href = safeUrl(value);
      // A script URL is shown as text, not as a link.
      if (!href) return <span>{text}</span>;
      return (
        <a
          className="t2-link"
          href={href}
          target={column.openInNewTab ? '_blank' : '_self'}
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          {text}
        </a>
      );
    }
    case 'image': {
      const src = safeImageUrl(value);
      return src ? <img className={cn('t2-image', column.imageShape === 'square' && 'is-square')} src={src} alt="" loading="lazy" /> : null;
    }
    case 'avatar': {
      // A person ({ src, name }) or a name.
      if (!isSet(value) && typeof value !== 'object') return null;
      const person = value && typeof value === 'object' ? (value as Loose) : null;
      const name = person ? person.name ?? '' : value;
      const src = person ? safeImageUrl(person.src) : '';
      return (
        <span className="t2-person">
          <span className="t2-avatar">{src ? <img src={src} alt="" /> : initials(name)}</span>
          <span className="t2-truncate">{String(name ?? '')}</span>
        </span>
      );
    }
    case 'progress': {
      const n = Number(value);
      if (!isSet(value) || !Number.isFinite(n)) return null;
      const pct = Math.max(0, Math.min(100, (n / (column.maxValue || 100)) * 100));
      return (
        <span className="t2-progress">
          <span className="t2-progress-track" role="progressbar" aria-label="Progress" aria-valuenow={Math.round(pct)}>
            <span style={{ width: `${pct}%` }} />
          </span>
          <span className="t2-progress-value t2-muted">{Math.round(pct)}%</span>
        </span>
      );
    }
    case 'button':
      return (
        <span className="t2-actions">
          {(column.buttons ?? []).map((button, i) => {
            const id = String(button.id ?? button.buttonId ?? `button${i + 1}`);
            // Rules are data ({ key, condition, value }), checked on this row.
            const when = (rule: Loose | undefined) =>
              !!rule && typeof rule === 'object' && matchesCondition(readCell(row, rule.key), rule.condition, rule.value);
            // Visibility, disable and label may be per-row bindings ({{rowData.status === 'Paid'}}).
            if (isFalse(resolve(button.visible ?? button.buttonVisibility, at)) || when(button.hiddenWhen)) return null;
            const isOff = isTrue(resolve(button.disabled ?? button.disableButton, at)) || when(button.disabledWhen);
            const buttonLabel = resolve(button.label ?? button.buttonLabel ?? 'Action', at);
            const variant = button.variant ?? (button.buttonType === 'solid' ? 'default' : 'outline');
            return (
              <button
                key={id}
                type="button"
                className={cn('ui-btn ui-btn--sm t2-action', `ui-btn--${BUTTON_VARIANTS.has(variant) ? variant : 'outline'}`)}
                disabled={isOff || disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(id, column, row, rowIndex);
                }}
              >
                {isSet(buttonLabel) ? String(buttonLabel) : 'Action'}
              </button>
            );
          })}
        </span>
      );
    case 'html':
      return isSet(value) ? (
        <span className="t2-html" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(value), CELL_HTML) }} />
      ) : null;
    case 'json':
      return isSet(value) || (value && typeof value === 'object') ? (
        <code className="t2-json">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</code>
      ) : null;
    default:
      return formatCell(value, { ...column, format });
  }
};
