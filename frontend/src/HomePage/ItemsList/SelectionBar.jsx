import React from 'react';
import { Trash } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import { Checkbox } from '@/components/ui/Rocket/Checkbox/Checkbox';
import { GUTTER_CLASS } from './ItemRow';

const pluralize = (count, kind) => `${count} ${kind}${count === 1 ? '' : 's'}`;

// Figma 1174-101868. `pageState` is 'all' when every selectable row of the kind on this page is selected.
export default function SelectionBar({ kind, selectedCount, pageState, onToggleAll, onClear, className }) {
  const label =
    pageState === 'all'
      ? `All ${pluralize(selectedCount, kind)} on this page selected`
      : `${pluralize(selectedCount, kind)} selected`;

  return (
    <div className={cn('tw--ml-[52px] tw-flex tw-items-center', className)}>
      <div className={GUTTER_CLASS}>
        <span className="tw-flex tw-size-5 tw-items-center tw-justify-center">
          <Checkbox
            checked={pageState === 'all' ? true : 'indeterminate'}
            onCheckedChange={onToggleAll}
            aria-label={`Select all ${kind}s on this page`}
          />
        </span>
      </div>
      <div
        role="toolbar"
        aria-label="Selection actions"
        className="tw-flex tw-h-9 tw-flex-1 tw-items-center tw-gap-2.5 tw-rounded-md tw-bg-background-accent-weak tw-px-[23px]"
      >
        <span className="tw-font-body-default tw-text-text-default">{label}</span>
        <button
          type="button"
          onClick={onClear}
          className="tw-border-0 tw-bg-transparent tw-p-0 tw-font-body-default tw-text-text-accent tw-underline"
        >
          Clear
        </button>
        <span aria-hidden className="tw-h-5 tw-w-px tw-bg-border-weak" />
        {/* Bulk actions are UI-only until their API flows are wired. */}
        <Button variant="dangerSecondary" size="small">
          <Trash size={12} className="tw-text-icon-danger" />
          Delete
        </Button>
      </div>
    </div>
  );
}
