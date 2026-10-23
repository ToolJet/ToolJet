import React, { useMemo, useRef } from 'react';
import type { StyleWithVars, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { Check, Copy, X } from 'lucide-react';
import { useHasEvent } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, useStable, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { colorFor, keyValueItems, keyValueText, linkHref } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import type { KeyValueRow } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import { clampCoerce, isSet } from '@/AppBuilder/Widgets/Ui2/_shared/values';
import { isComposing, isEnter, onKeyActivate } from '@/AppBuilder/Widgets/Ui2/_shared/keyboard';
import { copyText, useCopied } from '@/AppBuilder/Widgets/Ui2/_shared/useCopied';

// ---- Key-value list --------------------------------------------------------------------------------------------------

const cssSize = (value: unknown, fallback: string): string => {
  if (!isSet(value)) return fallback;
  const text = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(text)) return `${Math.min(Number(text), 2000)}px`;
  if (/^\d+(\.\d+)?(px|%|rem|em|ch)$/.test(text)) return text;
  return fallback;
};

export const CopyButton = ({ text, disabled = false }: { text: string; disabled?: boolean }) => {
  const [copied, markCopied] = useCopied(text);
  return (
    <button
      type="button"
      aria-label="Copy value"
      // Disabled with the list: it wrote to the clipboard while the list was disabled.
      disabled={disabled}
      className="tw-ml-1 tw-inline-flex tw-h-6 tw-w-6 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-ui2-md tw-text-ui2-muted-foreground tw-opacity-0 tw-transition-opacity hover:tw-bg-ui2-accent hover:tw-text-ui2-foreground focus-visible:tw-opacity-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring group-hover:tw-opacity-100"
      // The copy is the button's own: its row's click and Enter or Space (onFieldClick) do not take it.
      onClick={(e) => {
        e.stopPropagation();
        copyText(text, markCopied, 'Failed to copy value');
      }}
      onKeyDown={(e) => {
        if (isEnter(e) || (e.key === ' ' && !isComposing(e))) e.stopPropagation();
      }}
    >
      {copied ? <Check className="tw-h-3.5 tw-w-3.5" /> : <Copy className="tw-h-3.5 tw-w-3.5" />}
    </button>
  );
};

interface KeyValueValueProps {
  row: KeyValueRow;
  text: string;
  emptyText: string;
  badgeColors: unknown;
  disabled?: boolean;
}

export const KeyValueValue = ({ row, text, emptyText, badgeColors, disabled = false }: KeyValueValueProps) => {
  const empty = <span className="tw-text-[color:var(--sc-muted-foreground)]">{emptyText}</span>;
  if (row.type === 'boolean') {
    if (row.value === undefined || row.value === null || row.value === '') return empty;
    const yes = text === 'Yes';
    return (
      <span className="tw-inline-flex tw-items-center tw-gap-1.5">
        {yes ? (
          <Check className="tw-h-4 tw-w-4 tw-text-[color:var(--sc-success)]" aria-hidden="true" />
        ) : (
          <X className="tw-h-4 tw-w-4 tw-text-[color:var(--sc-muted-foreground)]" aria-hidden="true" />
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
          'tw-inline-flex tw-items-center tw-rounded-ui2-md tw-border tw-px-2 tw-py-0.5 tw-text-xs tw-font-medium',
          colour
            ? 'tw-border-transparent tw-bg-[color:color-mix(in_srgb,var(--tg)_14%,transparent)] tw-text-[color:var(--tg)]'
            : 'tw-border-transparent tw-bg-ui2-secondary tw-text-ui2-secondary-foreground'
        )}
        style={colour ? ({ '--tg': colour } as StyleWithVars) : undefined}
      >
        {text}
      </span>
    );
  }
  if (row.type === 'link') {
    const href = linkHref(row);
    const shown = isSet(row.linkText) ? String(row.linkText) : text;
    if (!href) return <span className="tw-break-words">{shown}</span>;
    const external = /^https?:/i.test(href);
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        // A disabled list's links do not navigate, as a disabled Link's do not (Link.tsx).
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : undefined}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
        className="tw-break-all tw-rounded-ui2-sm tw-font-medium tw-text-[color:var(--lk-link,var(--sc-primary-ink))] tw-no-underline tw-underline-offset-4 hover:tw-underline focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-ui2-ring"
      >
        {shown}
      </a>
    );
  }
  return (
    <span className={cn('tw-break-words', (row.type === 'number' || row.type === 'currency') && 'tw-tabular-nums')}>
      {text}
    </span>
  );
};

export const ShadKeyValue = (props: WidgetProps) => {
  const { properties: p, setExposedVariables, setExposedVariable, fireEvent, id } = props;
  const ref = useRef<HTMLDivElement>(null);
  useAutoHeight(props, ref);
  const data = useStable(p.data);
  const rows = useMemo(() => keyValueItems(data), [data]);
  // The native Key value pair's data and onFieldClick (with lastClickedField: the row's label and value).
  useExposed(setExposedVariables, p, { data: rows.map(({ label, value }) => ({ label, value })) });
  const clickable = useHasEvent(id, 'onFieldClick') && !busy(p);
  const clickField = (row: KeyValueRow) => {
    if (busy(p)) return;
    setExposedVariable('lastClickedField', { label: row.label, value: row.value ?? null });
    fireEvent('onFieldClick');
  };
  const inline = p.layout !== 'stacked';
  // As many columns as fit: two inline columns in a 400px card cut every value to a few letters ("PO 88", "$8,").
  // An inline pair needs about 300px, a stacked one 160px.
  const fits = Number(props.width) > 0 ? Math.max(1, Math.floor(Number(props.width) / (inline ? 300 : 160))) : 4;
  const columns = Math.min(Math.floor(clampCoerce(p.columns, 1, 4, 1)), fits);
  const dividers = p.dividers !== false;
  const emptyText = p.emptyText === undefined || p.emptyText === null ? '—' : String(p.emptyText);
  const labelWidth = cssSize(p.labelWidth, '40%');
  const defaults = { currency: p.currency || 'USD', locale: p.locale || 'en-US', dateFormat: p.dateFormat };
  const lastRowStart = rows.length - (rows.length % columns || columns);
  let body;
  if (p.loadingState && !wantsSkeleton(p)) {
    body = <LoadingBox height={props.height} />;
  } else if (p.loadingState) {
    body = (
      <div className="tw-flex tw-flex-col">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'tw-flex tw-gap-4 tw-py-2.5',
              inline ? 'tw-flex-row tw-items-center' : 'tw-flex-col tw-gap-1.5'
            )}
          >
            <Skeleton className="tw-h-4 tw-w-24" />
            <Skeleton className="tw-h-4 tw-w-40 tw-max-w-full" />
          </div>
        ))}
      </div>
    );
  } else if (!rows.length) {
    body = <p className="tw-py-4 tw-text-center tw-text-ui2-sm tw-text-ui2-muted-foreground">No details</p>;
  } else {
    body = (
      <dl className="tw-m-0 tw-grid tw-gap-x-8" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {rows.map((row, index) => {
          const text = keyValueText(row, defaults);
          return (
            <div
              key={row.key}
              onClick={() => clickField(row)}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              // Keys pressed on the row only: Enter or Space on its link follows or scrolls as usual.
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.target === e.currentTarget) onKeyActivate(() => clickField(row))(e);
                    }
                  : undefined
              }
              className={cn(
                'tw-group tw-flex tw-min-w-0 tw-text-ui2-sm',
                clickable && 'tw-cursor-pointer hover:tw-bg-[color:var(--sc-muted)]',
                inline ? 'tw-flex-row tw-items-start tw-gap-4 tw-py-2.5' : 'tw-flex-col tw-gap-1 tw-py-3',
                dividers && index < lastRowStart && 'tw-border-b tw-border-[color:var(--lk-border,var(--sc-border))]'
              )}
            >
              <dt
                className="tw-m-0 tw-min-w-0 tw-break-words tw-font-normal tw-text-[color:var(--lk-label,var(--sc-muted-foreground))]"
                style={inline ? { width: labelWidth, flexShrink: 0 } : undefined}
              >
                {row.label}
              </dt>
              <dd className="tw-m-0 tw-flex tw-min-w-0 tw-flex-1 tw-items-start tw-font-medium tw-text-[color:var(--lk-fg,var(--sc-foreground))]">
                <KeyValueValue
                  row={row}
                  text={text}
                  emptyText={emptyText}
                  badgeColors={p.badgeColors}
                  disabled={busy(p)}
                />
                {p.allowCopy === true && text ? <CopyButton text={text} disabled={busy(p)} /> : null}
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

export default withControlState(ShadKeyValue);
