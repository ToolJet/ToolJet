import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ToolJet } from '@tooljet/custom-component-sdk';
import { Check, Copy, X } from 'lucide-react';
import { cn } from '../lib/cn';
import { colorFor, isSet, keyValueItems, keyValueText, linkHref, styleVars, type KeyValueRow } from '../lib/ui2/display/lists/model';
import { useWidth } from '../lib/ui2/display/lists/parts';
import { LoadingBox, LoadingFrame, useLoadingLook } from '../lib/ui2/loading/look';
import { PairsSkel } from '../lib/ui2/loading/shapes';
import { moveRovingFocus } from '../lib/activeElement';
import '../styles/ui2-display-lists.css';

const cssSize = (value: unknown, fallback: string): string => {
  if (!isSet(value)) return fallback;
  const t = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(t)) return `${Math.min(Number(t), 2000)}px`;
  if (/^\d+(\.\d+)?(px|%|rem|em|ch)$/.test(t)) return t;
  return fallback;
};

const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      aria-label="Copy value"
      className="u2l-kv-copy"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard?.writeText(value).catch(() => {});
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 1200);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
};

const Value = ({ row, shown, emptyText, badgeColors }: { row: KeyValueRow; shown: string; emptyText: string; badgeColors: unknown }) => {
  const empty = <span className="u2l-kv-empty">{emptyText}</span>;
  if (row.type === 'boolean') {
    if (!isSet(row.value)) return empty;
    return (
      <span className="u2l-kv-bool">
        {shown === 'Yes' ? <Check size={16} className="is-yes" aria-hidden="true" /> : <X size={16} className="is-no" aria-hidden="true" />}
        {shown}
      </span>
    );
  }
  if (!shown) return empty;
  if (row.type === 'badge') {
    const colour = colorFor(shown, badgeColors) ?? (isSet(row.color) ? String(row.color) : undefined);
    return (
      <span className={cn('u2l-kv-badge', colour && 'is-colored')} style={colour ? ({ ['--tg' as string]: colour } as React.CSSProperties) : undefined}>
        {shown}
      </span>
    );
  }
  if (row.type === 'link') {
    const href = linkHref(row);
    const label = isSet(row.linkText) ? String(row.linkText) : shown;
    if (!href) return <span className="u2l-kv-text">{label}</span>;
    const external = /^https?:/i.test(href);
    return (
      <a className="u2l-kv-link" href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
        {label}
      </a>
    );
  }
  return <span className={cn('u2l-kv-text', (row.type === 'number' || row.type === 'currency') && 'is-figure')}>{shown}</span>;
};

// UI 2.0's Key-value list: label and value pairs (an object, [{ label, value, type }] or [label, value] pairs), with
// typed rows (text, number, currency, date, datetime, badge, link, boolean) formatted in the list's currency, locale
// and date format.
export const KeyValue = () => {
  const [data] = ToolJet.useStateObject({
    name: 'data',
    label: 'Data (object or array)',
    description: "{ Status: 'Active' } or [{ label: 'Amount', value: 1250, type: 'currency' }]",
    initialValue: [
      { label: 'Customer', value: 'Ada Lovelace' },
      { label: 'Email', value: 'ada@example.com', type: 'link' },
      { label: 'Status', value: 'Active', type: 'badge' },
      { label: 'Plan', value: 'Pro' },
      { label: 'Amount', value: 1250, type: 'currency' },
      { label: 'Renews', value: '2026-11-14', type: 'date' },
    ] as unknown as Record<string, unknown>,
  });
  const [columns] = ToolJet.useStateEnumeration({ name: 'columns', label: 'Columns', enumDefinition: ['1', '2', '3', '4'], initialValue: '1', inspector: 'switch' });
  const [layout] = ToolJet.useStateEnumeration({ name: 'layout', label: 'Layout', enumDefinition: ['stacked', 'inline'], initialValue: 'inline', inspector: 'switch' });
  const [labelWidth] = ToolJet.useStateString({
    name: 'labelWidth',
    label: 'Label width (side by side; px or %)',
    initialValue: '40%',
    visibleWhen: { key: 'layout', value: 'inline' },
  } as Parameters<typeof ToolJet.useStateString>[0]);
  const [dividers] = ToolJet.useStateBoolean({ name: 'dividers', label: 'Dividers', initialValue: true });
  const [emptyText] = ToolJet.useStateString({ name: 'emptyText', label: 'Empty value text', initialValue: '—' });
  const [currency] = ToolJet.useStateString({ name: 'currency', label: 'Currency (currency rows)', initialValue: 'USD', section: 'Formats for typed rows' });
  const [locale] = ToolJet.useStateString({ name: 'locale', label: 'Number locale', initialValue: 'en-US', section: 'Formats for typed rows' });
  const [dateFormat] = ToolJet.useStateString({ name: 'dateFormat', label: 'Date format (date rows)', initialValue: 'DD MMM YYYY', section: 'Formats for typed rows' });
  const [badgeColors] = ToolJet.useStateObject({
    name: 'badgeColors',
    label: 'Badge colours by value',
    initialValue: { Active: '#16a34a' },
    section: 'Formats for typed rows',
  });
  const [allowCopy] = ToolJet.useStateBoolean({ name: 'allowCopy', label: 'Copy button on hover', initialValue: false });
  const [, setLastClickedField] = ToolJet.useStateObject({ name: 'lastClickedField', initialValue: {}, inspector: 'hidden' });
  const onFieldClick = ToolJet.useEventCallback({ name: 'onFieldClick' });
  const labelColor = ToolJet.useStyleString({ name: 'labelColor', label: 'Label color', inspector: 'color', initialValue: '' });
  const valueColor = ToolJet.useStyleString({ name: 'valueColor', label: 'Value color', inspector: 'color', initialValue: '' });
  const dividerColor = ToolJet.useStyleString({ name: 'dividerColor', label: 'Divider color', inspector: 'color', initialValue: '' });
  const linkColor = ToolJet.useStyleString({ name: 'linkColor', label: 'Link color', inspector: 'color', initialValue: '' });
  const ld = useLoadingLook();
  const { disabled } = ToolJet.useControlState();
  ToolJet.useComponentSettings({ defaultWidth: 14, defaultHeight: 26 });

  const [rootRef, width] = useWidth<HTMLDivElement>();
  const rows = useMemo(() => keyValueItems(data), [data]);
  const inline = layout !== 'stacked';
  // As many columns as fit: an inline pair needs about 300px, a stacked one 160px.
  const fits = width > 0 ? Math.max(1, Math.floor(width / (inline ? 300 : 160))) : 4;
  const count = Math.min(Math.max(1, Math.min(4, Math.floor(Number(columns)) || 1)), fits);
  const lastRowStart = rows.length - (rows.length % count || count);
  const defaults = { currency: currency || 'USD', locale: locale || 'en-US', dateFormat };
  const empty = emptyText === undefined || emptyText === null ? '—' : String(emptyText);
  // A row is an action (onFieldClick, lastClickedField), so it is reachable and activated by keyboard as well as by
  // pointer: one tab stop for the list, arrows between rows, Enter or Space to activate (SP-29). Keys from a link or
  // the copy button inside a row stay theirs. A row holding such a control keeps its list semantics rather than
  // becoming a button around another control.
  const [stop, setStop] = useState(0);
  const tabStop = Math.min(stop, rows.length - 1);
  const live = !disabled && !ld.loading;
  const activate = (row: KeyValueRow) => {
    if (!live) return;
    setLastClickedField({ label: row.label, value: row.value ?? null });
    onFieldClick();
  };
  const onRowKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, row: KeyValueRow) => {
    if (!live || e.target !== e.currentTarget) return;
    if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
      e.preventDefault();
      activate(row);
      return;
    }
    const list = e.currentTarget.parentElement;
    if (list) moveRovingFocus(e, Array.from(list.children).filter((el): el is HTMLElement => el.classList.contains('u2l-kv-row')));
  };
  const vars = styleVars([
    [labelColor, '--lk-label'],
    [valueColor, '--lk-fg'],
    [dividerColor, '--lk-border'],
    [linkColor, '--lk-link'],
  ]);

  return (
    <LoadingFrame loading={ld.loading} minHeight={120} look={ld.skeleton ? <PairsSkel inline={inline} /> : <LoadingBox />}>
      <div ref={rootRef} className="ui u2l-root ui-scroll" style={vars}>
        {rows.length === 0 ? (
          <p className="u2l-kv-none">No details</p>
        ) : (
          <dl className="u2l-kv" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
            {rows.map((row, index) => {
              const shown = keyValueText(row, defaults);
              const holdsControl = (row.type === 'link' && !!linkHref(row)) || (allowCopy === true && !!shown);
              return (
                <div
                  key={row.key}
                  className={cn('u2l-kv-row ui-focus', inline ? 'is-inline' : 'is-stacked', dividers && index < lastRowStart && 'has-divider')}
                  role={holdsControl ? undefined : 'button'}
                  tabIndex={live && index === tabStop ? 0 : -1}
                  onFocus={(e) => {
                    if (e.target === e.currentTarget) setStop(index);
                  }}
                  onKeyDown={(e) => onRowKeyDown(e, row)}
                  onClick={() => activate(row)}
                >
                  <dt className="u2l-kv-label" style={inline ? { width: cssSize(labelWidth, '40%'), flexShrink: 0 } : undefined}>
                    {row.label}
                  </dt>
                  <dd className="u2l-kv-value">
                    <Value row={row} shown={shown} emptyText={empty} badgeColors={badgeColors} />
                    {allowCopy === true && shown ? <CopyButton value={shown} /> : null}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </div>
    </LoadingFrame>
  );
};
