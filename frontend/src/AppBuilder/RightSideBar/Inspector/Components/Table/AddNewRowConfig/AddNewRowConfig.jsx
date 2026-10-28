import React, { useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Search, Settings, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Rocket/Popover/Popover';
import { Checkbox } from '@/components/ui/Checkbox/Checkbox';
import { Switch } from '@/components/ui/Switch/Switch';
import { getAddNewRowColumns, getColumnKey } from '@/AppBuilder/Widgets/NewTable/_utils/addNewRowConfig';

const PLACEMENTS = [
  { label: 'Table', value: 'table' },
  { label: 'Dialog', value: 'dialog' },
];

const DASHED_LINE = 'tw-flex-1 tw-border-0 tw-border-t tw-border-dashed tw-border-border-default';

const SectionTitle = ({ children }) => (
  <div className="tw-flex tw-h-5 tw-items-center tw-gap-3">
    <div className={DASHED_LINE} />
    <span className="tw-font-body-default tw-text-text-placeholder">{children}</span>
    <div className={DASHED_LINE} />
  </div>
);

const CheckboxRow = ({ label, ...checkboxProps }) => (
  <label className="tw-m-0 tw-flex tw-h-[18px] tw-cursor-pointer tw-items-center tw-gap-2 tw-font-body-default tw-text-text-default">
    <Checkbox aria-label={label} {...checkboxProps} />
    {label}
  </label>
);

export const AddNewRowConfig = ({
  addNewRowIn,
  allowAddingMultipleRows,
  columns,
  selectedColumns,
  onChange,
  darkMode = false,
}) => {
  const [search, setSearch] = useState('');

  const eligibleColumns = getAddNewRowColumns(columns, null);
  const allKeys = eligibleColumns.map(getColumnKey);
  const selectedKeys = Array.isArray(selectedColumns)
    ? allKeys.filter((key) => selectedColumns.includes(key))
    : allKeys;
  const allSelected = selectedKeys.length === allKeys.length;
  const visibleColumns = eligibleColumns.filter((column) =>
    String(column.name ?? '')
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  // Every column ticked is stored as "unset", so columns added later are included without re-ticking.
  const changeSelection = (keys) => onChange('addNewRowColumns', keys.length === allKeys.length ? null : keys);

  const toggleColumn = (key) =>
    changeSelection(
      allKeys.filter((candidate) =>
        candidate === key ? !selectedKeys.includes(key) : selectedKeys.includes(candidate)
      )
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Configure add new row"
          data-cy="add-new-row-config-button"
          className="tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-icon-default hover:tw-bg-interactive-hover data-[state=open]:tw-bg-interactive-hover"
        >
          <Settings size={16} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="left"
        align="start"
        sideOffset={8}
        collisionPadding={8}
        data-cy="add-new-row-config-popover"
        // same layer as the other inspector popovers; below it the properties panel covers this one
        className={cn('tw-z-[1042] tw-w-[303px] tw-gap-0 tw-overflow-hidden tw-p-0', darkMode && 'dark-theme')}
      >
        <div className="tw-flex tw-h-11 tw-shrink-0 tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-px-4">
          <span className="tw-font-title-default tw-text-text-default">Configure add new row</span>
          <PopoverPrimitive.Close asChild>
            <button
              type="button"
              aria-label="Close"
              className="tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-icon-default hover:tw-bg-interactive-hover"
            >
              <X size={16} />
            </button>
          </PopoverPrimitive.Close>
        </div>

        <div className="tw-flex tw-flex-col tw-gap-3 tw-p-4">
          <div className="tw-flex tw-h-8 tw-items-center tw-justify-between">
            <span className="tw-font-body-default tw-text-text-default">Add new row in</span>
            <div
              role="radiogroup"
              aria-label="Add new row in"
              className="tw-flex tw-items-center tw-gap-0.5 tw-rounded-lg tw-bg-background-surface-layer-02 tw-p-0.5"
            >
              {PLACEMENTS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={addNewRowIn === value}
                  onClick={() => addNewRowIn !== value && onChange('addNewRowIn', value)}
                  className={cn(
                    'tw-h-7 tw-rounded-md tw-border-0 tw-px-3 tw-font-body-default',
                    addNewRowIn === value
                      ? 'tw-bg-background-surface-layer-01 tw-font-title-default tw-text-text-default tw-shadow-elevation-100'
                      : 'tw-bg-transparent tw-text-text-placeholder'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="tw-flex tw-h-[18px] tw-items-center tw-justify-between">
            <span className="tw-font-body-default tw-text-text-default">Allow adding multiple rows</span>
            <Switch
              aria-label="Allow adding multiple rows"
              checked={!!allowAddingMultipleRows}
              onCheckedChange={(checked) => onChange('allowAddingMultipleRows', `{{${checked}}}`)}
            />
          </div>

          <SectionTitle>Columns to include</SectionTitle>

          <div className="tw-relative">
            <Search
              size={16}
              className="tw-pointer-events-none tw-absolute tw-left-2.5 tw-top-2 tw-text-icon-default"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search columns"
              aria-label="Search columns"
              className="tw-h-8 tw-w-full tw-rounded-md tw-border tw-border-solid tw-border-border-default tw-bg-background-surface-layer-01 tw-pl-8 tw-pr-2.5 tw-font-body-default tw-text-text-default placeholder:tw-text-text-placeholder"
            />
          </div>

          <div className="tw-flex tw-max-h-[300px] tw-flex-col tw-gap-3 tw-overflow-y-auto">
            <div className="tw-sticky tw-top-0 tw-z-[1] tw-flex tw-flex-col tw-gap-3 tw-bg-background-surface-layer-01 tw-pb-3">
              <CheckboxRow
                label="Select all"
                checked={allSelected ? true : selectedKeys.length > 0 ? 'indeterminate' : false}
                intermediate={!allSelected && selectedKeys.length > 0}
                onCheckedChange={() => changeSelection(allSelected ? [] : allKeys)}
              />
              <div className="tw-border-0 tw-border-t tw-border-dashed tw-border-border-default" />
            </div>
            {visibleColumns.map((column) => {
              const key = getColumnKey(column);
              return (
                <CheckboxRow
                  key={key}
                  label={column.name}
                  checked={selectedKeys.includes(key)}
                  onCheckedChange={() => toggleColumn(key)}
                />
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
