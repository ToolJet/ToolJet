import React, { useState } from 'react';
import { CircleAlert, LockKeyhole, Trash } from 'lucide-react';
import { Button, FieldError, Popover, PopoverContent, PopoverTrigger, Textarea } from '@/components/ui/Rocket';
import { cn } from '@/lib/utils';

const MASKED_PLACEHOLDER = '***************';

const listFormat = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

function RemoveValuePopover({ environmentName, otherEnvironmentNames, canRemove, onConfirm, onCancel }) {
  const othersStay =
    otherEnvironmentNames.length > 0
      ? `The ${listFormat.format(otherEnvironmentNames)} ${otherEnvironmentNames.length > 1 ? 'values stay' : 'value stays'}.`
      : 'This is the only value.';

  return (
    <PopoverContent align="end" className="tw-gap-3 tw-border-0">
      <div className="tw-flex tw-flex-col tw-gap-1">
        <span className="tw-font-body-default tw-text-text-default">Remove {environmentName} value?</span>
        <span className="tw-font-body-small tw-text-text-placeholder">
          {canRemove ? othersStay : "This is the only value. The constant can't be used without one."}
        </span>
      </div>
      {!canRemove && (
        // The server rejects a constant with no values, so deleting the last one is a job for Delete on the list.
        <div className="tw-flex tw-items-start tw-gap-1.5 tw-rounded-md tw-border tw-border-solid tw-border-border-weak tw-bg-background-surface-layer-02 tw-px-2 tw-py-1.5">
          <CircleAlert aria-hidden className="tw-size-3.5 tw-shrink-0 tw-text-icon-weak" />
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
    </PopoverContent>
  );
}

export default function ConstantValueRow({ row, canRemove, otherEnvironmentNames, onChange, onRemove }) {
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
              <Button variant="ghost" size="medium" iconOnly aria-label={`Remove ${environmentName} value`}>
                <Trash size={14} className="!tw-size-3.5" />
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
        placeholder={masked || locked ? MASKED_PLACEHOLDER : 'Enter value'}
        disabled={locked}
        aria-invalid={Boolean(error)}
        className={cn(
          'tw-h-[86px] tw-min-h-[86px] tw-resize-y tw-px-2 tw-py-[7px]',
          masked && 'placeholder:tw-text-text-default'
        )}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
