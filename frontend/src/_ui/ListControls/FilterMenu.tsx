import React from 'react';
import { Funnel } from 'lucide-react';

import DropdownMenu, { type DropdownMenuSection } from '@/components/ui/Rocket/DropdownMenu';
import type { ListOption } from './types';
import { useMenuSearch } from './useMenuSearch';
import { ICON_CLASS, ICON_SIZE, IconTrigger, MenuSearchHeader, NoResults, SEARCHABLE_MENU_CLASSES } from './parts';

export interface FilterMenuProps<Value extends string> {
  /** Heading above the options. */
  label: string;
  /** Every option, in the order `onChange` reports them. */
  options: ListOption<Value>[];
  /** The checked options. Checking all of them is the same as no filter. */
  value: Value[];
  onChange: (value: Value[]) => void;
}

export function FilterMenu<Value extends string>({ label, options, value, onChange }: FilterMenuProps<Value>) {
  const search = useMenuSearch();
  const allValues = options.map((option) => option.value);
  const shown = options.filter((option) => option.label.toLowerCase().includes(search.needle));
  const allChecked = value.length === allValues.length;

  const toggle = (changed: Value, checked: boolean) => {
    const next = allValues.filter((entry) => (entry === changed ? checked : value.includes(entry)));
    // The last checked option stays checked: an empty selection would silently fall back to all of them.
    if (next.length) onChange(next);
  };

  // Does nothing when there is nothing to clear: a filter change may also reset the page and the row selection.
  const clearAll = () => {
    search.setQuery('');
    if (!allChecked) onChange(allValues);
  };

  const header = {
    id: 'search',
    content: <MenuSearchHeader search={search} placeholder="Filter by" actionLabel="Clear all" onAction={clearAll} />,
  };

  const sections: DropdownMenuSection[] = shown.length
    ? [
        header,
        {
          id: 'options',
          separator: false,
          label,
          items: shown.map((option) => ({
            id: option.value,
            type: 'checkbox' as const,
            keepOpen: true,
            label: option.label,
            checked: value.includes(option.value),
            onPointerMove: search.keepInputFocus,
            onPointerLeave: search.keepInputFocus,
            onCheckedChange: (checked: boolean) => toggle(option.value, checked),
          })),
        },
      ]
    : [header, { id: 'empty', separator: false, content: <NoResults /> }];

  return (
    <DropdownMenu
      compact
      align="end"
      classes={SEARCHABLE_MENU_CLASSES}
      onOpenChange={(open: boolean) => !open && search.setQuery('')}
      sections={sections}
      trigger={
        <IconTrigger label="Filter">
          <Funnel size={ICON_SIZE} className={ICON_CLASS} />
        </IconTrigger>
      }
    />
  );
}
