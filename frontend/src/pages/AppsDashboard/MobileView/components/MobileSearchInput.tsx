import React from 'react';
import { Search, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/Rocket/InputGroup/InputGroup';

export interface MobileSearchInputProps {
  classes?: { inputGroup?: string };
  value: string;
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
}

export function MobileSearchInput({
  classes,
  value,
  placeholder,
  disabled = false,
  onChange,
  onClear,
}: MobileSearchInputProps) {
  return (
    <InputGroup
      size="large"
      className={cn(
        'tw-bg-background-surface-layer-01 tw-rounded-xl tw-h-auto',
        { 'tw-opacity-50': disabled },
        classes?.inputGroup
      )}
    >
      <InputGroupAddon>
        <Search aria-hidden className="tw-size-6 tw-text-icon-default" />
      </InputGroupAddon>

      <InputGroupInput
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={placeholder}
        className="tw-font-body-x-large tw-py-3"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => event.key === 'Escape' && onClear()}
      />

      {value !== '' && !disabled && (
        <InputGroupAddon align="inline-end">
          <InputGroupButton aria-label="Clear search" onClick={onClear}>
            <X aria-hidden className="!tw-size-6 tw-text-icon-default" />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}
