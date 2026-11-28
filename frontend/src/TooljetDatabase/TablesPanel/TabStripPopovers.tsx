import React, { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Plus, Table, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchInput } from '@/components/ui/Rocket/SearchInput/SearchInput';
import { ROCKET_SCROLLBAR } from '@/components/ui/Rocket/scrollbar';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';
import type { TjdbTable } from '../TooljetDatabaseContext';

// Both popovers are 288px, with the divider full-bleed and every other section padded 8px.
export const TAB_STRIP_POPOVER_CLASS = 'tw-w-72 tw-gap-0 tw-p-0';

interface PickerRowProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  selected?: boolean;
}

function PickerRow({ icon, selected = false, className, children, ...props }: PickerRowProps) {
  return (
    <button
      type="button"
      className={cn(
        'tw-flex tw-h-8 tw-w-full tw-shrink-0 tw-cursor-pointer tw-items-center tw-gap-1.5 tw-rounded-default tw-px-2',
        'tw-border-0 tw-text-left tw-font-body-default tw-text-text-default tw-outline-none',
        selected ? 'tw-bg-interactive-selected' : 'tw-bg-transparent hover:tw-bg-interactive-hover',
        'focus-visible:tw-ring-2 focus-visible:tw-ring-interactive-focus-outline',
        'disabled:tw-cursor-not-allowed disabled:tw-opacity-50',
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="tw-flex tw-size-4 tw-shrink-0 tw-items-center tw-justify-center tw-text-icon-default"
      >
        {icon}
      </span>
      <TruncatedText as="span" content={children} className="tw-min-w-0 tw-flex-1">
        {children}
      </TruncatedText>
    </button>
  );
}

function Divider() {
  return <div className="tw-h-px tw-w-full tw-shrink-0 tw-bg-border-weak" />;
}

export interface TablePickerProps {
  tables: TjdbTable[];
  /** The table showing now, marked in the list. */
  selectedId?: string;
  onPick: (table: TjdbTable) => void;
  onCreate: () => void;
  createDisabled?: boolean;
  /** Why creating is unavailable, when something other than a permission is the reason. */
  createTooltip?: string;
}

// Open or create a table: a searchable list of every table, with "Create new table" under it.
export function TablePicker({ tables, selectedId, onPick, onCreate, createDisabled, createTooltip }: TablePickerProps) {
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();
  const visible = needle ? tables.filter((table) => table.table_name.toLowerCase().includes(needle)) : tables;
  return (
    <>
      <div className="tw-flex tw-flex-col tw-gap-2 tw-p-2">
        <SearchInput
          aria-label="Search tables"
          placeholder="Search tables"
          value={query}
          onValueChange={setQuery}
          autoFocus
          data-cy="tab-picker-search"
        />
        <div
          className={cn('tw-flex tw-max-h-[264px] tw-flex-col tw-overflow-y-auto', ROCKET_SCROLLBAR)}
          data-cy="tab-picker-list"
        >
          {visible.map((table) => (
            <PickerRow
              key={table.id}
              icon={<Table />}
              selected={table.id === selectedId}
              onClick={() => onPick(table)}
              data-cy={`tab-picker-${table.table_name}`}
            >
              {table.table_name}
            </PickerRow>
          ))}
          {needle && visible.length === 0 && (
            <p className="tw-m-0 tw-px-2 tw-py-1.5 tw-font-body-default tw-text-text-placeholder">
              {`No tables match "${query.trim()}"`}
            </p>
          )}
        </div>
      </div>
      <Divider />
      <div className="tw-p-2">
        <Tooltip content={createTooltip} isTooltipForInteractiveDisabledElement>
          <PickerRow icon={<Plus />} disabled={createDisabled} onClick={onCreate} data-cy="tab-picker-create-table">
            Create new table
          </PickerRow>
        </Tooltip>
      </div>
    </>
  );
}

export interface OpenTabsListProps {
  tabs: TjdbTable[];
  activeId?: string;
  onPick: (table: TjdbTable) => void;
  onCloseOthers: () => void;
  onCloseAll: () => void;
}

// What is open, and the two bulk closes. "Close other tabs" has nothing to do with a single tab.
export function OpenTabsList({ tabs, activeId, onPick, onCloseOthers, onCloseAll }: OpenTabsListProps) {
  return (
    <>
      <div className="tw-flex tw-flex-col tw-gap-2 tw-p-2">
        <div className="tw-flex tw-items-center tw-gap-1 tw-px-2 tw-pt-1 tw-text-text-placeholder">
          <span className="tw-font-title-section-title tw-uppercase">Open tabs</span>
          <span className="tw-font-body-small">{tabs.length}</span>
        </div>
        <div
          className={cn('tw-flex tw-max-h-[264px] tw-flex-col tw-overflow-y-auto', ROCKET_SCROLLBAR)}
          data-cy="open-tabs-list"
        >
          {tabs.map((table) => (
            <PickerRow
              key={table.id}
              icon={<Table />}
              selected={table.id === activeId}
              onClick={() => onPick(table)}
              data-cy={`open-tabs-${table.table_name}`}
            >
              {table.table_name}
            </PickerRow>
          ))}
        </div>
      </div>
      <Divider />
      <div className="tw-flex tw-flex-col tw-gap-2 tw-p-2">
        <PickerRow icon={<X />} disabled={tabs.length < 2} onClick={onCloseOthers} data-cy="close-other-tabs">
          Close other tabs
        </PickerRow>
        <PickerRow icon={<X />} onClick={onCloseAll} data-cy="close-all-tabs">
          Close all tabs
        </PickerRow>
      </div>
    </>
  );
}
