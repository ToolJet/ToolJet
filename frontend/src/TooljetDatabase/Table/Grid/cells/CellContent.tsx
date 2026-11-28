import React from 'react';
import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';
import { cn } from '@/lib/utils';
import { formatCellValue } from './dataTypes';

type CellContentProps = {
  value: unknown;
  isPrimaryKey: boolean;
  formatValue?: (value: unknown) => string;
  /** The cell holds the keyboard focus: a cut-off value shows its tooltip, as it does on hover. */
  isFocused?: boolean;
};

// Text for every type: booleans read true/false and JSON is its serialised form.
// Alignment is the cell's job (numbers right-align), so this only truncates.
export function CellContent({ value, isPrimaryKey, formatValue = formatCellValue, isFocused }: CellContentProps) {
  if (value === null || value === undefined) {
    return <span className="tw-text-text-placeholder">NULL</span>;
  }
  const text = formatValue(value);
  return (
    <TruncatedText
      as="span"
      content={text}
      forceOpen={isFocused}
      className={cn(
        'tw-min-w-0 tw-max-w-full',
        isPrimaryKey ? 'tw-text-text-placeholder tw-tabular-nums' : 'tw-text-text-medium'
      )}
    >
      {text}
    </TruncatedText>
  );
}
