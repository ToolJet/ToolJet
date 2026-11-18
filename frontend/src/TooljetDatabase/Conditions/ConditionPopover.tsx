import React, { type ReactNode } from 'react';
import { Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { PopoverContent } from '@/components/ui/Rocket/Popover/Popover';

export interface ConditionPopoverProps {
  title: string;
  description: string;
  addLabel: string;
  onAdd: () => void;
  /** Shown in a dashed box instead of the rows when there are none. */
  emptyTitle: string;
  emptyDescription: string;
  clearDisabled: boolean;
  onClearAll: () => void;
  onCancel: () => void;
  applyDisabled: boolean;
  onApply: () => void;
  /** Width class, 620px for Filter and 460px for Sort in the design. */
  className?: string;
  /** Prefix of the `data-cy` of the popover and its buttons ("filter" gives `filter-apply-button`). */
  dataCy: string;
  children?: ReactNode;
}

// The shell of the Filter and Sort popovers: header with the add action, the condition rows, and a footer.
export function ConditionPopover({
  title,
  description,
  addLabel,
  onAdd,
  emptyTitle,
  emptyDescription,
  clearDisabled,
  onClearAll,
  onCancel,
  applyDisabled,
  onApply,
  className,
  dataCy,
  children,
}: ConditionPopoverProps) {
  const hasRows = React.Children.count(children) > 0;
  return (
    <PopoverContent
      align="end"
      className={cn('tw-max-w-[calc(100vw-32px)] tw-gap-0 tw-p-0', className)}
      data-cy={`${dataCy}-section`}
    >
      <div className="tw-flex tw-flex-col tw-gap-3 tw-p-4">
        <div className="tw-flex tw-items-end tw-justify-between tw-gap-2">
          <div className="tw-flex tw-flex-col tw-gap-0.5">
            <p className="tw-m-0 tw-font-title-default tw-text-text-default">{title}</p>
            <p className="tw-m-0 tw-font-body-small tw-text-text-placeholder">{description}</p>
          </div>
          <Button
            variant="ghostBrand"
            size="medium"
            leadingVisual={<Plus />}
            onClick={onAdd}
            data-cy={`${dataCy}-add-button`}
          >
            {addLabel}
          </Button>
        </div>
        {hasRows ? (
          <div className="tw-flex tw-max-h-72 tw-flex-col tw-gap-2 tw-overflow-y-auto" data-cy={`${dataCy}-conditions`}>
            {children}
          </div>
        ) : (
          <div
            className="tw-box-border tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-1 tw-rounded-medium tw-border tw-border-dashed tw-border-border-default tw-px-6 tw-py-4 tw-text-center"
            data-cy={`${dataCy}-empty-state`}
          >
            <p className="tw-m-0 tw-font-title-default tw-text-text-default">{emptyTitle}</p>
            <p className="tw-m-0 tw-font-body-small tw-text-text-placeholder">{emptyDescription}</p>
          </div>
        )}
      </div>
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-1.5 tw-border-0 tw-border-t tw-border-solid tw-border-border-weak tw-px-4 tw-py-3">
        <Button
          variant="ghost"
          size="medium"
          disabled={clearDisabled}
          onClick={onClearAll}
          data-cy={`${dataCy}-clear-all-button`}
        >
          Clear all
        </Button>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Button variant="outline" size="medium" onClick={onCancel} data-cy={`${dataCy}-cancel-button`}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="medium"
            disabled={applyDisabled}
            onClick={onApply}
            data-cy={`${dataCy}-apply-button`}
          >
            Apply
          </Button>
        </div>
      </div>
    </PopoverContent>
  );
}
