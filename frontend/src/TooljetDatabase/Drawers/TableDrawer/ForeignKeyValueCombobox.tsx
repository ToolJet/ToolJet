import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/Rocket/Combobox/Combobox';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { authenticationService } from '@/_services';
import { getPrivateRoute } from '@/_helpers/routes';
import { useForeignKeyValues } from '../../rows/useForeignKeyValues';

const SEARCH_DELAY_MS = 300;

type Option = { value: string | null; label: string };
const NULL_OPTION: Option = { value: null, label: 'NULL' };

type ForeignKeyValueComboboxProps = {
  /** The referenced table. Without it the list stays empty. */
  tableId?: string;
  tableName: string;
  /** The referenced column: its values are the choices. */
  column: string;
  /** Text columns search by substring, the rest by equality. */
  isTextColumn: boolean;
  /** `null` is NULL (only when `allowNull`); an empty string is no choice yet. */
  value: string | null;
  onChange: (value: string | null) => void;
  /** Offers NULL as the first choice. */
  allowNull?: boolean;
  placeholder?: string;
  disabled?: boolean;
  size?: 'default' | 'small';
  'data-cy'?: string;
};

const toOption = (value: string): Option => ({ value, label: value });

// A searchable list of the values the referenced column holds, in Rocket's Combobox. The list is the server's answer
// to the search (`useForeignKeyValues`), so the Combobox does no filtering of its own.
export function ForeignKeyValueCombobox({
  tableId,
  tableName,
  column,
  isTextColumn,
  value,
  onChange,
  allowNull = false,
  placeholder = 'Select a value',
  disabled = false,
  size = 'default',
  'data-cy': dataCy,
}: ForeignKeyValueComboboxProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const { values, isLoading, isError } = useForeignKeyValues({
    tableId: tableId ?? '',
    column,
    isTextColumn,
    search: debouncedSearch,
    enabled: Boolean(tableId),
  });

  const options = values.map(toOption);
  // The chosen value may be past the first page, or filtered out by the search; it must stay a known option.
  if (value && !values.includes(value)) options.unshift(toOption(value));
  if (allowNull) options.unshift(NULL_OPTION);

  let selected: Option | null = null;
  if (value) selected = toOption(value);
  else if (value === null && allowNull) selected = NULL_OPTION;

  const isAdmin = Boolean(authenticationService.currentSessionValue?.admin);
  const openReferencedTable = () => {
    localStorage.setItem('tableDetails', JSON.stringify({ id: tableId, table_name: tableName }));
    window.open(getPrivateRoute('database'), '_blank');
  };

  return (
    <div className="tw-w-full" data-cy={dataCy}>
      <Combobox<Option>
        items={options}
        value={selected}
        disabled={disabled}
        // The server filters; see the comment above the component.
        filter={null}
        isItemEqualToValue={(item: Option, current: Option) => item.value === current.value}
        itemToStringLabel={(item: Option) => item.label}
        onValueChange={(next: Option | null) => onChange(next ? next.value : allowNull ? null : '')}
        onInputValueChange={(text: string, details: { reason: string }) => {
          if (details.reason === 'input-change') setSearch(text);
        }}
        onOpenChange={(open: boolean) => {
          if (!open) setSearch('');
        }}
      >
        <ComboboxInput size={size} placeholder={placeholder} disabled={disabled} />
        {/* The drawers sit at z-index 1000-1002; every popup opened from one clears them at 1100. */}
        <ComboboxContent positionerClassName="tw-z-[1100]">
          <ComboboxList>
            {(item: Option) => (
              <ComboboxItem key={item.value ?? 'null'} value={item}>
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
          <ComboboxEmpty>{isLoading ? 'Loading' : isError ? 'Could not load values' : 'No values found'}</ComboboxEmpty>
          {isAdmin && tableId && (
            <Button
              variant="ghost"
              size="small"
              trailingVisual={<ExternalLink />}
              onClick={openReferencedTable}
              className="tw-mt-1 tw-w-full tw-justify-between"
              data-cy="open-referenced-table-button"
            >
              Open referenced table
            </Button>
          )}
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
