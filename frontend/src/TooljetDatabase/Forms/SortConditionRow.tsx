import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';

import { dataTypes } from '../constants';
import { ConditionCell, ConditionRemove, ConditionRow, ConditionSelect } from '../Conditions/ConditionRow';
import type { FilterColumn } from './FilterConditionRow';

export interface SortCondition {
  column?: string;
  order?: string;
}

export interface SortConditionRowProps {
  /** Above the row: "Sort by" for the first, "Then by" for the rest. */
  label: string;
  condition: SortCondition;
  columns: FilterColumn[];
  onChange: (patch: SortCondition) => void;
  onRemove: () => void;
  'data-cy'?: string;
}

const ORDER_OPTIONS = [
  { value: 'asc', label: 'Ascending', icon: <ArrowUp className="tw-size-4 tw-shrink-0 tw-text-icon-default" /> },
  { value: 'desc', label: 'Descending', icon: <ArrowDown className="tw-size-4 tw-shrink-0 tw-text-icon-default" /> },
];

// One sort condition: column and order in a segmented row. Order waits for a column and starts as ascending.
export function SortConditionRow({
  label,
  condition,
  columns,
  onChange,
  onRemove,
  'data-cy': dataCy,
}: SortConditionRowProps) {
  const { column = '', order = '' } = condition;
  const columnOptions = columns.map(({ accessor, dataType }) => ({
    value: accessor,
    label: accessor,
    icon: dataTypes.find((type) => type.value === dataType)?.icon,
  }));

  return (
    <div className="tw-flex tw-flex-col tw-gap-1">
      <p className="tw-m-0 tw-font-body-small tw-text-text-medium">{label}</p>
      <ConditionRow data-cy={dataCy}>
        <ConditionCell>
          <ConditionSelect
            aria-label="Column"
            placeholder="Column"
            value={column}
            options={columnOptions}
            onValueChange={(next) => onChange({ column: next, order: order || 'asc' })}
            data-cy="select-column-field"
          />
        </ConditionCell>
        <ConditionCell>
          <ConditionSelect
            aria-label="Order"
            placeholder="Order"
            value={order}
            options={ORDER_OPTIONS}
            disabled={!column}
            onValueChange={(next) => onChange({ order: next })}
            data-cy="select-order-field"
          />
        </ConditionCell>
        <ConditionRemove label="Remove sort" onClick={onRemove} />
      </ConditionRow>
    </div>
  );
}
