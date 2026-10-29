import React, { useId } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button/Button';
import { getRowCountLabel } from '../../../_utils/addNewRowChips';
import { THEME_PRIMARY_BUTTON_CLASS } from '../../../_utils/addNewRowTheme';
import { AddNewRowPicker } from './AddNewRowPicker';

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

// The popover fades out before it closes (the dialog fades through its own exit animation).
export const FADE_OUT_MS = 150;
const FADE_OUT_STYLE = { opacity: 0, transition: `opacity ${FADE_OUT_MS}ms ease-out`, pointerEvents: 'none' };

// Thin scrollbar in a reserved gutter, so the fields keep the same width whether or not the body scrolls.
const BODY_STYLE = { overflowY: 'auto', flex: 1, scrollbarWidth: 'thin', scrollbarGutter: 'stable' };

const FIELD_LAYOUT_CLASS = {
  stacked: 'tw-flex-col tw-gap-0.5',
  'label-after': 'tw-flex-row tw-items-center tw-gap-2',
  'label-before': 'tw-flex-row tw-items-center tw-gap-4',
};

// variant "popover": the form sits inside the table, so it draws its own card and handles Escape itself.
// variant "dialog": a Rocket dialog supplies the card, the overlay and Escape, and labels itself from the title.
export const AddNewRowForm = ({
  fields,
  onSubmit,
  onCancel,
  onEscape,
  darkMode,
  bodyRef,
  variant = 'popover',
  saving = false,
  closing = false,
  // multiple rows: chips to pick a row, "+" and Remove row; absent for a single-row form
  rows = null,
}) => {
  const titleId = useId();
  const isDialog = variant === 'dialog';
  const Heading = isDialog ? DialogPrimitive.Title : 'h2';

  return (
    <div
      {...(!isDialog && {
        role: 'dialog',
        'aria-labelledby': titleId,
        style: { ...POPOVER_STYLE, ...(closing && FADE_OUT_STYLE) },
      })}
      aria-busy={saving || undefined}
      onKeyDown={(event) => {
        // an open menu or calendar has already used the Escape, and marked it as handled
        if (!isDialog && event.key === 'Escape' && !event.defaultPrevented) onEscape?.();
      }}
      className={cn(
        'table-add-new-row tw-flex tw-flex-col tw-overflow-hidden',
        isDialog
          ? 'tw-min-h-0 tw-flex-1'
          : 'tw-rounded-lg tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-01 tw-shadow-elevation-400',
        !isDialog && darkMode && 'dark-theme'
      )}
    >
      <div className="tw-flex tw-h-[70px] tw-shrink-0 tw-items-center tw-border-0 tw-border-b tw-border-solid tw-border-border-default tw-px-4">
        <Heading
          {...(!isDialog && { id: titleId })}
          data-cy="add-new-rows-header"
          className="tw-m-0 tw-text-xl tw-font-medium tw-text-text-default"
        >
          {rows ? 'Add rows' : 'Add row'}
        </Heading>
      </div>

      {rows && (
        <div inert={saving ? '' : undefined} className={cn(saving && 'tw-opacity-50')}>
          <AddNewRowPicker {...rows} disabled={saving} darkMode={darkMode} />
        </div>
      )}

      <div
        ref={bodyRef}
        data-cy={`add-new-row-${rows?.active ?? 0}`}
        // the fieldset below locks every native control; inert covers the custom ones (select, chips, date...)
        inert={saving ? '' : undefined}
        className={cn('tw-flex tw-flex-col tw-gap-4 tw-py-4 tw-pl-4 tw-pr-2', saving && 'tw-opacity-50')}
        style={BODY_STYLE}
      >
        <fieldset disabled={saving} className="tw-m-0 tw-flex tw-min-w-0 tw-flex-col tw-gap-4 tw-border-0 tw-p-0">
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
        </fieldset>
      </div>

      <div className="tw-flex tw-h-[70px] tw-shrink-0 tw-items-center tw-justify-end tw-gap-2 tw-border-0 tw-border-t tw-border-solid tw-border-border-default tw-px-4">
        <Button
          variant="outline"
          className={cn('tw-h-9 tw-text-lg', saving && 'tw-opacity-50')}
          data-cy="discard-button"
          disabled={saving}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          className={cn('tw-h-9 tw-text-lg', THEME_PRIMARY_BUTTON_CLASS, saving && 'tw-opacity-60')}
          data-cy="save-button"
          disabled={saving}
          onClick={onSubmit}
        >
          {saving ? `Adding ${getRowCountLabel(rows?.count ?? 1)}…` : `Add ${getRowCountLabel(rows?.count ?? 1)}`}
        </Button>
      </div>
    </div>
  );
};
