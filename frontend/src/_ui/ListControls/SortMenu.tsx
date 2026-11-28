import React from 'react';
import { ArrowDownWideNarrow } from 'lucide-react';

import DropdownMenu, { type DropdownMenuSection } from '@/components/ui/Rocket/DropdownMenu';
import type { SortGroup } from './types';
import { useMenuSearch } from './useMenuSearch';
import { ICON_CLASS, ICON_SIZE, IconTrigger, MenuSearchHeader, NoResults, SEARCHABLE_MENU_CLASSES } from './parts';

export interface SortMenuProps<Value extends string> {
  groups: SortGroup<Value>[];
  value: Value;
  /** What Reset goes back to. */
  defaultValue: Value;
  onChange: (value: Value) => void;
}

export function SortMenu<Value extends string>({ groups, value, defaultValue, onChange }: SortMenuProps<Value>) {
  const search = useMenuSearch();
  // An option stays when its own label or its group's label matches, so "last" lists both "Last modified" options.
  const shown = groups
    .map((group) => ({
      ...group,
      options: group.options.filter(({ label }) =>
        [label, group.label].some((text) => text.toLowerCase().includes(search.needle))
      ),
    }))
    .filter((group) => group.options.length);

  // One sort at a time: Radix reports an unchecked click on the active option, which keeps it.
  const choose = (next: Value, checked: boolean) => {
    if (checked) onChange(next);
  };

  // Does nothing when there is nothing to reset: a sort change may also reset the page and the row selection.
  const reset = () => {
    search.setQuery('');
    if (value !== defaultValue) onChange(defaultValue);
  };

  const header = {
    id: 'search',
    content: <MenuSearchHeader search={search} placeholder="Sort by" actionLabel="Reset" onAction={reset} />,
  };

  const sections: DropdownMenuSection[] = shown.length
    ? [
        header,
        ...shown.map((group, index) => ({
          id: group.id,
          // The header draws the divider above the first group.
          separator: index > 0,
          label: group.label,
          items: group.options.map((option) => ({
            id: option.value,
            type: 'checkbox' as const,
            label: option.label,
            checked: value === option.value,
            onPointerMove: search.keepInputFocus,
            onPointerLeave: search.keepInputFocus,
            onCheckedChange: (checked: boolean) => choose(option.value, checked),
          })),
        })),
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
        <IconTrigger label="Sort">
          <ArrowDownWideNarrow size={ICON_SIZE} className={ICON_CLASS} />
        </IconTrigger>
      }
    />
  );
}
