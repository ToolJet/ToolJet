import React, { useState } from 'react';
import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from 'react';
import * as Popover from '@radix-ui/react-popover';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Columns3, Download, Filter, Minus, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import { usePortalContainer } from '../../usePortalContainer';
import { FILTER_CONDITIONS, NO_VALUE } from './model';
import type { TableColumn, TableFilter } from './model';

/** The pack's checkbox (Radix), with the indeterminate state the select-all box needs. */
export const TableCheckbox = ({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean | 'indeterminate';
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) => (
  <CheckboxPrimitive.Root
    className="ui-checkbox ui-focus t2-checkbox"
    aria-label={label}
    checked={checked}
    disabled={disabled}
    onCheckedChange={onChange}
    onClick={(e) => e.stopPropagation()}
  >
    <CheckboxPrimitive.Indicator>{checked === 'indeterminate' ? <Minus strokeWidth={3} /> : <Check strokeWidth={3} />}</CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
);

const ToolbarPopover = ({
  trigger,
  children,
  container,
  vars,
  label,
  className,
}: {
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  container: HTMLElement | null;
  vars: CSSProperties;
  label: string;
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      {container ? (
        <Popover.Portal container={container}>
          <Popover.Content aria-label={label} align="end" sideOffset={6} className={`ui-popup ui-menu t2-popover ${className ?? ''}`} style={vars}>
            {children(() => setOpen(false))}
          </Popover.Content>
        </Popover.Portal>
      ) : null}
    </Popover.Root>
  );
};

const FilterPanel = ({
  columns,
  filters,
  onApply,
}: {
  columns: TableColumn[];
  filters: TableFilter[];
  onApply: (list: TableFilter[]) => void;
}) => {
  const filterable = columns.filter((c) => c.visible && c.type !== 'button');
  const blank = (): TableFilter => ({ column: filterable[0]?.key ?? '', condition: 'contains', value: '' });
  const [rows, setRows] = useState<TableFilter[]>(() => (filters.length ? filters : [blank()]));
  const update = (index: number, patch: Partial<TableFilter>) =>
    setRows((all) => all.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  return (
    <div className="t2-filter-panel">
      <p className="t2-popover-title">Filters</p>
      {rows.map((row, index) => (
        <div key={index} className="t2-filter-row">
          <select aria-label="Column" className="t2-select" value={row.column} onChange={(e) => update(index, { column: e.target.value })}>
            {filterable.map((c) => (
              <option key={c.id} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
          <select aria-label="Condition" className="t2-select" value={row.condition} onChange={(e) => update(index, { condition: e.target.value })}>
            {FILTER_CONDITIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {NO_VALUE.has(row.condition) ? (
            <span className="t2-filter-spacer" />
          ) : (
            <input
              aria-label="Value"
              className="ui-input t2-filter-value"
              value={String(row.value ?? '')}
              onChange={(e) => update(index, { value: e.target.value })}
            />
          )}
          <button
            type="button"
            className="ui-btn ui-btn--ghost ui-btn--sm t2-square"
            aria-label="Remove filter"
            onClick={() => setRows((all) => all.filter((_, i) => i !== index))}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <div className="t2-filter-foot">
        <button type="button" className="ui-btn ui-btn--ghost ui-btn--sm t2-auto" onClick={() => setRows((all) => [...all, blank()])}>
          <Plus size={14} />
          Add filter
        </button>
        <div className="t2-row-gap">
          <button type="button" className="ui-btn ui-btn--outline ui-btn--sm t2-auto" onClick={() => onApply([])}>
            Clear
          </button>
          <button type="button" className="ui-btn ui-btn--default ui-btn--sm t2-auto" onClick={() => onApply(rows)}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export interface ToolbarProps {
  displaySearchBox: boolean;
  searchPlaceholder: string;
  showFilterButton: boolean;
  showColumnSelector: boolean;
  showDownloadButton: boolean;
  showRefreshButton: boolean;
  disabled: boolean;
  searchInput: string;
  setSearchInput: (text: string) => void;
  filters: TableFilter[];
  columns: TableColumn[];
  applyFilterList: (list: unknown) => void;
  hiddenIds: Set<string>;
  setHiddenIds: Dispatch<SetStateAction<Set<string>>>;
  onDownload: (type: 'csv' | 'json') => void;
  onRefresh: () => void;
  vars: CSSProperties;
}

/** The search box and the filter, columns, download and refresh buttons above the table. */
export const Toolbar = (p: ToolbarProps) => {
  const [anchorRef, container] = usePortalContainer();
  return (
    <div className="t2-toolbar" ref={anchorRef}>
      {p.displaySearchBox ? (
        <div className="t2-search">
          <Search size={16} className="t2-search-icon" />
          <input
            aria-label="Search"
            className="ui-input t2-search-input"
            placeholder={p.searchPlaceholder}
            value={p.searchInput}
            disabled={p.disabled}
            onChange={(e) => p.setSearchInput(e.target.value)}
          />
          {p.searchInput ? (
            <button type="button" aria-label="Clear search" className="t2-search-clear" onClick={() => p.setSearchInput('')}>
              <X size={14} />
            </button>
          ) : null}
        </div>
      ) : (
        <span className="t2-grow" />
      )}
      <div className="t2-tools">
        {p.showFilterButton ? (
          <ToolbarPopover
            label="Filters"
            container={container}
            vars={p.vars}
            className="t2-popover--filters"
            trigger={
              <button type="button" className="ui-btn ui-btn--outline ui-btn--sm t2-tool" disabled={p.disabled}>
                <Filter size={14} />
                Filter
                {p.filters.length ? <span className="t2-count">{p.filters.length}</span> : null}
              </button>
            }
          >
            {(close) => (
              <FilterPanel
                columns={p.columns}
                filters={p.filters}
                onApply={(list) => {
                  p.applyFilterList(list);
                  close();
                }}
              />
            )}
          </ToolbarPopover>
        ) : null}
        {p.showColumnSelector ? (
          <ToolbarPopover
            label="Columns"
            container={container}
            vars={p.vars}
            className="t2-popover--columns"
            trigger={
              <button type="button" className="ui-btn ui-btn--outline ui-btn--sm t2-tool" disabled={p.disabled}>
                <Columns3 size={14} />
                Columns
              </button>
            }
          >
            {() =>
              p.columns
                .filter((c) => c.visible)
                .map((c) => (
                  <label key={c.id} className="t2-menu-check">
                    <TableCheckbox
                      label={c.name}
                      checked={p.hiddenIds.has(c.id) === c.hiddenByDefault}
                      onChange={() =>
                        p.setHiddenIds((all) => {
                          const next = new Set(all);
                          if (next.has(c.id)) next.delete(c.id);
                          else next.add(c.id);
                          return next;
                        })
                      }
                    />
                    <span className="t2-truncate">{c.name}</span>
                  </label>
                ))
            }
          </ToolbarPopover>
        ) : null}
        {p.showDownloadButton ? (
          <ToolbarPopover
            label="Download"
            container={container}
            vars={p.vars}
            className="t2-popover--download"
            trigger={
              <button type="button" className="ui-btn ui-btn--outline ui-btn--sm t2-tool t2-square" aria-label="Download" disabled={p.disabled}>
                <Download size={14} />
              </button>
            }
          >
            {(close) =>
              (
                [
                  ['csv', 'Download CSV'],
                  ['json', 'Download JSON'],
                ] as const
              ).map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  className="ui-menu-item ui-menu-item--plain ui-menu-item--button"
                  onClick={() => {
                    p.onDownload(type);
                    close();
                  }}
                >
                  {label}
                </button>
              ))
            }
          </ToolbarPopover>
        ) : null}
        {p.showRefreshButton ? (
          <button
            type="button"
            className="ui-btn ui-btn--outline ui-btn--sm t2-tool t2-square"
            aria-label="Refresh"
            disabled={p.disabled}
            onClick={p.onRefresh}
          >
            <RefreshCw size={14} />
          </button>
        ) : null}
      </div>
    </div>
  );
};
