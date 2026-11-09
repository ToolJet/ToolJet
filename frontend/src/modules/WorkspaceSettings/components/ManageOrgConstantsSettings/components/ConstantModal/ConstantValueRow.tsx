/// <reference lib="es2021.intl" />
import React, { useState } from 'react';
import { Info, LockKeyhole, Trash } from 'lucide-react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Button, FieldError, Popover, PopoverContent, PopoverTrigger, Textarea } from '@/components/ui/Rocket';
import { cn } from '@/lib/utils';
import { SECRET_MASK } from '../../helpers/constants';
import type { FormRow } from './useConstantForm';

const listFormat = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

const popoverArrowClass = 'tw-fill-background-surface-layer-01';

// Removing one of several values only marks it, and Save applies it. The only value cannot be removed (the server
// rejects a constant with no values), so there Remove is disabled and a note points to Delete on the list.
interface RemoveValuePopoverProps {
  environmentName: string;
  otherEnvironmentNames: string[];
  canRemove: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function RemoveValuePopover({
  environmentName,
  otherEnvironmentNames,
  canRemove,
  onConfirm,
  onCancel,
}: RemoveValuePopoverProps) {
  const othersStay =
    otherEnvironmentNames.length > 0
      ? `The ${listFormat.format(otherEnvironmentNames)} ${otherEnvironmentNames.length > 1 ? 'values stay' : 'value stays'}.`
      : '';

  return (
    <PopoverContent align="end" className="tw-gap-3 tw-border-0">
      <div className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-font-body-default tw-text-text-default">Remove {environmentName} value?</span>
        <span className="tw-font-body-small tw-text-text-placeholder">
          {canRemove ? othersStay : 'This is the only value. The constant can’t be used without one.'}
        </span>
      </div>
      {!canRemove && (
        <div className="tw-flex tw-items-start tw-gap-1.5 tw-rounded-default tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-02 tw-px-2 tw-py-1.5">
          <Info aria-hidden className="tw-size-3.5 tw-shrink-0 tw-text-icon-strong" />
          <span className="tw-font-body-small tw-text-text-placeholder">
            To delete the whole constant, use Delete from the constants list.
          </span>
        </div>
      )}
      <div className="tw-flex tw-justify-end tw-gap-2">
        <Button variant="outline" size="medium" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" danger size="medium" disabled={!canRemove} onClick={onConfirm}>
          Remove
        </Button>
      </div>
      {/* The pointer toward the trash button; 14px wide, as the design's rotated 10px square. */}
      <PopoverPrimitive.Arrow width={14} height={7} className={popoverArrowClass} />
    </PopoverContent>
  );
}

interface ConstantValueRowProps {
  row: FormRow;
  canRemove: boolean;
  otherEnvironmentNames: string[];
  onChange: (value: string) => void;
  onBlur: () => void;
  onRemove: () => void;
}

export default function ConstantValueRow({
  row,
  canRemove,
  otherEnvironmentNames,
  onChange,
  onBlur,
  onRemove,
}: ConstantValueRowProps) {
  const { environmentName, value, locked, masked, error } = row;
  const label = `${environmentName} value`;
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  return (
    <div className="tw-flex tw-flex-col tw-gap-0.5">
      <div className="tw-flex tw-items-center tw-justify-between tw-pl-0.5">
        <div className="tw-flex tw-items-center tw-gap-1">
          <span className="tw-font-title-default tw-text-text-default">{environmentName}</span>
          <LockKeyhole
            aria-hidden
            className={cn('tw-size-3', locked ? 'tw-text-icon-disabled' : 'tw-text-icon-success')}
          />
          {locked && <span className="tw-font-body-small tw-text-text-placeholder">Not accessible</span>}
        </div>

        {!locked && (
          <Popover open={confirmingRemove} onOpenChange={setConfirmingRemove}>
            <PopoverTrigger asChild>
              {/* Pressed look while the confirmation is open, as in the design. */}
              <Button
                variant="ghost"
                size="medium"
                iconOnly
                aria-label={`Remove ${environmentName} value`}
                className="data-[state=open]:tw-bg-button-outline-pressed"
              >
                <Trash size={14} />
              </Button>
            </PopoverTrigger>
            <RemoveValuePopover
              environmentName={environmentName}
              otherEnvironmentNames={otherEnvironmentNames}
              canRemove={canRemove}
              onCancel={() => setConfirmingRemove(false)}
              onConfirm={() => {
                setConfirmingRemove(false);
                onRemove();
              }}
            />
          </Popover>
        )}
      </div>

      <Textarea
        aria-label={label}
        rows={4}
        value={locked ? '' : value}
        placeholder={masked || locked ? SECRET_MASK : 'Enter value'}
        disabled={locked}
        aria-invalid={Boolean(error)}
        className={cn(
          'tw-h-[86px] tw-min-h-[86px] tw-resize-y tw-px-2 tw-py-[7px]',
          masked && 'placeholder:tw-text-text-default'
        )}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
