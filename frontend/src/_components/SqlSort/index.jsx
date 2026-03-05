import React, { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import DropDownSelect from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import { NoCondition } from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/NoConditionUI';
import { SQL_SORT_ORDER_OPTIONS } from './sortOrderConstants';
import { readValueMapFromOptions, buildOptionChangeArgs } from '@/_helpers/sqlQuerySharedUtils';
import './SqlSort.scss';

// ---------------------------------------------------------------------------
// SqlSortRow – a single sort condition row (column / direction)
// ---------------------------------------------------------------------------

const SqlSortRow = React.memo(function SqlSortRow({
  sortEntryId,
  columnValue,
  orderValue,
  onColumnChange,
  onOrderChange,
  onRemove,
  darkMode,
  workspaceConstants,
}) {
  const selectedOrder = SQL_SORT_ORDER_OPTIONS.find((option) => option.value === orderValue) ?? null;

  const handleColumnChange = useCallback(
    (newColumn) => onColumnChange(sortEntryId, newColumn),
    [sortEntryId, onColumnChange]
  );

  const handleOrderChange = useCallback(
    (selectedOption) => onOrderChange(sortEntryId, selectedOption.value),
    [sortEntryId, onOrderChange]
  );

  const handleRemove = useCallback(() => onRemove(sortEntryId), [sortEntryId, onRemove]);

  return (
    <div className="sql-sort-row d-flex align-items-start">
      {/* Column – CodeHinter so the user can type the column name */}
      <div className="col p-0">
        <CodeHinter
          type="basic"
          initialValue={typeof columnValue === 'string' ? columnValue : ''}
          placeholder="Enter column"
          onChange={handleColumnChange}
          height="30"
          enablePreview={false}
          workspaceConstants={workspaceConstants}
        />
      </div>

      {/* Direction – dropdown (Ascending / Descending) */}
      <div className="col p-0 sql-sort-order-wrapper">
        <div className="sql-sort-order-input">
          <DropDownSelect
            useMenuPortal={true}
            placeholder="Direction"
            value={selectedOrder}
            options={SQL_SORT_ORDER_OPTIONS}
            onChange={handleOrderChange}
            buttonClasses="border border-start-0 border-end-0 overflow-hidden"
            showPlaceHolder
            darkMode={darkMode}
          />
        </div>

        <ButtonSolid
          size="sm"
          variant="ghostBlack"
          className="px-1 rounded-0 border rounded-end sql-sort-delete-button"
          onClick={handleRemove}
        >
          <Trash fill="var(--slate9)" style={{ height: '16px' }} />
        </ButtonSolid>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// SqlSort – public component registered as react-component-sql-sort
// ---------------------------------------------------------------------------

const SqlSort = React.memo(function SqlSort({
  getter,
  parseKey,
  options,
  handleOptionChange,
  darkMode,
  workspaceConstants,
}) {
  const currentSortEntries = readValueMapFromOptions(options, getter, parseKey);
  const sortList = isEmpty(currentSortEntries) ? [] : Object.values(currentSortEntries);

  const commitSortEntries = useCallback(
    (newSortEntries) => {
      const [changeKey, changeValue] = buildOptionChangeArgs(options, getter, parseKey, newSortEntries);
      handleOptionChange(changeKey, changeValue);
    },
    [options, getter, parseKey, handleOptionChange]
  );

  const handleAddSortEntry = useCallback(() => {
    const newSortEntryId = uuidv4();
    const newSortEntry = { id: newSortEntryId, column: '', order: '' };
    const updatedSortEntries = { ...currentSortEntries, [newSortEntryId]: newSortEntry };
    commitSortEntries(updatedSortEntries);
  }, [currentSortEntries, commitSortEntries]);

  const handleRemoveSortEntry = useCallback(
    (sortEntryId) => {
      const updatedSortEntries = Object.values(currentSortEntries)
        .filter((sortEntry) => sortEntry.id !== sortEntryId)
        .reduce((accumulator, sortEntry) => {
          accumulator[sortEntry.id] = sortEntry;
          return accumulator;
        }, {});
      commitSortEntries(updatedSortEntries);
    },
    [currentSortEntries, commitSortEntries]
  );

  const handleColumnChange = useCallback(
    (sortEntryId, newColumn) => {
      const updatedSortEntries = {
        ...currentSortEntries,
        [sortEntryId]: { ...currentSortEntries[sortEntryId], column: newColumn },
      };
      commitSortEntries(updatedSortEntries);
    },
    [currentSortEntries, commitSortEntries]
  );

  const handleOrderChange = useCallback(
    (sortEntryId, newOrder) => {
      const updatedSortEntries = {
        ...currentSortEntries,
        [sortEntryId]: { ...currentSortEntries[sortEntryId], order: newOrder },
      };
      commitSortEntries(updatedSortEntries);
    },
    [currentSortEntries, commitSortEntries]
  );

  return (
    <div className="sql-sort-container">
      {isEmpty(currentSortEntries) && <NoCondition />}

      {sortList.map((sortEntry) => (
        <SqlSortRow
          key={sortEntry.id}
          sortEntryId={sortEntry.id}
          columnValue={sortEntry.column}
          orderValue={sortEntry.order}
          onColumnChange={handleColumnChange}
          onOrderChange={handleOrderChange}
          onRemove={handleRemoveSortEntry}
          darkMode={darkMode}
          workspaceConstants={workspaceConstants}
        />
      ))}

      <ButtonSolid
        variant="ghostBlue"
        size="sm"
        onClick={handleAddSortEntry}
        className={isEmpty(currentSortEntries) ? 'sql-sort-add-button no-sort-entries-above' : 'sql-sort-add-button'}
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

export default SqlSort;
