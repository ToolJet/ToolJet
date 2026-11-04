import React, { useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Bolt, Check, ChevronDown, GripVertical, MousePointerClick, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveReferences } from '@/_helpers/utils';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Rocket/Popover/Popover';
import { FILTER_OPTIONS } from '@/AppBuilder/Widgets/NewTable/_components/Header/_components/Filter/filterConstants';
import { getColumnSelectOptions } from '@/AppBuilder/Widgets/NewTable/_utils/addNewRowConfig';
import { createDefaultFilter, describeFilter, getFilterableColumns, moveFilter, needsValue } from './filterConfigUtils';

const MODES = [
  { label: 'Client side', value: false },
  { label: 'Server side', value: true },
];

const OPTION_COLUMN_TYPES = ['select', 'newMultiSelect', 'tagsV2'];
const BOOLEAN_COLUMN_TYPES = ['boolean', 'toggle'];
const BOOLEAN_OPTIONS = [
  { label: 'True', value: 'true' },
  { label: 'False', value: 'false' },
];

const FIELD_CLASS =
  'tw-flex tw-h-8 tw-w-full tw-min-w-0 tw-items-center tw-gap-1.5 tw-rounded-md tw-border tw-border-solid tw-border-border-default tw-bg-background-surface-layer-01 tw-px-2.5 tw-font-body-default tw-text-text-default';

const DASHED_LINE = 'tw-flex-1 tw-border-0 tw-border-t tw-border-dashed tw-border-border-default';

const SectionTitle = ({ children }) => (
  <div className="tw-flex tw-h-5 tw-items-center tw-gap-3">
    <div className={DASHED_LINE} />
    <span className="tw-font-body-default tw-text-text-placeholder">{children}</span>
    <div className={DASHED_LINE} />
  </div>
);

// A button that opens a list of options; the popup is a popover, so the list is one too.
const FilterSelect = ({ label, prefix, value, options, onChange, darkMode }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" aria-label={label} aria-haspopup="listbox" className={FIELD_CLASS}>
          {prefix && (
            <span className="tw-border-0 tw-border-r tw-border-solid tw-border-border-default tw-pr-1.5 tw-text-text-placeholder">
              {prefix}
            </span>
          )}
          <span className={cn('tw-flex-1 tw-truncate tw-text-left', !selected && 'tw-text-text-placeholder')}>
            {selected?.label ?? 'Select'}
          </span>
          <ChevronDown size={14} className="tw-shrink-0 tw-text-icon-default" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        collisionPadding={8}
        // above the config popup (1042) and the dialogs the builder lifts to 1050
        className={cn(
          'tw-z-[1060] tw-w-[var(--radix-popover-trigger-width)] tw-gap-0 tw-p-1',
          darkMode && 'dark-theme'
        )}
      >
        <div role="listbox" aria-label={label} className="tw-flex tw-max-h-60 tw-flex-col tw-overflow-y-auto">
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className="tw-flex tw-h-8 tw-w-full tw-items-center tw-gap-2 tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-text-left tw-font-body-default tw-text-text-default hover:tw-bg-interactive-hover"
            >
              <span className="tw-flex tw-w-4 tw-shrink-0 tw-justify-center" aria-hidden="true">
                {option.value === value && <Check size={14} className="tw-text-icon-accent" />}
              </span>
              <span className="tw-truncate">{option.label}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const DefaultValueField = ({ filter, column, serverSideFilter, onChange, darkMode }) => {
  if (serverSideFilter) {
    return (
      <div className="tw-min-w-0">
        <CodeHinter
          key={filter.id}
          initialValue={filter.value}
          theme={darkMode ? 'monokai' : 'default'}
          mode="javascript"
          lineNumbers={false}
          placeholder="Set a default value"
          onChange={onChange}
        />
      </div>
    );
  }

  const options = OPTION_COLUMN_TYPES.includes(column?.columnType)
    ? getColumnSelectOptions(column, (value) => resolveReferences(value))
    : BOOLEAN_COLUMN_TYPES.includes(column?.columnType)
      ? BOOLEAN_OPTIONS
      : null;

  if (options) {
    return (
      <FilterSelect
        label="Default value"
        prefix="Default"
        value={filter.value}
        options={options}
        onChange={onChange}
        darkMode={darkMode}
      />
    );
  }

  return (
    <label className={cn(FIELD_CLASS, 'tw-m-0')}>
      <span className="tw-border-0 tw-border-r tw-border-solid tw-border-border-default tw-pr-1.5 tw-text-text-placeholder">
        Default
      </span>
      <input
        type="text"
        aria-label="Default value"
        value={filter.value ?? ''}
        placeholder="Set a default value"
        onChange={(event) => onChange(event.target.value)}
        className="tw-min-w-0 tw-flex-1 tw-border-0 tw-bg-transparent tw-p-0 tw-font-body-default tw-text-text-default placeholder:tw-text-text-placeholder"
      />
    </label>
  );
};

export const DefaultFiltersConfig = ({ columns, defaultFilters, serverSideFilter, onChange, darkMode = false }) => {
  const filterableColumns = getFilterableColumns(columns);
  const columnOptions = filterableColumns.map(({ id, name }) => ({ label: name, value: id }));
  const operatorOptions = FILTER_OPTIONS.map(({ name, value }) => ({ label: name, value }));
  const filters = Array.isArray(defaultFilters) ? defaultFilters : [];

  const saveFilters = (next) => onChange('defaultFilters', next);
  const updateFilter = (id, changes) =>
    saveFilters(filters.map((filter) => (filter.id === id ? { ...filter, ...changes } : filter)));
  const addFilter = () => {
    const filter = createDefaultFilter(columns);
    if (filter) saveFilters([...filters, filter]);
  };
  const removeFilter = (id) => saveFilters(filters.filter((filter) => filter.id !== id));
  const handleDragEnd = ({ source, destination }) => {
    if (destination) saveFilters(moveFilter(filters, source.index, destination.index));
  };

  const addLabel = serverSideFilter ? 'Add new custom filter' : 'Add new filter';
  const addButton = (
    <button
      type="button"
      onClick={addFilter}
      disabled={filterableColumns.length === 0}
      className="tw-flex tw-h-8 tw-items-center tw-justify-center tw-gap-2 tw-rounded-md tw-border tw-border-solid tw-border-border-default tw-bg-background-surface-layer-01 tw-px-3 tw-font-title-default tw-text-text-default hover:tw-bg-interactive-hover disabled:tw-opacity-50"
    >
      <Plus size={16} />
      {addLabel}
    </button>
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Configure filters"
          data-cy="default-filters-config-button"
          className="fx-button unselectable tw-flex tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-[var(--slate9)] data-[state=open]:tw-bg-[var(--slate4)]"
        >
          <Bolt size={16} strokeWidth={1.75} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="left"
        align="start"
        sideOffset={8}
        collisionPadding={8}
        data-cy="default-filters-config-popover"
        data-testid="default-filters-config-popover"
        // same layer as the other inspector popovers; below it the properties panel covers this one
        className={cn('tw-z-[1042] tw-w-[303px] tw-gap-0 tw-overflow-hidden tw-p-0', darkMode && 'dark-theme')}
      >
        <div className="tw-flex tw-h-11 tw-shrink-0 tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-px-4">
          <span className="tw-font-title-default tw-text-text-default">Configure filters</span>
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

        <div className="tw-flex tw-max-h-[min(70vh,560px)] tw-flex-col tw-gap-3 tw-overflow-y-auto tw-p-4">
          <div className="tw-flex tw-h-8 tw-items-center tw-justify-between">
            <span className="tw-font-body-default tw-text-text-default">Type</span>
            <div
              role="radiogroup"
              aria-label="Type"
              className="tw-flex tw-items-center tw-gap-0.5 tw-rounded-lg tw-bg-background-surface-layer-02 tw-p-0.5"
            >
              {MODES.map(({ label, value }) => (
                <button
                  key={label}
                  type="button"
                  role="radio"
                  aria-checked={!!serverSideFilter === value}
                  onClick={() => !!serverSideFilter !== value && onChange('serverSideFilter', `{{${value}}}`)}
                  className={cn(
                    'tw-h-7 tw-rounded-md tw-border-0 tw-px-3 tw-font-body-default',
                    !!serverSideFilter === value
                      ? 'tw-bg-background-surface-layer-01 tw-font-title-default tw-text-text-default tw-shadow-elevation-100'
                      : 'tw-bg-transparent tw-text-text-placeholder'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <SectionTitle>Quick filters</SectionTitle>

          {filters.length === 0 ? (
            <div className="tw-flex tw-flex-col tw-items-center tw-gap-2 tw-py-3 tw-text-center">
              <span className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded-lg tw-bg-background-surface-layer-02 tw-text-icon-default">
                <MousePointerClick size={16} />
              </span>
              <span className="tw-font-title-default tw-text-text-default">No custom filters are added</span>
              <span className="tw-font-body-default tw-text-text-placeholder">
                Allow your users to easily filter though pre-defined set of filters
              </span>
              {addButton}
            </div>
          ) : (
            <>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="default-filters">
                  {({ innerRef, droppableProps, placeholder }) => (
                    <div ref={innerRef} {...droppableProps} className="tw-flex tw-flex-col tw-gap-3">
                      {filters.map((filter, index) => {
                        const column = filterableColumns.find(({ id }) => id === filter.column);
                        return (
                          <Draggable key={filter.id} draggableId={filter.id} index={index}>
                            {({ innerRef: itemRef, draggableProps, dragHandleProps }) => (
                              <div
                                ref={itemRef}
                                {...draggableProps}
                                className="tw-flex tw-flex-col tw-gap-2 tw-bg-background-surface-layer-01"
                              >
                                <div className="tw-flex tw-items-center tw-gap-1.5">
                                  <span
                                    {...dragHandleProps}
                                    aria-label="Drag to reorder"
                                    className="tw-flex tw-shrink-0 tw-cursor-grab tw-items-center tw-text-icon-default"
                                  >
                                    <GripVertical size={14} />
                                  </span>
                                  <span className="tw-flex-1 tw-truncate tw-font-title-default tw-text-text-default">
                                    {describeFilter(filter, columns)}
                                  </span>
                                  <button
                                    type="button"
                                    aria-label="Delete filter"
                                    onClick={() => removeFilter(filter.id)}
                                    className="tw-flex tw-h-6 tw-w-6 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-transparent tw-text-icon-default hover:tw-bg-interactive-hover"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <div className="tw-grid tw-grid-cols-2 tw-gap-2 tw-pl-5">
                                  <FilterSelect
                                    label="Column"
                                    value={filter.column}
                                    options={columnOptions}
                                    onChange={(value) => updateFilter(filter.id, { column: value, value: '' })}
                                    darkMode={darkMode}
                                  />
                                  <FilterSelect
                                    label="Operator"
                                    value={filter.condition}
                                    options={operatorOptions}
                                    onChange={(value) =>
                                      updateFilter(filter.id, {
                                        condition: value,
                                        ...(needsValue(value) ? {} : { value: '' }),
                                      })
                                    }
                                    darkMode={darkMode}
                                  />
                                </div>
                                {needsValue(filter.condition) && (
                                  <div className="tw-pl-5">
                                    <DefaultValueField
                                      filter={filter}
                                      column={column}
                                      serverSideFilter={serverSideFilter}
                                      darkMode={darkMode}
                                      onChange={(value) => updateFilter(filter.id, { value })}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              <div className="tw-flex tw-flex-col [&>button]:tw-w-full">{addButton}</div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
