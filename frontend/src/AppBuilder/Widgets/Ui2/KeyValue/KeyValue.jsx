import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';
import { useHasEvent } from '@/AppBuilder/Widgets/Ui2/_shared/parity';
import { LoadingBox, wantsSkeleton } from '@/AppBuilder/Widgets/Ui2/_shared/loadingLook';
import { Shell, busy } from '@/AppBuilder/Widgets/Ui2/_shared/Shell';
import { useAutoHeight, useExposed, withControlState } from '@/AppBuilder/Widgets/Ui2/_shared/packHooks';
import { Skeleton, cn } from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { isSet } from '@/AppBuilder/Widgets/Ui2/_shared/looks/kanbanLook';
import { clamp, colorFor, formatValue, keyValueItems, linkHref } from '@/AppBuilder/Widgets/Ui2/_display/displayModel';
import { stringify } from '@/AppBuilder/Widgets/Ui2/_shared/packJson';
import { onKeyActivate } from '@/AppBuilder/Widgets/Ui2/_display/displayParts';

// ---- Key-value list --------------------------------------------------------------------------------------------------

const cssSize = (value, fallback) => {
  if (!isSet(value)) return fallback;
  const text = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(text)) return `${Math.min(Number(text), 2000)}px`;
  if (/^\d+(\.\d+)?(px|%|rem|em|ch)$/.test(text)) return text;
  return fallback;
};

export const CopyButton = ({ text }) => {
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

export const KeyValueValue = ({ row, text, emptyText, badgeColors }) => {
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
        className="break-all rounded-sm font-medium text-[color:var(--lk-link,var(--sc-primary-ink))] no-underline underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
  const { properties: p, setExposedVariables, setExposedVariable, fireEvent, id } = props;
  const ref = useRef(null);
  useAutoHeight(props, ref);
  const rows = useMemo(() => keyValueItems(p.data), [stringify(p.data ?? null)]); // eslint-disable-line react-hooks/exhaustive-deps
  // The native Key value pair's data and onFieldClick (with lastClickedField: the row's label and value).
  useExposed(setExposedVariables, p, { data: rows.map(({ label, value }) => ({ label, value })) });
  const clickable = useHasEvent(id, 'onFieldClick') && !busy(p);
  const clickField = (row) => {
    if (busy(p)) return;
    setExposedVariable('lastClickedField', { label: row.label, value: row.value ?? null });
    fireEvent('onFieldClick');
  };
  const inline = p.layout !== 'stacked';
  // As many columns as fit: two inline columns in a 400px card cut every value to a few letters ("PO 88", "$8,") on a
  // claim's facts (2026-10-14). An inline pair needs about 300px, a stacked one 160px.
  const fits = Number(props.width) > 0 ? Math.max(1, Math.floor(Number(props.width) / (inline ? 300 : 160))) : 4;
  const columns = Math.min(Math.floor(clamp(p.columns, 1, 4, 1)), fits);
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
              onClick={() => clickField(row)}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onKeyDown={clickable ? onKeyActivate(() => clickField(row)) : undefined}
              className={cn(
                'group flex min-w-0 text-sm',
                clickable && 'cursor-pointer hover:bg-[color:var(--sc-muted)]',
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

export default withControlState(ShadKeyValue);
