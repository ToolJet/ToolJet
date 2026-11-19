import React, { type ReactNode } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Rocket/Select/Select';
import { dataTypes } from '../../constants';

type TypeSelectProps = {
  value: string | null;
  onChange: (type: string) => void;
  disabled?: boolean;
  className?: string;
  /** Replaces the type's own icon (a key, for a primary key). */
  icon?: ReactNode;
  /** The types offered; every type by default. The selected one is always shown in the trigger. */
  types?: typeof dataTypes;
  /** Under the list, outside the options (a note about types that are not offered). */
  footer?: ReactNode;
};

const findType = (value: string | null) => dataTypes.find((type) => type.value === value);

// The data type picker: the type's icon and label in the trigger, label and description in the list.
export function TypeSelect({ value, onChange, disabled, className, icon, types = dataTypes, footer }: TypeSelectProps) {
  const selected = findType(value);
  return (
    <Select value={value ?? undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={className} aria-label="Data type" data-cy="type-dropdown-field">
        <SelectValue placeholder="Select type">
          {selected && (
            <span className="tw-flex tw-items-center tw-gap-1.5">
              {icon ?? selected.icon}
              {selected.label}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {types.map((type) => (
          <SelectItem key={type.value} value={type.value}>
            <span className="tw-flex tw-items-center tw-gap-2">
              {type.icon}
              <span className="tw-text-text-default">{type.label}</span>
              <span className="tw-text-text-placeholder">{type.name}</span>
            </span>
          </SelectItem>
        ))}
        {footer}
      </SelectContent>
    </Select>
  );
}
