import React from 'react';

import { operators } from '@/_helpers/constants';
import { dataTypes } from '../constants';
import {
  ConditionCell,
  ConditionInput,
  ConditionRemove,
  ConditionRow,
  ConditionSelect,
} from '../Conditions/ConditionRow';
import type { QueryFilter } from '../Table/dataToolbarFilters';

export interface FilterColumn {
  accessor: string;
  dataType?: string;
}

export interface FilterConditionRowProps {
  condition: QueryFilter;
  columns: FilterColumn[];
  onChange: (patch: QueryFilter) => void;
  onRemove: () => void;
  'data-cy'?: string;
}

const OPERATOR_OPTIONS = (operators as { value: string; label: string }[]).map(({ value, label }) => ({
  value,
  label,
}));

// One filter condition: column, operation and value in a segmented row. Operation and value wait for a column.
export function FilterConditionRow({
  condition,
  columns,
  onChange,
  onRemove,
  'data-cy': dataCy,
}: FilterConditionRowProps) {
  const { column = '', operator = '', value = '' } = condition;
  const columnOptions = columns.map(({ accessor, dataType }) => ({
    value: accessor,
    label: accessor,
    icon: dataTypes.find((type) => type.value === dataType)?.icon,
  }));

  return (
    <ConditionRow data-cy={dataCy}>
      <ConditionCell>
        <ConditionSelect
          aria-label="Column"
          placeholder="Column"
          value={column}
          options={columnOptions}
          onValueChange={(next) => onChange({ column: next })}
          data-cy="select-column-field"
        />
      </ConditionCell>
      <ConditionCell>
        <ConditionSelect
          aria-label="Operation"
          placeholder="Operation"
          value={operator}
          options={OPERATOR_OPTIONS}
          disabled={!column}
          onValueChange={(next) => onChange({ operator: next })}
          data-cy="select-operation-field"
        />
      </ConditionCell>
      <ConditionCell className="tw-flex-[1.3]">
        <ConditionInput
          aria-label="Value"
          placeholder="Value"
          value={value}
          disabled={!column}
          onChange={(event) => onChange({ value: event.target.value })}
          data-cy="value-input-field"
        />
      </ConditionCell>
      <ConditionRemove label="Remove filter" onClick={onRemove} />
    </ConditionRow>
  );
}
