import React, { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import { NoCondition } from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/NoConditionUI';
import { readValueMapFromOptions, buildOptionChangeArgs } from '@/_helpers/sqlQuerySharedUtils';
import DynamicSelector from '@/_ui/DynamicSelector';
import './SqlColumns.scss';

// ---------------------------------------------------------------------------
// SqlColumnRow – a single column-name / value row
// ---------------------------------------------------------------------------

const SqlColumnRow = React.memo(function SqlColumnRow({
  columnEntryId,
  columnName,
  columnValue,
  onColumnNameChange,
  onColumnValueChange,
  onRemove,
  workspaceConstants,
  columnSelectorOperation,
  columnSelectorDependsOn,
  selectedDataSource,
  currentAppEnvironmentId,
  schema,
  table,
  darkMode,
  queryName,
}) {
  const handleColumnNameChange = useCallback(
    (newName) => onColumnNameChange(columnEntryId, newName),
    [columnEntryId, onColumnNameChange]
  );

  const handleColumnValueChange = useCallback(
    (newValue) => onColumnValueChange(columnEntryId, newValue),
    [columnEntryId, onColumnValueChange]
  );

  const handleRemove = useCallback(() => onRemove(columnEntryId), [columnEntryId, onRemove]);

  return (
    <div className="sql-column-row d-flex align-items-start">
      {/* Column name – DynamicSelector fetching columns from the connected data source */}
      <div className="col p-0">
        <DynamicSelector
          operation={columnSelectorOperation}
          dependsOn={columnSelectorDependsOn}
          selectedDataSource={selectedDataSource}
          currentAppEnvironmentId={currentAppEnvironmentId}
          options={{ schema, table }}
          value={typeof columnName === 'string' ? columnName : ''}
          propertyKey={columnEntryId}
          optionsChanged={(updatedOptions) => {
            const newColumnName = updatedOptions[columnEntryId];
            if (newColumnName !== undefined) {
              handleColumnNameChange(newColumnName);
            }
          }}
          queryName={queryName}
          label="Column"
          darkMode={darkMode}
          sizeStyles={{ width: '100%', height: '30px', borderRadius: '0 0 0 0' }}
        />
      </div>

      {/* Value – CodeHinter for the column value */}
      <div className="col p-0 sql-column-value-wrapper">
        <div className="sql-column-value-input sql-column-end">
          <CodeHinter
            type="basic"
            initialValue={
              columnValue ? (typeof columnValue === 'string' ? columnValue : JSON.stringify(columnValue)) : columnValue
            }
            className="codehinter-plugins"
            placeholder="value"
            onChange={handleColumnValueChange}
            height="28"
            workspaceConstants={workspaceConstants}
          />
        </div>

        <ButtonSolid
          size="sm"
          variant="ghostBlack"
          className="px-1 rounded-0 border rounded-end sql-column-delete-button"
          onClick={handleRemove}
        >
          <Trash fill="var(--slate9)" style={{ height: '16px' }} />
        </ButtonSolid>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// SqlColumns – public component registered as react-component-sql-columns
// ---------------------------------------------------------------------------

const SqlColumns = React.memo(function SqlColumns({
  getter,
  parseKey,
  options,
  handleOptionChange,
  workspaceConstants,
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

  const currentColumns = readValueMapFromOptions(options, getter, parseKey);
  const columnList = isEmpty(currentColumns) ? [] : Object.values(currentColumns);

  const commitColumns = useCallback(
    (newColumns) => {
      const [changeKey, changeValue] = buildOptionChangeArgs(options, getter, parseKey, newColumns);
      handleOptionChange(changeKey, changeValue);
    },
    [options, getter, parseKey, handleOptionChange]
  );

  const handleAddColumn = useCallback(() => {
    const newColumnId = uuidv4();
    const newColumn = { id: newColumnId, column: '', value: '' };
    const updatedColumns = { ...currentColumns, [newColumnId]: newColumn };
    commitColumns(updatedColumns);
  }, [currentColumns, commitColumns]);

  const handleRemoveColumn = useCallback(
    (columnEntryId) => {
      const updatedColumns = Object.values(currentColumns)
        .filter((columnEntry) => columnEntry.id !== columnEntryId)
        .reduce((accumulator, columnEntry) => {
          accumulator[columnEntry.id] = columnEntry;
          return accumulator;
        }, {});
      commitColumns(updatedColumns);
    },
    [currentColumns, commitColumns]
  );

  const handleColumnNameChange = useCallback(
    (columnEntryId, newName) => {
      const updatedColumns = {
        ...currentColumns,
        [columnEntryId]: { ...currentColumns[columnEntryId], column: newName },
      };
      commitColumns(updatedColumns);
    },
    [currentColumns, commitColumns]
  );

  const handleColumnValueChange = useCallback(
    (columnEntryId, newValue) => {
      const updatedColumns = {
        ...currentColumns,
        [columnEntryId]: { ...currentColumns[columnEntryId], value: newValue },
      };
      commitColumns(updatedColumns);
    },
    [currentColumns, commitColumns]
  );

  return (
    <div className="sql-columns-container">
      {isEmpty(currentColumns) && <NoCondition text="There are no columns" />}

      {columnList.map((columnEntry) => (
        <SqlColumnRow
          key={columnEntry.id}
          columnEntryId={columnEntry.id}
          columnName={columnEntry.column}
          columnValue={columnEntry.value}
          onColumnNameChange={handleColumnNameChange}
          onColumnValueChange={handleColumnValueChange}
          onRemove={handleRemoveColumn}
          workspaceConstants={workspaceConstants}
          darkMode={darkMode}
          columnSelectorOperation={columnSelectorOperation}
          columnSelectorDependsOn={columnSelectorDependsOn}
          selectedDataSource={selectedDataSource}
          currentAppEnvironmentId={currentAppEnvironmentId}
          schema={schema}
          table={table}
          queryName={queryName}
        />
      ))}

      <ButtonSolid
        variant="ghostBlue"
        size="sm"
        onClick={handleAddColumn}
        className={isEmpty(currentColumns) ? 'sql-column-add-button no-columns-above' : 'sql-column-add-button'}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5.34554 10.0207C5.15665 10.0207 4.99832 9.95678 4.87054 9.829C4.74276 9.70123 4.67887 9.54289 4.67887 9.354V5.854H1.17887C0.989985 5.854 0.831651 5.79011 0.703874 5.66234C0.576096 5.53456 0.512207 5.37623 0.512207 5.18734C0.512207 4.99845 0.576096 4.84012 0.703874 4.71234C0.831651 4.58456 0.989985 4.52067 1.17887 4.52067H4.67887V1.02067C4.67887 0.831782 4.74276 0.673448 4.87054 0.54567C4.99832 0.417893 5.15665 0.354004 5.34554 0.354004C5.53443 0.354004 5.69276 0.417893 5.82054 0.54567C5.94832 0.673448 6.01221 0.831782 6.01221 1.02067V4.52067H9.51221C9.7011 4.52067 9.85943 4.58456 9.98721 4.71234C10.115 4.84012 10.1789 4.99845 10.1789 5.18734C10.1789 5.37623 10.115 5.53456 9.98721 5.66234C9.85943 5.79011 9.7011 5.854 9.51221 5.854H6.01221V9.354C6.01221 9.54289 5.94832 9.70123 5.82054 9.829C5.69276 9.95678 5.53443 10.0207 5.34554 10.0207Z"
            fill="#466BF2"
          />
        </svg>
        &nbsp;Add column
      </ButtonSolid>
    </div>
  );
});

export default SqlColumns;
