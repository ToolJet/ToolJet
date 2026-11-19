import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../Button/Button';
import { LinkButton } from '../LinkButton/LinkButton';
import { EmptyAndNoResultsState } from './EmptyAndNoResultsState';

export default { title: 'Rocket/EmptyAndNoResultsState', component: EmptyAndNoResultsState };

const addButton = (label: string) => (
  <Button variant="secondary" size="medium" leadingVisual={<Plus />}>
    {label}
  </Button>
);

// The Figma matrix: three variants at two sizes.
export const Matrix = {
  render: () => (
    <div className="tw-grid tw-grid-cols-2 tw-items-start tw-gap-10">
      {(['default', 'compact'] as const).flatMap((size) => [
        <EmptyAndNoResultsState key={`empty-${size}`} variant="empty" size={size} action={addButton('Add data')} />,
        <EmptyAndNoResultsState
          key={`no-results-${size}`}
          variant="no-results"
          size={size}
          action={<LinkButton>Clear filters</LinkButton>}
        />,
        <EmptyAndNoResultsState
          key={`no-table-open-${size}`}
          variant="no-table-open"
          size={size}
          action={addButton('Open a table')}
        />,
      ])}
    </div>
  ),
};
