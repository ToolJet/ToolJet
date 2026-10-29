import React, { useId } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';

// Sized against the table the popover sits in: 66.6% of its width (at most 500px) and 80% of its height, centred.
const POPOVER_STYLE = {
  position: 'absolute',
  top: '10%',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '66.6%',
  maxWidth: '500px',
  height: '80%',
  zIndex: 100,
};

// Thin scrollbar in a reserved gutter, so the fields keep the same width whether or not the body scrolls.
const BODY_STYLE = { overflowY: 'auto', flex: 1, scrollbarWidth: 'thin', scrollbarGutter: 'stable' };

const FIELD_LAYOUT_CLASS = {
  stacked: 'tw-flex-col tw-gap-0.5',
  'label-after': 'tw-flex-row tw-items-center tw-gap-2',
  'label-before': 'tw-flex-row tw-items-center tw-gap-4',
};

export const AddNewRowForm = ({ fields, onSubmit, onCancel, darkMode, bodyRef }) => {
  const titleId = useId();

  return (
    <div
      role="dialog"
      aria-labelledby={titleId}
      className={cn(
        'table-add-new-row tw-flex tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-shadow-elevation-400',
        darkMode && 'dark-theme'
      )}
      style={POPOVER_STYLE}
    >
      <div className="tw-flex tw-h-[70px] tw-shrink-0 tw-items-center tw-border-0 tw-border-b tw-border-solid tw-border-border-default tw-px-4">
        <h2
          id={titleId}
          data-cy="add-new-rows-header"
          className="tw-m-0 tw-text-xl tw-font-medium tw-text-text-default"
        >
          Add row
        </h2>
      </div>

      <div
        ref={bodyRef}
        data-cy="add-new-row-0"
        className="tw-flex tw-flex-col tw-gap-4 tw-py-4 tw-pl-4 tw-pr-2"
        style={BODY_STYLE}
      >
        {fields.map(
          ({
            key,
            label,
            labelId,
            dataCy,
            headerDataCy,
            layout = 'stacked',
            hasValidation,
            error,
            errorId,
            control,
          }) => (
            <div
              key={key}
              role="group"
              aria-labelledby={labelId}
              data-cy={dataCy}
              className="tw-flex tw-flex-col tw-gap-0.5 tw-p-0.5"
            >
              <div className={cn('tw-flex', FIELD_LAYOUT_CLASS[layout])}>
                {layout === 'label-after' && control}
                <span className="tw-inline-flex tw-items-baseline">
                  <span
                    id={labelId}
                    className="tw-text-base tw-font-medium tw-text-text-default"
                    data-cy={headerDataCy}
                  >
                    {label}
                  </span>
                  {hasValidation && (
                    <span aria-hidden="true" className="tw-text-base tw-font-medium tw-text-text-danger">
                      *
                    </span>
                  )}
                </span>
                {layout !== 'label-after' && control}
              </div>
              {error && (
                <p id={errorId} role="alert" className="tw-m-0 tw-px-1 tw-text-sm tw-text-text-danger">
                  {error}
                </p>
              )}
            </div>
          )
        )}
      </div>

      <div className="tw-flex tw-h-[70px] tw-shrink-0 tw-items-center tw-justify-end tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-border-default tw-px-4">
        <Button variant="outline" className="tw-h-9 tw-text-lg" data-cy="discard-button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" className="tw-h-9 tw-text-lg" data-cy="save-button" onClick={onSubmit}>
          Add row
        </Button>
      </div>
    </div>
  );
};
