import React, { useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { readValueMapFromOptions, buildOptionChangeArgs } from '@/_helpers/sqlQuerySharedUtils';
import DynamicSelector from '@/_ui/DynamicSelector';
import './SqlGroupBy.css';

// ---------------------------------------------------------------------------
// SqlGroupBy – public component registered as react-component-sql-groupby
//
// Data structure: { [uuid]: string[] }
// The component uses the first (and only) entry in the map. When none exists
// a new UUID key is generated on the first column addition.
// ---------------------------------------------------------------------------

const SqlGroupBy = React.memo(function SqlGroupBy({
  getter,
  parseKey,
  options,
  handleOptionChange,
  darkMode,
  columnSelectorOperation,
  columnSelectorDependsOn,
  selectedDataSource,
  currentAppEnvironmentId,
  queryName,
}) {
  const depKeys = Array.isArray(columnSelectorDependsOn) ? columnSelectorDependsOn : [];
  const schema = depKeys.includes('schema') ? options?.schema ?? '' : '';
  const table = depKeys.includes('table') ? options?.table ?? '' : '';

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

  const handleMultiSelectChange = useCallback(
    (_propertyKey, newColumns) => {
      commitGroupBy(Array.isArray(newColumns) ? newColumns : []);
    },
    [commitGroupBy]
  );

  return (
    <DynamicSelector
      operation={columnSelectorOperation}
      dependsOn={columnSelectorDependsOn}
      selectedDataSource={selectedDataSource}
      currentAppEnvironmentId={currentAppEnvironmentId}
      options={{ schema, table }}
      value={selectedColumns}
      propertyKey="group_by_columns"
      optionchanged={handleMultiSelectChange}
      optionsChanged={() => {}}
      queryName={queryName}
      label="Columns"
      darkMode={darkMode}
      isMulti={true}
      sizeStyles={{ width: '100%', height: '30px', borderRadius: '0 0 0 0' }}
    />
  );
});

export default SqlGroupBy;
