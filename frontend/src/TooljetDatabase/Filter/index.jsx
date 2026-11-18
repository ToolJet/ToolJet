import React, { useState } from 'react';
import { isEmpty, omit } from 'lodash';
import { toast } from 'react-hot-toast';
import { Funnel } from 'lucide-react';
import { useMounted } from '@/_hooks/use-mount';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Popover, PopoverTrigger } from '@/components/ui/Rocket/Popover/Popover';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import { ConditionPopover } from '../Conditions/ConditionPopover';
import { FilterConditionRow } from '../Forms/FilterConditionRow';
import { useTooljetDatabaseContext } from '../TooljetDatabaseContext';
import { useTjdbActions } from '../_stores/tjdbStore';

const hasAnyValue = ({ column, operator, value }) => !isEmpty(column) || !isEmpty(operator) || !isEmpty(value);
const isComplete = ({ column, operator, value }) => !isEmpty(column) && !isEmpty(operator) && !isEmpty(value);

// What the popover opens on when nothing is applied: one starter row.
const blankDraft = () => ({ 0: {} });

const generateMessage = (operator) => {
  const operatorMessage = {
    gte: 'Greater than or equal',
    lt: 'Less than',
    gt: 'Greater than',
    eq: 'Equals',
    lte: 'Less than or equal',
    neq: 'Not equal',
  };
  return operatorMessage[operator];
};

const Filter = ({ filters, setFilters, handleBuildFilterQuery, resetFilterQuery, setFilterEnable }) => {
  const { columns } = useTooljetDatabaseContext();
  const { setPageCount } = useTjdbActions();
  // The popover edits a draft; Apply is what writes it to the store.
  const [draft, setDraft] = useState(() => deepClone(filters));
  const [show, setShow] = useState(false);
  const isMounted = useMounted();

  const appliedCount = Object.values(filters).filter(isComplete).length;
  const draftRows = Object.entries(draft);
  const filledRows = Object.values(draft).filter(hasAnyValue);
  const canApply = filledRows.length > 0 ? filledRows.every(isComplete) : appliedCount > 0;

  const openWith = () => {
    // A fresh row when nothing is applied, else only the rows that have something in them.
    const rows = Object.fromEntries(Object.entries(filters).filter(([, filter]) => hasAnyValue(filter)));
    setDraft(isEmpty(rows) ? blankDraft() : deepClone(rows));
  };

  const handleOpenChange = (open) => {
    if (open) openWith();
    setShow(open);
  };

  const updateRow = (key, patch) => setDraft((previous) => ({ ...previous, [key]: { ...previous[key], ...patch } }));
  const addRow = () => setDraft((previous) => ({ ...previous, [+Object.keys(previous).pop() + 1 || 0]: {} }));

  const apply = () => {
    setFilters(Object.fromEntries(Object.entries(draft).filter(([, filter]) => hasAnyValue(filter))));
    setPageCount(1);
    setShow(false);
  };

  React.useEffect(() => {
    setFilterEnable(appliedCount > 0);
  }, [appliedCount, setFilterEnable]);

  React.useEffect(() => {
    if (Object.keys(filters).length === 0 && isMounted) {
      setFilters({});
      setShow(false);
      resetFilterQuery();
    } else {
      let validFilters = { ...filters };
      let hasInvalidFilter = false;

      Object.keys(filters).map((key) => {
        if (!isEmpty(filters[key])) {
          const { column, operator, value } = filters[key];
          if (!isEmpty(column) && !isEmpty(operator) && !isEmpty(value)) {
            if (value.toLowerCase() === 'null' && operator !== 'is') {
              delete validFilters[key];
              hasInvalidFilter = true;
              toast.error(
                `Invalid filter operation: Cannot use '${generateMessage(
                  operator
                )}' operator with a NULL value for column '${column}'.`,
                { position: 'top-center' }
              );
            }
          }
        }
      });

      if (hasInvalidFilter) {
        setFilters(validFilters);
      }

      if (Object.keys(validFilters).length > 0) {
        handleBuildFilterQuery(validFilters);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  return (
    <Popover open={show} onOpenChange={handleOpenChange}>
      {/* The tooltip sits on the span: PopoverTrigger does not forward a ref, so it cannot be the tooltip's trigger. */}
      <Tooltip content="Filter">
        <span className="tw-inline-flex">
          <PopoverTrigger asChild>
            <Button variant="ghost" size="medium" iconOnly aria-label="Filter" data-cy="filter-button">
              <Funnel />
            </Button>
          </PopoverTrigger>
        </span>
      </Tooltip>
      <ConditionPopover
        dataCy="filter"
        className="tw-w-[620px]"
        title="Filter"
        description="Records must match every condition."
        emptyTitle="No filters applied"
        emptyDescription="Add a filter to narrow down the records."
        addLabel="Add filter"
        onAdd={addRow}
        clearDisabled={filledRows.length === 0}
        onClearAll={() => setDraft({})}
        onCancel={() => setShow(false)}
        applyDisabled={!canApply}
        onApply={apply}
      >
        {draftRows.map(([key, condition]) => (
          <FilterConditionRow
            key={key}
            condition={condition}
            columns={columns}
            onChange={(patch) => updateRow(key, patch)}
            onRemove={() => setDraft((previous) => omit(previous, key))}
            data-cy={`filter-row-${key}`}
          />
        ))}
      </ConditionPopover>
    </Popover>
  );
};

export default Filter;
