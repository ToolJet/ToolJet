import React, { useCallback, useEffect, useRef, useState, type ComponentProps } from 'react';
import { Input } from '@/components/ui/Rocket/Input/Input';
import { ROCKET_SCROLLBAR } from '@/components/ui/Rocket/scrollbar';
import { cn } from '@/lib/utils';
import { isNearListEnd, useForeignKeyValues } from '../../../rows/useForeignKeyValues';
import type { ForeignKeyTarget, GridColumn } from '../useTableGrid';
import { CELL_RING, CellEditorShell, type useCellDraft } from './CellEditorShell';

const SEARCH_DELAY_MS = 300;

type ForeignKeyEditorProps = {
  draft: ReturnType<typeof useCellDraft>;
  column: GridColumn;
  foreignKey: ForeignKeyTarget;
  shell: Omit<ComponentProps<typeof CellEditorShell>, 'cell' | 'children'>;
};

// A searchable list of the values the referenced column holds. Picking one fills the draft; the shell's footer saves.
export function ForeignKeyEditor({ draft, column, foreignKey, shell }: ForeignKeyEditorProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchRef = useRef<HTMLInputElement | null>(null);
  const { values, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useForeignKeyValues({
    tableId: foreignKey.tableId,
    column: foreignKey.column,
    isTextColumn: column.dataType === 'character varying',
    search: debouncedSearch,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // The popover mounts after this component, so its field is not there for an effect of the editor to focus.
  const focusSearch = useCallback((node: HTMLInputElement | null) => {
    searchRef.current = node;
    node?.focus({ preventScroll: true });
  }, []);

  const pick = (value: string) => {
    draft.setText(value);
    draft.setIsNull(false);
  };

  // Like a native select: the arrows move the pick through the list.
  const step = (offset: number) => {
    if (values.length === 0) return;
    const current = draft.isNull ? -1 : values.indexOf(draft.text);
    pick(values[Math.min(Math.max(current + offset, 0), values.length - 1)]);
  };

  return (
    <CellEditorShell
      {...shell}
      onNullChange={(isNull) => {
        shell.onNullChange(isNull);
        searchRef.current?.focus({ preventScroll: true });
      }}
      cell={
        <div
          className={cn(
            'tw-flex tw-h-full tw-w-full tw-items-center tw-bg-background-surface-layer-01 tw-px-3 tw-font-body-large',
            CELL_RING,
            draft.isNull ? 'tw-text-text-placeholder' : 'tw-text-text-default'
          )}
        >
          <span className="tw-truncate">{draft.isNull ? 'NULL' : draft.text}</span>
        </div>
      }
    >
      <div className="tw-flex tw-w-64 tw-flex-col tw-gap-2">
        <Input
          ref={focusSearch}
          size="small"
          aria-label={`Search ${foreignKey.column}`}
          placeholder="Search"
          value={search}
          autoComplete="off"
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              step(event.key === 'ArrowDown' ? 1 : -1);
            } else if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              shell.onSave();
            }
          }}
        />
        <div
          role="listbox"
          aria-label={`${foreignKey.column} values`}
          onScroll={(event) => {
            if (hasNextPage && !isFetchingNextPage && isNearListEnd(event.currentTarget)) fetchNextPage();
          }}
          className={cn('tw-flex tw-max-h-48 tw-flex-col tw-overflow-auto', ROCKET_SCROLLBAR)}
        >
          {values.map((value) => (
            <button
              key={value}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={!draft.isNull && draft.text === value}
              onClick={() => pick(value)}
              className={cn(
                'tw-flex tw-h-7 tw-shrink-0 tw-items-center tw-truncate tw-rounded-md tw-border-0 tw-bg-transparent tw-px-2 tw-text-left tw-font-body-default tw-text-text-default hover:tw-bg-interactive-hover',
                !draft.isNull && draft.text === value && 'tw-bg-interactive-selected'
              )}
            >
              {value}
            </button>
          ))}
          {values.length === 0 && (
            <p className="tw-m-0 tw-px-2 tw-py-1.5 tw-font-body-default tw-text-text-placeholder">
              {isLoading ? 'Loading' : isError ? 'Could not load values' : 'No values found'}
            </p>
          )}
        </div>
      </div>
    </CellEditorShell>
  );
}
