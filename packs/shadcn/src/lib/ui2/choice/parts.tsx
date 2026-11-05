import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, Search, X } from 'lucide-react';
import { iconFor } from '../../icons';
import { cn } from '../../cn';
import {
  MAX_SHOWN_OPTIONS,
  filterOptions,
  groupOptions,
  isScalar,
  type ChoiceOption,
} from './options';
import '../../../styles/ui2-choice.css';

// The pieces UI 2.0's pickers share (Ui2/_pickers/pickerParts.tsx), drawn with the pack's CSS: an option's icon, the x
// that clears a field, a chip, and the searchable options list of the Combobox and Multiselect (cmdk there, a listbox
// with the same keys here).

/** An option's icon: a lucide or Tabler name (IconUser), an image URL, or text such as an emoji. */
export const OptionIcon = ({ icon }: { icon: unknown }) => {
  if (typeof icon !== 'string' || !icon.trim()) return null;
  if (/^(https?:|data:image\/|\/)/.test(icon)) return <img src={icon} alt="" className="uc-option-img" />;
  const Icon = iconFor(icon);
  if (Icon) return <Icon className="uc-option-icon" strokeWidth={1.75} aria-hidden="true" />;
  // A name that is no icon is not shown as text: only short text such as an emoji is.
  if (/^Icon[A-Z0-9]/.test(icon) || /^[A-Za-z][A-Za-z0-9-]{3,}$/.test(icon)) return null;
  return (
    <span aria-hidden="true" className="uc-option-emoji">
      {icon.slice(0, 4)}
    </span>
  );
};

/** Keeps a press on a control inside a trigger from opening or closing the trigger's popup. */
const stopPress = (e: React.SyntheticEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

/** The x that empties a field: a round 20px button named Clear. */
export const ClearX = ({ onClear, label = 'Clear', className }: { onClear: () => void; label?: string; className?: string }) => (
  <button
    type="button"
    aria-label={label}
    className={cn('uc-clear', className)}
    onPointerDown={stopPress}
    onClick={(e) => {
      e.stopPropagation();
      onClear();
    }}
  >
    <X size={14} aria-hidden="true" />
  </button>
);

export const Chip = ({ label, onRemove, removeLabel }: { label: ReactNode; onRemove?: () => void; removeLabel?: string }) => (
  <span className={cn('uc-chip', onRemove && 'has-remove')}>
    <span className="uc-chip-text">{label}</span>
    {onRemove ? (
      <button
        type="button"
        aria-label={removeLabel}
        className="uc-chip-remove"
        onPointerDown={stopPress}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <X size={12} aria-hidden="true" />
      </button>
    ) : null}
  </span>
);

export const Spinner = () => <span className="uc-spinner" aria-label="Loading" role="status" />;

/** A row of the menu that is not an option: Select all, Clear selection. */
export interface MenuCommand {
  key: string;
  label: string;
  onSelect: () => void;
  /** Select all's box: checked, or not; undefined draws no box. */
  checked?: boolean;
  center?: boolean;
}

export interface OptionsMenuProps {
  options: ChoiceOption[];
  search: string;
  onSearch: (text: string) => void;
  showSearch: boolean;
  searchPlaceholder: string;
  emptyText: string;
  loading: boolean;
  serverSideSearch: boolean;
  isSelected: (o: ChoiceOption) => boolean;
  isDisabled: (o: ChoiceOption, selected: boolean) => boolean;
  onPick: (o: ChoiceOption) => void;
  multiple?: boolean;
  top?: MenuCommand[];
  bottom?: MenuCommand[];
  /** A line over the bottom commands ("2 of 3 selected"). */
  bottomNote?: string;
  id?: string;
}

type Row = { key: string; disabled: boolean; run: () => void };

/** The options list: search box, grouped options (filtered here unless the app filters them server-side), an empty or
 *  loading state, and commands before and after. Arrow keys, Home and End move the highlight, Enter picks. */
export const OptionsMenu = ({
  options,
  search,
  onSearch,
  showSearch,
  searchPlaceholder,
  emptyText,
  loading,
  serverSideSearch,
  isSelected,
  isDisabled,
  onPick,
  multiple,
  top = [],
  bottom = [],
  bottomNote,
  id,
}: OptionsMenuProps) => {
  const entries = serverSideSearch ? options.map((option, index) => ({ option, index })) : filterOptions(options, search);
  const groups = groupOptions(entries.slice(0, MAX_SHOWN_OPTIONS));
  const more = entries.length - MAX_SHOWN_OPTIONS;
  const showCommands = !loading && entries.length > 0;
  // Every row the keyboard walks, in drawn order.
  const rows: Row[] = [
    ...(showCommands ? top.map((c) => ({ key: c.key, disabled: false, run: c.onSelect })) : []),
    ...(loading
      ? []
      : groups.flatMap((g) =>
          g.items.map(({ option, index }) => ({
            key: `o${index}`,
            disabled: isDisabled(option, isSelected(option)),
            run: () => onPick(option),
          }))
        )),
    ...(showCommands ? bottom.map((c) => ({ key: c.key, disabled: false, run: c.onSelect })) : []),
  ];
  const firstEnabled = rows.find((r) => !r.disabled)?.key ?? null;
  const [active, setActive] = useState<string | null>(firstEnabled);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // A new search starts on the first match.
  useEffect(() => setActive(firstEnabled), [search, loading]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    (showSearch ? searchRef.current : listRef.current)?.focus();
  }, [showSearch]);
  useEffect(() => {
    if (!active) return;
    listRef.current?.querySelector<HTMLElement>(`[data-row="${active}"]`)?.scrollIntoView?.({ block: 'nearest' });
  }, [active]);

  const move = (dir: number | 'first' | 'last') => {
    const enabled = rows.filter((r) => !r.disabled);
    if (!enabled.length) return;
    const at = enabled.findIndex((r) => r.key === active);
    const next =
      dir === 'first'
        ? 0
        : dir === 'last'
          ? enabled.length - 1
          : at === -1
            ? 0
            : (at + dir + enabled.length) % enabled.length;
    setActive(enabled[next].key);
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'ArrowDown') move(1);
    else if (e.key === 'ArrowUp') move(-1);
    else if (e.key === 'Home' && !showSearch) move('first');
    else if (e.key === 'End' && !showSearch) move('last');
    else if (e.key === 'Enter') rows.find((r) => r.key === active && !r.disabled)?.run();
    else return;
    e.preventDefault();
  };

  const command = (c: MenuCommand) => (
    <div
      key={c.key}
      role="option"
      aria-selected={c.checked ?? false}
      data-row={c.key}
      data-active={active === c.key || undefined}
      className={cn('uc-item', c.center && 'is-center')}
      onPointerMove={() => setActive(c.key)}
      onClick={c.onSelect}
    >
      {c.checked !== undefined ? (
        <span className={cn('uc-box', c.checked && 'is-on')}>{c.checked ? <Check size={12} strokeWidth={3} /> : null}</span>
      ) : null}
      <span className={cn(c.checked !== undefined && 'uc-strong')}>{c.label}</span>
    </div>
  );

  return (
    <div className="uc-command" onKeyDown={onKeyDown}>
      {showSearch ? (
        <div className="uc-search">
          <Search size={16} className="uc-search-icon" aria-hidden="true" />
          <input
            ref={searchRef}
            className="uc-search-input"
            value={search}
            placeholder={searchPlaceholder}
            onChange={(e) => onSearch(e.target.value)}
            role="combobox"
            aria-expanded="true"
            aria-controls={id ? `${id}-list` : undefined}
            aria-activedescendant={active && id ? `${id}-${active}` : undefined}
          />
        </div>
      ) : null}
      <div
        ref={listRef}
        id={id ? `${id}-list` : undefined}
        className="uc-list"
        role="listbox"
        aria-multiselectable={multiple || undefined}
        tabIndex={showSearch ? -1 : 0}
      >
        {loading ? (
          <div className="uc-empty">
            <Spinner />
          </div>
        ) : entries.length === 0 ? (
          <div className="uc-empty">{emptyText}</div>
        ) : (
          <>
            {top.length ? <div className="uc-group">{top.map(command)}</div> : null}
            {groups.map((g, gi) => (
              <div key={`g${gi}`} className="uc-group" role="group" aria-label={g.heading || undefined}>
                {g.heading ? <div className="uc-group-heading">{g.heading}</div> : null}
                {g.items.map(({ option, index }) => {
                  const on = isSelected(option);
                  const off = isDisabled(option, on);
                  const key = `o${index}`;
                  return (
                    <div
                      key={key}
                      id={id ? `${id}-${key}` : undefined}
                      role="option"
                      aria-selected={on}
                      aria-disabled={off || undefined}
                      data-row={key}
                      data-active={active === key || undefined}
                      data-disabled={off || undefined}
                      className="uc-item"
                      onPointerMove={() => !off && setActive(key)}
                      onClick={() => !off && onPick(option)}
                    >
                      {multiple ? (
                        <span className={cn('uc-box', on && 'is-on')}>{on ? <Check size={12} strokeWidth={3} /> : null}</span>
                      ) : null}
                      <OptionIcon icon={option.icon} />
                      <span className="uc-item-text">
                        <span className="uc-truncate">{option.label}</span>
                        {isScalar(option.description) && String(option.description) ? (
                          <span className="uc-item-description uc-truncate">{String(option.description)}</span>
                        ) : null}
                      </span>
                      {!multiple ? <Check size={16} className={cn('uc-item-check', on && 'is-on')} aria-hidden="true" /> : null}
                    </div>
                  );
                })}
              </div>
            ))}
            {more > 0 ? <div className="uc-more">{`${more} more. Type to narrow the list.`}</div> : null}
            {bottom.length || bottomNote ? (
              <>
                <div className="uc-rule" aria-hidden="true" />
                <div className="uc-group">
                  {bottomNote ? <div className="uc-note">{bottomNote}</div> : null}
                  {bottom.map(command)}
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
