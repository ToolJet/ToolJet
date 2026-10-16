import React, { useState } from 'react';
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
import { FILTER_CONDITIONS } from './tableModel';
import { MUTED } from './TableCells';

const FilterPanel = ({ columns, filters, onApply }) => {
  const filterable = columns.filter((c) => c.visible && c.type !== 'button');
  const [rows, setRows] = useState(() =>
    filters.length ? filters : [{ column: filterable[0]?.key ?? '', condition: 'contains', value: '' }]
  );
  const update = (index, patch) => setRows((all) => all.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  return (
    <div className="flex w-[420px] max-w-[90vw] flex-col gap-2">
      <p className="text-sm font-medium">Filters</p>
      {rows.map((row, index) => (
        <div key={index} className="flex items-center gap-1.5">
          <select
            aria-label="Column"
            value={row.column}
            onChange={(e) => update(index, { column: e.target.value })}
            className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
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
            className="h-8 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
          >
            {FILTER_CONDITIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {['isEmpty', 'isNotEmpty'].includes(row.condition) ? (
            <span className="flex-1" />
          ) : (
            <Input
              aria-label="Value"
              className="h-8 min-w-0 flex-1 px-2"
              value={row.value ?? ''}
              onChange={(e) => update(index, { value: e.target.value })}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 p-0"
            aria-label="Remove filter"
            onClick={() => setRows((all) => all.filter((_, i) => i !== index))}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <div className="flex items-center justify-between pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setRows((all) => [...all, { column: filterable[0]?.key ?? '', condition: 'contains', value: '' }])
          }
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add filter
        </Button>
        <div className="flex gap-1.5">
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

/** The search box and the filter, columns, download and refresh buttons above the table. */
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
}) => (
  <div className="flex flex-wrap items-center gap-2">
    {properties.displaySearchBox !== false ? (
      <div className="relative min-w-[180px] max-w-sm flex-1">
        <Search className={cn('pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2', MUTED)} />
        <Input
          aria-label="Search"
          className="h-9 pl-8 pr-8"
          placeholder={String(properties.searchPlaceholder ?? 'Search…')}
          value={searchInput}
          disabled={isDisabled}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        {searchInput ? (
          <button
            type="button"
            aria-label="Clear search"
            className={cn('absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-muted', MUTED)}
            onClick={() => setSearchInput('')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    ) : (
      <span className="flex-1" />
    )}
    <div className="ml-auto flex items-center gap-2">
      {properties.showFilterButton !== false ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9" disabled={isDisabled}>
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              Filter
              {filters.length ? (
                <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 tabular-nums">
                  {filters.length}
                </Badge>
              ) : null}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto" style={lookVars('ShadTable', styles)}>
            <FilterPanel columns={columns} filters={filters} onApply={(list) => applyFilterList(list)} />
          </PopoverContent>
        </Popover>
      ) : null}
      {properties.hideColumnSelectorButton !== true ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9" disabled={isDisabled}>
              <Columns3 className="mr-1.5 h-3.5 w-3.5" />
              Columns
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-52 p-2" style={lookVars('ShadTable', styles)}>
            {columns
              .filter((c) => c.visible)
              .map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
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
                  <span className="truncate">{c.name}</span>
                </label>
              ))}
          </PopoverContent>
        </Popover>
      ) : null}
      {properties.showDownloadButton === true ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9" aria-label="Download" disabled={isDisabled}>
              <Download className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-40 p-1" style={lookVars('ShadTable', styles)}>
            {[
              ['csv', 'Download CSV'],
              ['json', 'Download JSON'],
            ].map(([type, label]) => (
              <button
                key={type}
                type="button"
                className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
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
          className="h-9"
          aria-label="Refresh"
          disabled={isDisabled}
          onClick={() => fireEvent('onRefresh')}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
      ) : null}
    </div>
  </div>
);
