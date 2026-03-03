import React, { useCallback, useMemo, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { readValueMapFromOptions, buildOptionChangeArgs } from '@/_helpers/sqlQuerySharedUtils';
import './SqlGroupBy.css';

// ---------------------------------------------------------------------------
// GroupByChip – a single column name chip with a remove button
// ---------------------------------------------------------------------------

const GroupByChip = React.memo(function GroupByChip({ columnName, onRemove }) {
  const handleRemove = useCallback(() => onRemove(columnName), [columnName, onRemove]);

  return (
    <span className="group-by-chip">
      <span className="group-by-chip-label">{columnName}</span>
      <button type="button" className="group-by-chip-remove" onClick={handleRemove} aria-label={`Remove ${columnName}`}>
        ×
      </button>
    </span>
  );
});

// ---------------------------------------------------------------------------
// SqlGroupBy – public component registered as react-component-sql-groupby
//
// Data structure: { [uuid]: string[] }
// The component uses the first (and only) entry in the map. When none exists
// a new UUID key is generated on the first column addition.
// ---------------------------------------------------------------------------

const SqlGroupBy = React.memo(function SqlGroupBy({ getter, parseKey, options, handleOptionChange }) {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  // group_by is stored as { [uuid]: string[] }
  const groupByMap = readValueMapFromOptions(options, getter, parseKey);

  // Use only the first entry so the component is context-independent
  const existingEntries = Object.entries(groupByMap);
  const groupByEntryKey = existingEntries.length > 0 ? existingEntries[0][0] : null;
  const selectedColumns = useMemo(
    () => (existingEntries.length > 0 ? existingEntries[0][1] ?? [] : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groupByMap]
  );

  const commitGroupBy = useCallback(
    (updatedColumns) => {
      const updatedGroupByMap = updatedColumns.length === 0 ? {} : { [groupByEntryKey ?? uuidv4()]: updatedColumns };
      const [changeKey, changeValue] = buildOptionChangeArgs(options, getter, parseKey, updatedGroupByMap);
      handleOptionChange(changeKey, changeValue);
    },
    [options, getter, parseKey, handleOptionChange, groupByEntryKey]
  );

  const handleAddColumn = useCallback(() => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput) return;
    if (selectedColumns.includes(trimmedInput)) {
      setInputValue('');
      return;
    }
    commitGroupBy([...selectedColumns, trimmedInput]);
    setInputValue('');
  }, [inputValue, selectedColumns, commitGroupBy]);

  const handleRemoveColumn = useCallback(
    (columnNameToRemove) => {
      const updatedColumns = selectedColumns.filter((columnName) => columnName !== columnNameToRemove);
      commitGroupBy(updatedColumns);
    },
    [selectedColumns, commitGroupBy]
  );

  const handleInputKeyDown = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        handleAddColumn();
      } else if (event.key === 'Backspace' && inputValue === '' && selectedColumns.length > 0) {
        handleRemoveColumn(selectedColumns[selectedColumns.length - 1]);
      }
    },
    [handleAddColumn, inputValue, selectedColumns, handleRemoveColumn]
  );

  const handleInputChange = useCallback((event) => {
    setInputValue(event.target.value);
  }, []);

  const handleContainerClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="sql-group-by-container" onClick={handleContainerClick}>
      {selectedColumns.map((columnName) => (
        <GroupByChip key={columnName} columnName={columnName} onRemove={handleRemoveColumn} />
      ))}
      <input
        ref={inputRef}
        className="group-by-input"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleInputKeyDown}
        placeholder={selectedColumns.length === 0 ? 'Type column name and press Enter' : ''}
      />
    </div>
  );
});

export default SqlGroupBy;
