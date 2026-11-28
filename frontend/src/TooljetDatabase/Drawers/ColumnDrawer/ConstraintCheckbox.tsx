import React from 'react';
import { Checkbox } from '@/components/ui/Rocket/Checkbox/Checkbox';
import { FieldDescription, FieldLabel } from '@/components/ui/Rocket/Field/Field';

type ConstraintCheckboxProps = {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  /** Why the box is fixed, as a hover hint. */
  reason?: string;
  onChange: (checked: boolean) => void;
  'data-cy'?: string;
};

// A checkbox with its label and a line under it (Figma: Checkbox + label). The box lines up with the first line.
export function ConstraintCheckbox({
  id,
  label,
  description,
  checked,
  disabled,
  reason,
  onChange,
  'data-cy': dataCy,
}: ConstraintCheckboxProps) {
  return (
    <div className="tw-flex tw-items-start tw-gap-1.5" title={disabled ? reason : undefined}>
      <Checkbox
        id={id}
        className="tw-mt-0.5"
        checked={checked}
        disabled={disabled}
        onCheckedChange={(next) => onChange(next === true)}
        aria-describedby={`${id}-description`}
        data-cy={dataCy}
      />
      <div className="tw-flex tw-flex-col tw-gap-0.5">
        <FieldLabel
          htmlFor={id}
          className={`tw-pl-0.5 tw-font-title-default ${disabled ? 'tw-text-text-disabled' : ''}`}
        >
          {label}
        </FieldLabel>
        <FieldDescription id={`${id}-description`} className="tw-pb-0.5 tw-pl-0.5 tw-font-body-default">
          {description}
        </FieldDescription>
      </div>
    </div>
  );
}
