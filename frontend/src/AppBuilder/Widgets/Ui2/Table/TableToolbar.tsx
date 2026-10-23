import React, { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Columns3, Download, Filter, Plus, RefreshCw, Search, Trash2, X } from 'lucide-react';
import {
  Badge,
  Button,
  Checkbox,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  cn,
} from '@/AppBuilder/Widgets/Ui2/_shared/ui';
import { lookVars } from '@/AppBuilder/Widgets/Ui2/_shared/looks/shadcnLook';
import type { Resolved, WidgetProps } from '@/AppBuilder/Widgets/Ui2/_shared/types';
import { FILTER_CONDITIONS } from './tableModel';
import type { TableColumn, TableFilter } from './types';
import { MUTED } from './TableCells';
import type { DownloadType } from './useTableActions';

interface FilterPanelProps {
  columns: TableColumn[];
  filters: TableFilter[];
  onApply: (list: TableFilter[]) => void;
}

const FilterPanel = ({ columns, filters, onApply }: FilterPanelProps) => {
  const filterable = columns.filter((c) => c.visible && c.type !== 'button');
  const [rows, setRows] = useState<TableFilter[]>(() =>
    filters.length ? filters : [{ column: filterable[0]?.key ?? '', condition: 'contains', value: '' }]
  );
  const update = (index: number, patch: Partial<TableFilter>) =>
    setRows((all) => all.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  return (
    <div className="tw-flex tw-w-[420px] tw-max-w-[90vw] tw-flex-col tw-gap-2">
      <p className="tw-text-ui2-sm tw-font-medium">Filters</p>
      {rows.map((row, index) => (
        <div key={index} className="tw-flex tw-items-center tw-gap-1.5">
          <select
            aria-label="Column"
            value={row.column}
            onChange={(e) => update(index, { column: e.target.value })}
            className="tw-h-8 tw-min-w-0 tw-flex-1 tw-rounded-ui2-md tw-border tw-border-ui2-input tw-bg-ui2-background tw-px-2 tw-text-ui2-sm"
          >
            {filterable.map((c) => (
              <option key={c.id} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Condition"
            value={row.condition}
            onChange={(e) => update(index, { condition: e.target.value })}
            className="tw-h-8 tw-min-w-0 tw-flex-1 tw-rounded-ui2-md tw-border tw-border-ui2-input tw-bg-ui2-background tw-px-2 tw-text-ui2-sm"
          >
            {FILTER_CONDITIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {['isEmpty', 'isNotEmpty'].includes(row.condition) ? (
            <span className="tw-flex-1" />
          ) : (
            <Input
              aria-label="Value"
              className="tw-h-8 tw-min-w-0 tw-flex-1 tw-px-2"
              value={String(row.value ?? '')}
              onChange={(e) => update(index, { value: e.target.value })}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="tw-h-8 tw-w-8 tw-shrink-0 tw-p-0"
            aria-label="Remove filter"
            onClick={() => setRows((all) => all.filter((_, i) => i !== index))}
          >
            <Trash2 className="tw-h-3.5 tw-w-3.5" />
          </Button>
        </div>
      ))}
      <div className="tw-flex tw-items-center tw-justify-between tw-pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setRows((all) => [...all, { column: filterable[0]?.key ?? '', condition: 'contains', value: '' }])
          }
        >
          <Plus className="tw-mr-1 tw-h-3.5 tw-w-3.5" />
          Add filter
        </Button>
        <div className="tw-flex tw-gap-1.5">
          <Button variant="outline" size="sm" onClick={() => onApply([])}>
            Clear
          </Button>
          <Button size="sm" onClick={() => onApply(rows)}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
};

interface TableToolbarProps {
  properties: Resolved;
  styles: Resolved;
  isDisabled: boolean;
  searchInput: string;
  setSearchInput: (text: string) => void;
  filters: TableFilter[];
  columns: TableColumn[];
  applyFilterList: (list: unknown) => void;
  hiddenIds: Set<string>;
  setHiddenIds: Dispatch<SetStateAction<Set<string>>>;
  runDownload: (type: DownloadType) => void;
  fireEvent: WidgetProps['fireEvent'];
}

/** The search box and the filter, columns, download and refresh buttons above the table. */
/** Whether the table draws its toolbar: search, filter and columns show unless turned off; download and refresh only
 *  when turned on. */
export const hasToolbar = (properties: Resolved): boolean =>
  properties.displaySearchBox !== false ||
  properties.showFilterButton !== false ||
  properties.hideColumnSelectorButton !== true ||
  properties.showDownloadButton === true ||
  properties.showRefreshButton === true;

export const TableToolbar = ({
  properties,
  styles,
  isDisabled,
  searchInput,
  setSearchInput,
  filters,
  columns,
  applyFilterList,
  hiddenIds,
  setHiddenIds,
  runDownload,
  fireEvent,
}: TableToolbarProps) => (
  <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
    {properties.displaySearchBox !== false ? (
      <div className="tw-relative tw-min-w-[180px] tw-max-w-sm tw-flex-1">
        <Search
          className={cn(
            'tw-pointer-events-none tw-absolute tw-left-2.5 tw-top-1/2 tw-h-4 tw-w-4 -tw-translate-y-1/2',
            MUTED
          )}
        />
        <Input
          aria-label="Search"
          className="tw-h-9 tw-pl-8 tw-pr-8"
          placeholder={String(properties.searchPlaceholder ?? 'Search…')}
          value={searchInput}
          disabled={isDisabled}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {searchInput ? (
          <button
            type="button"
            aria-label="Clear search"
            className={cn(
              'tw-absolute tw-right-2 tw-top-1/2 -tw-translate-y-1/2 tw-rounded tw-p-0.5 hover:tw-bg-ui2-muted',
              MUTED
            )}
            onClick={() => setSearchInput('')}
          >
            <X className="tw-h-3.5 tw-w-3.5" />
          </button>
        ) : null}
      </div>
    ) : (
      <span className="tw-flex-1" />
    )}
    <div className="tw-ml-auto tw-flex tw-items-center tw-gap-2">
      {properties.showFilterButton !== false ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="tw-h-9" disabled={isDisabled}>
              <Filter className="tw-mr-1.5 tw-h-3.5 tw-w-3.5" />
              Filter
              {filters.length ? (
                <Badge variant="secondary" className="tw-ml-1.5 tw-h-5 tw-px-1.5 tw-tabular-nums">
                  {filters.length}
                </Badge>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent aria-label="Filters" align="end" className="tw-w-auto" style={lookVars('ShadTable', styles)}>
            <FilterPanel columns={columns} filters={filters} onApply={(list) => applyFilterList(list)} />
          </PopoverContent>
        </Popover>
      ) : null}
      {properties.hideColumnSelectorButton !== true ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="tw-h-9" disabled={isDisabled}>
              <Columns3 className="tw-mr-1.5 tw-h-3.5 tw-w-3.5" />
              Columns
            </Button>
          </PopoverTrigger>
          <PopoverContent
            aria-label="Columns"
            align="end"
            className="tw-w-52 tw-p-2"
            style={lookVars('ShadTable', styles)}
          >
            {columns
              .filter((c) => c.visible)
              .map((c) => (
                <label
                  key={c.id}
                  className="tw-flex tw-cursor-pointer tw-items-center tw-gap-2 tw-rounded-ui2-md tw-px-2 tw-py-1.5 tw-text-ui2-sm hover:tw-bg-ui2-muted"
                >
                  <Checkbox
                    checked={!hiddenIds.has(c.id)}
                    onCheckedChange={(checked) =>
                      setHiddenIds((all) => {
                        const next = new Set(all);
                        if (checked) next.delete(c.id);
                        else next.add(c.id);
                        return next;
                      })
                    }
                  />
                  <span className="tw-truncate">{c.name}</span>
                </label>
              ))}
          </PopoverContent>
        </Popover>
      ) : null}
      {properties.showDownloadButton === true ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="tw-h-9" aria-label="Download" disabled={isDisabled}>
              <Download className="tw-h-3.5 tw-w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            aria-label="Download"
            align="end"
            className="tw-w-40 tw-p-1"
            style={lookVars('ShadTable', styles)}
          >
            {(
              [
                ['csv', 'Download CSV'],
                ['json', 'Download JSON'],
              ] as const
            ).map(([type, label]) => (
              <button
                key={type}
                type="button"
                className="tw-w-full tw-rounded-ui2-md tw-px-2 tw-py-1.5 tw-text-left tw-text-ui2-sm hover:tw-bg-ui2-muted"
                onClick={() => {
                  runDownload(type);
                  // The native Table's event for a download from its toolbar.
                  fireEvent('onTableDataDownload');
                }}
              >
                {label}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      ) : null}
      {properties.showRefreshButton === true ? (
        <Button
          variant="outline"
          size="sm"
          className="tw-h-9"
          aria-label="Refresh"
          disabled={isDisabled}
          onClick={() => fireEvent('onRefresh')}
        >
          <RefreshCw className="tw-h-3.5 tw-w-3.5" />
        </Button>
      ) : null}
    </div>
  </div>
);
