import React from 'react';
import { ArrowDownUp, Funnel, Plus } from 'lucide-react';

import { Button } from '@/components/ui/Rocket/Button/Button';
import { DataToolbar } from './DataToolbar';

const FILTERS = [
  { id: '0', label: 'title contains "filters"' },
  { id: '1', label: 'tag equals "feature"' },
  { id: '2', label: 'description contains "release"' },
  { id: '3', label: 'release_category equals "Bug Fixes"' },
  { id: '4', label: 'id greater than 20' },
];

const noop = () => undefined;

const iconButton = (label: string, icon: React.ReactNode) => (
  <Button variant="ghost" size="medium" iconOnly aria-label={label}>
    {icon}
  </Button>
);

const toolbar = (filters: typeof FILTERS) => (
  <DataToolbar
    title="releasenotes_1729074245765"
    filters={filters}
    onRemoveFilter={noop}
    onClearFilters={noop}
    onOpenHistory={noop}
    filterControl={iconButton('Filter', <Funnel />)}
    sortControl={iconButton('Sort', <ArrowDownUp />)}
    addData={
      <Button variant="secondary" size="medium" leadingVisual={<Plus />}>
        Add data
      </Button>
    }
  />
);

export default {
  title: 'TooljetDatabase/DataToolbar',
  component: DataToolbar,
  parameters: { layout: 'fullscreen' },
};

export const Default = { render: () => toolbar([]) };
export const FiltersActive = { render: () => toolbar(FILTERS.slice(0, 2)) };
// Click "+3 more" to see the collapsed filters.
export const FiltersOverflow = { render: () => toolbar(FILTERS) };
