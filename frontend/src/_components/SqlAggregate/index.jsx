import React, { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import DropDownSelect from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import { NoCondition } from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/NoConditionUI';
import { SQL_AGGREGATE_FUNCTION_OPTIONS } from './aggregateFunctionConstants';
import { readValueMapFromOptions, buildOptionChangeArgs } from '@/_helpers/sqlQuerySharedUtils';
import './SqlAggregate.css';

// ---------------------------------------------------------------------------
// SqlAggregateRow – a single aggregate row (function / column)
//
// Note: The aggregates data structure does NOT include an id field in the
// stored object. The map key (UUID) serves as the unique identifier.
// ---------------------------------------------------------------------------

const SqlAggregateRow = React.memo(function SqlAggregateRow({
  aggregateEntryKey,
  aggregateFunctionValue,
  columnValue,
  onAggregateFunctionChange,
  onColumnChange,
  onRemove,
  darkMode,
  workspaceConstants,
}) {
  const selectedAggregateFunction =
    SQL_AGGREGATE_FUNCTION_OPTIONS.find((option) => option.value === aggregateFunctionValue) ?? null;

  const handleAggregateFunctionChange = useCallback(
    (selectedOption) => onAggregateFunctionChange(aggregateEntryKey, selectedOption.value),
    [aggregateEntryKey, onAggregateFunctionChange]
  );

  const handleColumnChange = useCallback(
    (newColumn) => onColumnChange(aggregateEntryKey, newColumn),
    [aggregateEntryKey, onColumnChange]
  );

  const handleRemove = useCallback(() => onRemove(aggregateEntryKey), [aggregateEntryKey, onRemove]);

  return (
    <div className="sql-aggregate-row d-flex align-items-start">
      {/* Aggregate function – dropdown (Sum, Count, Avg, Min, Max, Count distinct) */}
      <div className="col p-0 pe-1">
        <DropDownSelect
          useMenuPortal={true}
          placeholder="Function"
          value={selectedAggregateFunction}
          options={SQL_AGGREGATE_FUNCTION_OPTIONS}
          onChange={handleAggregateFunctionChange}
          buttonClasses="border rounded-start overflow-hidden"
          showPlaceHolder
          darkMode={darkMode}
        />
      </div>

      {/* Column – CodeHinter so the user can type the column name */}
      <div className="col p-0 sql-aggregate-column-wrapper">
        <div className="sql-aggregate-column-input">
          <CodeHinter
            type="basic"
            initialValue={typeof columnValue === 'string' ? columnValue : ''}
            className="codehinter-plugins"
            placeholder="Enter column"
            onChange={handleColumnChange}
            height="28"
            workspaceConstants={workspaceConstants}
          />
        </div>

        <ButtonSolid
          size="sm"
          variant="ghostBlack"
          className="px-1 rounded-0 border rounded-end sql-aggregate-delete-button"
          onClick={handleRemove}
        >
          <Trash fill="var(--slate9)" style={{ height: '16px' }} />
        </ButtonSolid>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// SqlAggregate – public component registered as react-component-sql-aggregate
// ---------------------------------------------------------------------------

const SqlAggregate = React.memo(function SqlAggregate({
  getter,
  parseKey,
  options,
  handleOptionChange,
  darkMode,
  workspaceConstants,
}) {
  const currentAggregates = readValueMapFromOptions(options, getter, parseKey);
  const aggregateEntries = isEmpty(currentAggregates) ? [] : Object.entries(currentAggregates);

  const commitAggregates = useCallback(
    (newAggregates) => {
      const [changeKey, changeValue] = buildOptionChangeArgs(options, getter, parseKey, newAggregates);
      handleOptionChange(changeKey, changeValue);
    },
    [options, getter, parseKey, handleOptionChange]
  );

  const handleAddAggregate = useCallback(() => {
    const newAggregateKey = uuidv4();
    const newAggregate = { aggFx: '', column: '' };
    const updatedAggregates = { ...currentAggregates, [newAggregateKey]: newAggregate };
    commitAggregates(updatedAggregates);
  }, [currentAggregates, commitAggregates]);

  const handleRemoveAggregate = useCallback(
    (aggregateEntryKey) => {
      const updatedAggregates = { ...currentAggregates };
      delete updatedAggregates[aggregateEntryKey];
      commitAggregates(updatedAggregates);
    },
    [currentAggregates, commitAggregates]
  );

  const handleAggregateFunctionChange = useCallback(
    (aggregateEntryKey, newFunction) => {
      const updatedAggregates = {
        ...currentAggregates,
        [aggregateEntryKey]: { ...currentAggregates[aggregateEntryKey], aggFx: newFunction },
      };
      commitAggregates(updatedAggregates);
    },
    [currentAggregates, commitAggregates]
  );

  const handleColumnChange = useCallback(
    (aggregateEntryKey, newColumn) => {
      const updatedAggregates = {
        ...currentAggregates,
        [aggregateEntryKey]: { ...currentAggregates[aggregateEntryKey], column: newColumn },
      };
      commitAggregates(updatedAggregates);
    },
    [currentAggregates, commitAggregates]
  );

  return (
    <div className="sql-aggregate-container">
      {isEmpty(currentAggregates) && <NoCondition />}

      {aggregateEntries.map(([aggregateKey, aggregateData]) => (
        <SqlAggregateRow
          key={aggregateKey}
          aggregateEntryKey={aggregateKey}
          aggregateFunctionValue={aggregateData.aggFx}
          columnValue={aggregateData.column}
          onAggregateFunctionChange={handleAggregateFunctionChange}
          onColumnChange={handleColumnChange}
          onRemove={handleRemoveAggregate}
          darkMode={darkMode}
          workspaceConstants={workspaceConstants}
        />
      ))}

      <ButtonSolid
        variant="ghostBlue"
        size="sm"
        onClick={handleAddAggregate}
        className={
          isEmpty(currentAggregates) ? 'sql-aggregate-add-button no-aggregates-above' : 'sql-aggregate-add-button'
        }
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5.34554 10.0207C5.15665 10.0207 4.99832 9.95678 4.87054 9.829C4.74276 9.70123 4.67887 9.54289 4.67887 9.354V5.854H1.17887C0.989985 5.854 0.831651 5.79011 0.703874 5.66234C0.576096 5.53456 0.512207 5.37623 0.512207 5.18734C0.512207 4.99845 0.576096 4.84012 0.703874 4.71234C0.831651 4.58456 0.989985 4.52067 1.17887 4.52067H4.67887V1.02067C4.67887 0.831782 4.74276 0.673448 4.87054 0.54567C4.99832 0.417893 5.15665 0.354004 5.34554 0.354004C5.53443 0.354004 5.69276 0.417893 5.82054 0.54567C5.94832 0.673448 6.01221 0.831782 6.01221 1.02067V4.52067H9.51221C9.7011 4.52067 9.85943 4.58456 9.98721 4.71234C10.115 4.84012 10.1789 4.99845 10.1789 5.18734C10.1789 5.37623 10.115 5.53456 9.98721 5.66234C9.85943 5.79011 9.7011 5.854 9.51221 5.854H6.01221V9.354C6.01221 9.54289 5.94832 9.70123 5.82054 9.829C5.69276 9.95678 5.53443 10.0207 5.34554 10.0207Z"
            fill="#466BF2"
          />
        </svg>
        &nbsp;Add Condition
      </ButtonSolid>
    </div>
  );
});

export default SqlAggregate;
