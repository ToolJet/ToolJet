import React from 'react';
import TruncatedText from '@/components/ui/Rocket/Tooltip/TruncatedText';
import { cn } from '@/lib/utils';
import { formatCellValue } from './dataTypes';

type CellContentProps = { value: unknown; isPrimaryKey: boolean };

// Text for every type: booleans read true/false and JSON is its serialised form.
// Alignment is the cell's job (numbers right-align), so this only truncates.
export function CellContent({ value, isPrimaryKey }: CellContentProps) {
  if (value === null || value === undefined) {
    return <span className="tw-text-text-placeholder">NULL</span>;
  }
  const text = formatCellValue(value);
  return (
    <TruncatedText
      as="span"
      content={text}
      className={cn(
        'tw-min-w-0 tw-max-w-full',
        isPrimaryKey ? 'tw-text-text-placeholder tw-tabular-nums' : 'tw-text-text-medium'
      )}
    >
      {text}
    </TruncatedText>
  );
}
