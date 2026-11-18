import React, { useEffect, useState } from 'react';
import { isEmpty, omit } from 'lodash';
import { ArrowDownUp } from 'lucide-react';
import { useMounted } from '@/_hooks/use-mount';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { Button } from '@/components/ui/Rocket/Button/Button';
import { Popover, PopoverTrigger } from '@/components/ui/Rocket/Popover/Popover';
import Tooltip from '@/components/ui/Rocket/Tooltip';
import { ConditionPopover } from '../Conditions/ConditionPopover';
import { SortConditionRow } from '../Forms/SortConditionRow';
import { useTooljetDatabaseContext } from '../TooljetDatabaseContext';

const hasAnyValue = ({ column, order }) => !isEmpty(column) || !isEmpty(order);
const isComplete = ({ column, order }) => !isEmpty(column) && !isEmpty(order);

const Sort = ({ filters, setFilters }) => {
  const { columns } = useTooljetDatabaseContext();
  // The popover edits a draft; Apply is what writes it to the store.
  const [draft, setDraft] = useState(() => deepClone(filters));
  const [show, setShow] = useState(false);
  const isMounted = useMounted();

  const appliedCount = Object.values(filters).filter(isComplete).length;
  const draftRows = Object.entries(draft);
  const filledRows = Object.values(draft).filter(hasAnyValue);
  const canApply = filledRows.length > 0 ? filledRows.every(isComplete) : appliedCount > 0;

  const handleOpenChange = (open) => {
    if (open) {
      // A fresh row when nothing is applied, else only the rows that have something in them.
      const rows = Object.fromEntries(Object.entries(filters).filter(([, sort]) => hasAnyValue(sort)));
      setDraft(isEmpty(rows) ? { 0: {} } : deepClone(rows));
    }
    setShow(open);
  };

  const updateRow = (key, patch) => setDraft((previous) => ({ ...previous, [key]: { ...previous[key], ...patch } }));
  const addRow = () => setDraft((previous) => ({ ...previous, [+Object.keys(previous).pop() + 1 || 0]: {} }));

  const apply = () => {
    setFilters(Object.fromEntries(Object.entries(draft).filter(([, sort]) => hasAnyValue(sort))));
    setShow(false);
  };

  // Sort cleared from outside (table switch, Clear all) closes the popover.
  useEffect(() => {
    if (Object.keys(filters).length === 0 && isMounted) setShow(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  return (
    <Popover open={show} onOpenChange={handleOpenChange}>
      {/* The tooltip sits on the span: PopoverTrigger does not forward a ref, so it cannot be the tooltip's trigger. */}
      <Tooltip content="Sort">
        <span className="tw-inline-flex">
          <PopoverTrigger asChild>
            <Button variant="ghost" size="medium" iconOnly aria-label="Sort" data-cy="sort-button">
              <ArrowDownUp />
            </Button>
          </PopoverTrigger>
        </span>
      </Tooltip>
      <ConditionPopover
        dataCy="sort"
        className="tw-w-[460px]"
        title="Sort"
        description="Records are ordered by the first row, then by the next."
        addLabel="Add sort"
        onAdd={addRow}
        emptyTitle="No sorting applied"
        emptyDescription="Add a sort to order the records."
        clearDisabled={filledRows.length === 0}
        onClearAll={() => setDraft({})}
        onCancel={() => setShow(false)}
        applyDisabled={!canApply}
        onApply={apply}
      >
        {draftRows.map(([key, condition], index) => (
          <SortConditionRow
            key={key}
            label={index === 0 ? 'Sort by' : 'Then by'}
            condition={condition}
            columns={columns}
            onChange={(patch) => updateRow(key, patch)}
            onRemove={() => setDraft((previous) => omit(previous, key))}
            data-cy={`sort-row-${key}`}
          />
        ))}
      </ConditionPopover>
    </Popover>
  );
};

export default Sort;
