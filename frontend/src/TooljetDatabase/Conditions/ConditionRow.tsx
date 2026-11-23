import React, { type ReactNode } from 'react';
import { Trash } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Input, type InputProps } from '@/components/ui/Rocket/Input/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Rocket/Select/Select';

// The row owns the border and the 1px dividers, so the fields inside have none of their own.
const FIELD_CLASS = cn(
  'tw-h-8 tw-w-full tw-rounded-none tw-border-0 tw-bg-transparent tw-px-[7px] tw-shadow-none hover:tw-border-0',
  'focus:tw-ring-0 focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-interactive-focus-outline',
  'disabled:tw-bg-transparent disabled:tw-opacity-100 disabled:tw-text-text-disabled'
);

// One condition as a single segmented row: cells split by 1px dividers (Figma "Filter/Sort condition row").
export function ConditionRow({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // shrink-0: overflow-hidden lets a flex item shrink to nothing, so in the scrolling list the rows would squash
        // instead of the list scrolling.
        'tw-flex tw-w-full tw-shrink-0 tw-items-stretch tw-overflow-hidden tw-rounded-default',
        // Not tw-divide-x: with preflight off its solid style gives every cell a 3px top and bottom border.
        '[&>*+*]:tw-border-0 [&>*+*]:tw-border-l [&>*+*]:tw-border-solid [&>*+*]:tw-border-border-default',
        'tw-border tw-border-solid tw-border-border-default tw-bg-background-surface-layer-01',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function ConditionCell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('tw-flex tw-min-w-0 tw-flex-1 tw-items-center', className)}>{children}</div>;
}

export function ConditionRemove({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="tw-flex tw-w-9 tw-shrink-0 tw-items-center tw-justify-center">
      <Button variant="ghost" size="medium" iconOnly aria-label={label} data-cy="delete-icon" onClick={onClick}>
        <Trash />
      </Button>
    </div>
  );
}

export interface ConditionOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface ConditionSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ConditionOption[];
  placeholder: string;
  disabled?: boolean;
  'aria-label': string;
  'data-cy'?: string;
}

export function ConditionSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  'aria-label': ariaLabel,
  'data-cy': dataCy,
}: ConditionSelectProps) {
  const selected = options.find((option) => option.value === value);
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger aria-label={ariaLabel} className={FIELD_CLASS} data-cy={dataCy}>
        <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-1.5">
          {selected?.icon}
          <SelectValue placeholder={placeholder} className="tw-truncate" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className="tw-gap-1.5">
            {option.icon}
            <SelectItemText>{option.label}</SelectItemText>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function ConditionInput({ className, ...props }: InputProps & { 'data-cy'?: string }) {
  return (
    <Input className={cn(FIELD_CLASS, 'focus-visible:tw-ring-inset disabled:tw-border-0', className)} {...props} />
  );
}
