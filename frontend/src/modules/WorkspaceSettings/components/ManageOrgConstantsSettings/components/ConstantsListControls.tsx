import React from 'react';
import type { ConstantSort, ConstantSource } from '@/_services/types/organizationConstantsV2.types';
import { AppliedFilters, FilterMenu, SortMenu, type ListOption, type SortGroup } from '@/_ui/ListControls';
import { DEFAULT_SORT } from '../hooks/useConstantsListQueryParams';

const SORT_GROUPS: SortGroup<ConstantSort>[] = [
  {
    id: 'name',
    label: 'Name',
    options: [
      { value: 'name_asc', label: 'A → Z' },
      { value: 'name_desc', label: 'Z → A' },
    ],
  },
  {
    id: 'modified',
    label: 'Last modified',
    options: [
      { value: 'modified_desc', label: 'Newest first' },
      { value: 'modified_asc', label: 'Oldest first' },
    ],
  },
];

// The order here is the canonical order of a source selection.
const SOURCE_OPTIONS: ListOption<ConstantSource>[] = [
  { value: 'workspace', label: 'Workspace' },
  { value: 'env', label: '.env variables' },
];

// Controls for the list view. State lives in useConstantsListQueryParams; this component only renders it. The
// environment select is in the header (`useHeaderEnvironmentSelect`).
interface ConstantsListControlsProps {
  sort: ConstantSort;
  onSortChange: (sort: ConstantSort) => void;
  source: ConstantSource[];
  onSourceChange: (source: ConstantSource[]) => void;
}

export default function ConstantsListControls({
  sort,
  onSortChange,
  source,
  onSourceChange,
}: ConstantsListControlsProps) {
  return (
    <div className="tw-ml-auto tw-flex tw-items-center tw-gap-1">
      <AppliedFilters options={SOURCE_OPTIONS} value={source} onChange={onSourceChange} />
      <FilterMenu label="Source" options={SOURCE_OPTIONS} value={source} onChange={onSourceChange} />
      <SortMenu groups={SORT_GROUPS} value={sort} defaultValue={DEFAULT_SORT} onChange={onSortChange} />
    </div>
  );
}
