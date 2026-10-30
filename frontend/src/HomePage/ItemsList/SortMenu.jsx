import React from 'react';
import { ArrowDownWideNarrow } from 'lucide-react';

import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';
import { DEFAULT_SORT, SORT_GROUPS } from './listQueryOptions';
import { MENU_CLASSES } from './menuClasses';
import MenuHeader from './MenuHeader';
import ToolbarMenuTrigger from './ToolbarMenuTrigger';

export default function SortMenu({ sort, onSortChange }) {
  const sections = [
    {
      id: 'header',
      content: <MenuHeader title="Sort by" actionLabel="Reset" onAction={() => onSortChange(DEFAULT_SORT)} />,
    },
    // Each group is its own radio group bound to the same value, so exactly one option is checked overall.
    ...SORT_GROUPS.map((group) => ({
      id: group.id,
      label: group.label,
      type: 'radio',
      value: sort,
      onValueChange: onSortChange,
      items: group.options,
    })),
  ];

  return (
    <DropdownMenu
      trigger={<ToolbarMenuTrigger icon={ArrowDownWideNarrow} label="Sort" />}
      sections={sections}
      align="end"
      classes={MENU_CLASSES}
    />
  );
}
