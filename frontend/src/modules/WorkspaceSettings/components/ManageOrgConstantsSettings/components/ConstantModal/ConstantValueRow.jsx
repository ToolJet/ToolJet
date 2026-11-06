import React from 'react';
import { LockKeyhole, Trash2 } from 'lucide-react';
import { Button, FieldError, Textarea } from '@/components/ui/Rocket';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import { cn } from '@/lib/utils';

const MASKED_PLACEHOLDER = '••••••••••••••••';

// Assumption, not confirmed with product: the last remaining value cannot be removed, so its
// trash button is disabled with this explanation rather than offering to delete the constant.
const LAST_VALUE_TOOLTIP = 'A constant needs at least one value';

export default function ConstantValueRow({ row, canRemove, onChange, onRemove, onUndo }) {
  const { environmentName, value, removed, locked, masked, error } = row;
  const label = `${environmentName} value`;

  return (
    <div className="tw-flex tw-flex-col tw-gap-0.5">
      <div className="tw-flex tw-items-center tw-justify-between tw-pl-0.5">
        <div className="tw-flex tw-items-center tw-gap-1">
          <span className={cn('tw-font-title-default', removed ? 'tw-text-text-placeholder' : 'tw-text-text-default')}>
            {environmentName}
          </span>
          {!removed && (
            <LockKeyhole
              aria-hidden
              className={cn('tw-size-3', locked ? 'tw-text-icon-disabled' : 'tw-text-icon-success')}
            />
          )}
          {removed && (
            <span className="tw-rounded tw-bg-background-error-weak tw-px-1.5 tw-font-body-small tw-text-text-danger">
              Removed on save
            </span>
          )}
          {locked && <span className="tw-font-body-small tw-text-text-placeholder">Not accessible</span>}
        </div>

        {removed && (
          <button
            type="button"
            className="tw-border-0 tw-bg-transparent tw-p-0 tw-font-body-small tw-text-text-brand tw-underline"
            onClick={onUndo}
          >
            Undo
          </button>
        )}
        {!removed && !locked && (
          <Tooltip content={canRemove ? undefined : LAST_VALUE_TOOLTIP} isTooltipForInteractiveDisabledElement>
            <Button
              variant="ghost"
              size="medium"
              iconOnly
              disabled={!canRemove}
              aria-label={`Remove ${environmentName} value`}
              onClick={onRemove}
            >
              <Trash2 size={14} />
            </Button>
          </Tooltip>
        )}
      </div>

      <Textarea
        aria-label={label}
        rows={3}
        value={locked ? '' : value}
        placeholder={masked || locked ? MASKED_PLACEHOLDER : 'Enter value'}
        disabled={removed || locked}
        aria-invalid={Boolean(error)}
        className={cn('tw-min-h-[76px] tw-resize-y tw-px-2 tw-py-[7px]', removed && 'tw-line-through')}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
