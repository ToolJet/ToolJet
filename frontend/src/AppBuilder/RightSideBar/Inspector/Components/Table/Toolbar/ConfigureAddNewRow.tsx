import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { resolveReferences } from '@/_helpers/utils';
import { Input, Checkbox } from '@/components/ui/Rocket';
import { generateCypressDataCy } from '@/modules/common/helpers/cypressHelpers';

// Untyped (.jsx) imports — cast to loose component types so they can be used as JSX under strict TS.
const InputComponent = Input as React.ComponentType<any>;
const CheckboxComponent = Checkbox as React.ComponentType<any>;

type ParamUpdate = (param: Record<string, any>, attr: string, value: unknown, paramType?: string) => void;

interface ColumnConfig {
  key?: string;
  name?: string;
  [key: string]: any;
}

interface ConfigureAddNewRowProps {
  component: any;
  paramUpdated: ParamUpdate;
  columns?: ColumnConfig[];
  onClose: () => void;
}

interface ColumnItem {
  token: string;
  label: string;
}

const getColumnToken = (column: ColumnConfig): string => (column.key || column.name) as string;
const getColumnLabel = (column: ColumnConfig): string => {
  const resolved = resolveReferences(column.name);
  return typeof resolved === 'string' && resolved.length ? resolved : column.key || '';
};

/**
 * Config popover for the "Add new row" toolbar item.
 * Lets the builder pick which columns appear in the Add-new-row popup.
 * An EMPTY stored array is the sentinel for "all columns" (the default)
 */
export const ConfigureAddNewRow = ({ component, paramUpdated, columns = [], onClose }: ConfigureAddNewRowProps) => {
  const [search, setSearch] = useState('');

  const storedSelection = useMemo<Set<string>>(() => {
    const resolved = resolveReferences(component?.component?.definition?.properties?.addNewRowColumns?.value);
    return new Set<string>(Array.isArray(resolved) ? resolved : []);
  }, [component?.component?.definition?.properties?.addNewRowColumns?.value]);

  const items = useMemo<ColumnItem[]>(
    () =>
      columns.map((column) => ({
        token: getColumnToken(column),
        label: getColumnLabel(column),
      })),
    [columns]
  );
  const allTokens = useMemo<string[]>(() => items.map((item) => item.token), [items]);

  // Empty stored set == "all columns". Expand it so the checkboxes reflect the effective selection.
  const isAllMode = storedSelection.size === 0;
  const effectiveSelected = useMemo<Set<string>>(
    () => (isAllMode ? new Set<string>(allTokens) : storedSelection),
    [isAllMode, allTokens, storedSelection]
  );

  const filteredItems = useMemo<ColumnItem[]>(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((item) => item.label.toLowerCase().includes(query));
  }, [items, search]);

  // Collapse "everything selected" (or nothing) back to the empty "all" sentinel; otherwise store the subset.
  const commit = (nextSet: Set<string>) => {
    const isEverything = allTokens.length > 0 && allTokens.every((token) => nextSet.has(token));
    const nextValue = isEverything || nextSet.size === 0 ? [] : Array.from(nextSet);
    paramUpdated({ name: 'addNewRowColumns' }, 'value', nextValue, 'properties');
  };

  const toggleColumn = (token: string, checked: boolean) => {
    const next = new Set(effectiveSelected);
    if (checked) next.add(token);
    else next.delete(token);
    commit(next);
  };

  const allFilteredSelected =
    filteredItems.length > 0 && filteredItems.every((item) => effectiveSelected.has(item.token));
  const someFilteredSelected = filteredItems.some((item) => effectiveSelected.has(item.token)) && !allFilteredSelected;

  const toggleSelectAll = () => {
    const next = new Set(effectiveSelected);
    if (allFilteredSelected) filteredItems.forEach((item) => next.delete(item.token));
    else filteredItems.forEach((item) => next.add(item.token));
    commit(next);
  };

  return (
    <div data-cy="configure-add-new-row-popover">
      <div className="tw-flex tw-h-11 tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-solid tw-border-border-weak tw-px-4">
        <span className="tw-font-title-default tw-text-text-default">Configure add new row</span>
        <button
          type="button"
          aria-label="Close"
          data-cy="configure-add-new-row-close"
          onClick={onClose}
          className="tw-flex tw-h-7 tw-w-7 tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-transparent tw-p-0 tw-text-icon-default tw-cursor-pointer hover:tw-text-icon-strong"
        >
          <X size={14} />
        </button>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-2 tw-p-4">
        <div className="tw-relative">
          <Search
            size={16}
            className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-1/2 tw--translate-y-1/2 tw-text-icon-default"
          />
          <InputComponent
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder="Search columns"
            className="tw-pl-9"
            data-cy="configure-add-new-row-search"
          />
        </div>

        <label className="tw-flex tw-items-center tw-gap-2 tw-py-1 tw-cursor-pointer">
          <CheckboxComponent
            checked={allFilteredSelected ? true : someFilteredSelected ? 'indeterminate' : false}
            onCheckedChange={toggleSelectAll}
            disabled={filteredItems.length === 0}
            data-cy="configure-add-new-row-select-all"
          />
          <span className="tw-font-body-default tw-text-text-default">Select all</span>
        </label>

        <div className="tw-my-0.5 tw-border-0 tw-border-b tw-border-dashed tw-border-border-weak" />

        <div className="tw-flex tw-max-h-[240px] tw-flex-col tw-gap-1 tw-overflow-y-auto">
          {filteredItems.length === 0 ? (
            <span className="tw-py-2 tw-font-body-small tw-text-text-placeholder">No columns found.</span>
          ) : (
            filteredItems.map((item) => (
              <label
                key={item.token}
                className="tw-flex tw-items-center tw-gap-2 tw-py-1 tw-cursor-pointer"
                data-cy={`configure-add-new-row-option-${generateCypressDataCy(item.label)}`}
              >
                <CheckboxComponent
                  checked={effectiveSelected.has(item.token)}
                  onCheckedChange={(checked: boolean | 'indeterminate') => toggleColumn(item.token, checked === true)}
                />
                <span className="tw-min-w-0 tw-truncate tw-font-body-default tw-text-text-default">{item.label}</span>
              </label>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfigureAddNewRow;
