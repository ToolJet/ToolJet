import React from 'react';
import { Funnel } from 'lucide-react';

import DropdownMenu from '@/components/ui/Rocket/DropdownMenu';
import { FILTER_GROUPS } from './listQueryOptions';
import { MENU_CLASSES } from './menuClasses';
import MenuHeader from './MenuHeader';
import ToolbarMenuTrigger from './ToolbarMenuTrigger';

export default function FilterMenu({ filters, onToggleFilter, onClearFilters }) {
  const sections = [
    {
      id: 'header',
      content: <MenuHeader title="Filter by" actionLabel="Clear all" onAction={onClearFilters} />,
    },
    ...FILTER_GROUPS.map((group) => ({
      id: group.id,
      label: group.label,
      items: group.options.map((option) => ({
        id: option.value,
        type: 'checkbox',
        label: option.label,
        checked: filters[group.id].includes(option.value),
        keepOpen: true,
        onCheckedChange: () => onToggleFilter(group.id, option.value),
      })),
    })),
  ];

  return (
    <DropdownMenu
      trigger={<ToolbarMenuTrigger icon={Funnel} label="Filter" />}
      sections={sections}
      align="end"
      classes={MENU_CLASSES}
    />
  );
}
