import React, { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { isEmpty } from 'lodash';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import DropDownSelect from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import { NoCondition } from '@/AppBuilder/QueryManager/QueryEditors/TooljetDatabase/NoConditionUI';
import { SQL_FILTER_OPERATORS, SQL_FILTER_IS_OPERATOR_OPTIONS } from './filterOperatorConstants';
import './SqlFilters.scss';

/**
 * Reads the filter map from the options object.
 *
 * When a parseKey is provided (e.g. 'list_rows.where_filters') the function
 * traverses the options object along that dot-separated path.
 * When no parseKey is provided it falls back to options[getter].
 */
function readFiltersFromOptions(options, getter, parseKey) {
  if (parseKey) {
    const pathSegments = parseKey.split('.');
    let current = options;
    for (const segment of pathSegments) {
      current = current?.[segment];
    }
    return current ?? {};
  }
  return options?.[getter] ?? {};
}

/**
 * Builds the arguments for handleOptionChange after a filter update.
 *
 * When parseKey is 'list_rows.where_filters' the function updates
 * options['list_rows'] with the new where_filters object and returns
 * ['list_rows', updatedListRowsObject].
 * When no parseKey is provided it returns [getter, newFilters].
 */
function buildOptionChangeArgs(options, getter, parseKey, newFilters) {
  if (parseKey) {
    const pathSegments = parseKey.split('.');
    const topLevelKey = pathSegments[0];
    const nestedSegments = pathSegments.slice(1);

    // Deep-clone only the affected path so siblings stay untouched.
    const updatedTopLevelObject = { ...options?.[topLevelKey] };
    let pointer = updatedTopLevelObject;

    for (let index = 0; index < nestedSegments.length - 1; index++) {
      pointer[nestedSegments[index]] = { ...pointer[nestedSegments[index]] };
      pointer = pointer[nestedSegments[index]];
    }

    pointer[nestedSegments[nestedSegments.length - 1]] = newFilters;

    return [topLevelKey, updatedTopLevelObject];
  }

  return [getter, newFilters];
}

// ---------------------------------------------------------------------------
// SqlFilterRow – a single filter condition row (column / operator / value)
// ---------------------------------------------------------------------------

const SqlFilterRow = React.memo(function SqlFilterRow({
  filterId,
  columnValue,
  operatorValue,
  filterValue,
  onColumnChange,
  onOperatorChange,
  onValueChange,
  onRemove,
  darkMode,
}) {
  const selectedOperator = SQL_FILTER_OPERATORS.find((operator) => operator.value === operatorValue) ?? null;
  const isIsOperatorSelected = operatorValue === 'is';

  const handleColumnChange = useCallback(
    (newColumn) => {
      onColumnChange(filterId, newColumn);
    },
    [filterId, onColumnChange]
  );

  const handleOperatorChange = useCallback(
    (selectedOption) => {
      onOperatorChange(filterId, selectedOption.value);
    },
    [filterId, onOperatorChange]
  );

  const handleValueChange = useCallback(
    (newValue) => {
      onValueChange(filterId, newValue);
    },
    [filterId, onValueChange]
  );

  const handleIsOperatorValueChange = useCallback(
    (selectedOption) => {
      onValueChange(filterId, selectedOption.value);
    },
    [filterId, onValueChange]
  );

  const handleRemove = useCallback(() => {
    onRemove(filterId);
  }, [filterId, onRemove]);

  // Applicable for Null or Not null drop down
  const currentValueForDropdown = SQL_FILTER_IS_OPERATOR_OPTIONS.find((opt) => opt.value === filterValue) ?? null;

  return (
    <div className="sql-filter-row d-flex align-items-start">
      {/* Column – CodeHinter so the user can type or use dynamic expressions */}
      <div className="col p-0 ">
        <CodeHinter
          type="basic"
          initialValue={typeof columnValue === 'string' ? columnValue : ''}
          placeholder="Enter column"
          onChange={handleColumnChange}
          height="28"
          enablePreview={false}
          className="rounded-start overflow-hidden"
        />
      </div>

      {/* Operator – dropdown */}
      <div className="col p-0">
        <DropDownSelect
          useMenuPortal={true}
          placeholder="Operator"
          value={selectedOperator}
          options={SQL_FILTER_OPERATORS}
          onChange={handleOperatorChange}
          buttonClasses="border border-start-0 border-end-0 overflow-hidden"
          showPlaceHolder
          darkMode={darkMode}
        />
      </div>

      {/* Value – DropDownSelect for 'is' operator, CodeHinter otherwise */}
      <div className="col p-0 sql-filter-value-wrapper">
        <div className="sql-filter-value-input sql-filter-end">
          {isIsOperatorSelected ? (
            <DropDownSelect
              useMenuPortal={true}
              placeholder="Select value"
              value={currentValueForDropdown}
              options={SQL_FILTER_IS_OPERATOR_OPTIONS}
              onChange={handleIsOperatorValueChange}
              buttonClasses="border border-end-0 rounded-start overflow-hidden"
              showPlaceHolder
              darkMode={darkMode}
            />
          ) : (
            <CodeHinter
              type="basic"
              initialValue={
                filterValue
                  ? typeof filterValue === 'string'
                    ? filterValue
                    : JSON.stringify(filterValue)
                  : filterValue
              }
              className="codehinter-plugins codehinter-end"
              placeholder="value"
              onChange={handleValueChange}
              height="28"
            />
          )}
        </div>

        <ButtonSolid
          size="sm"
          variant="ghostBlack"
          className="px-1 rounded-0 border rounded-end sql-filter-delete-button"
          onClick={handleRemove}
        >
          <Trash fill="var(--slate9)" style={{ height: '16px' }} />
        </ButtonSolid>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// SqlFilters – public component registered as react-component-sql-filters
// ---------------------------------------------------------------------------

const SqlFilters = React.memo(function SqlFilters({ getter, parseKey, options, handleOptionChange, darkMode }) {
  const currentFilters = readFiltersFromOptions(options, getter, parseKey);
  const filterList = isEmpty(currentFilters) ? [] : Object.values(currentFilters);

  const commitFilters = useCallback(
    (newFilters) => {
      const [changeKey, changeValue] = buildOptionChangeArgs(options, getter, parseKey, newFilters);
      handleOptionChange(changeKey, changeValue);
    },
    [options, getter, parseKey, handleOptionChange]
  );

  const handleAddFilter = useCallback(() => {
    const newFilterId = uuidv4();
    const newFilter = { id: newFilterId, column: '', operator: '', value: '' };
    const updatedFilters = { ...currentFilters, [newFilterId]: newFilter };
    commitFilters(updatedFilters);
  }, [currentFilters, commitFilters]);

  const handleRemoveFilter = useCallback(
    (filterId) => {
      const updatedFilters = Object.values(currentFilters)
        .filter((existingFilter) => existingFilter.id !== filterId)
        .reduce((accumulator, existingFilter) => {
          accumulator[existingFilter.id] = existingFilter;
          return accumulator;
        }, {});
      commitFilters(updatedFilters);
    },
    [currentFilters, commitFilters]
  );

  const handleColumnChange = useCallback(
    (filterId, newColumn) => {
      const updatedFilters = {
        ...currentFilters,
        [filterId]: { ...currentFilters[filterId], column: newColumn },
      };
      commitFilters(updatedFilters);
    },
    [currentFilters, commitFilters]
  );

  const handleOperatorChange = useCallback(
    (filterId, newOperator) => {
      const updatedFilters = {
        ...currentFilters,
        [filterId]: { ...currentFilters[filterId], operator: newOperator },
      };
      commitFilters(updatedFilters);
    },
    [currentFilters, commitFilters]
  );

  const handleValueChange = useCallback(
    (filterId, newValue) => {
      const updatedFilters = {
        ...currentFilters,
        [filterId]: { ...currentFilters[filterId], value: newValue },
      };
      commitFilters(updatedFilters);
    },
    [currentFilters, commitFilters]
  );

  return (
    <div className="sql-filters-container">
      {isEmpty(currentFilters) && <NoCondition />}

      {filterList.map((filter) => (
        <SqlFilterRow
          key={filter.id}
          filterId={filter.id}
          columnValue={filter.column}
          operatorValue={filter.operator}
          filterValue={filter.value}
          onColumnChange={handleColumnChange}
          onOperatorChange={handleOperatorChange}
          onValueChange={handleValueChange}
          onRemove={handleRemoveFilter}
          darkMode={darkMode}
        />
      ))}

      <ButtonSolid
        variant="ghostBlue"
        size="sm"
        onClick={handleAddFilter}
        className={
          isEmpty(currentFilters)
            ? 'sql-filter-add-condition-button no-filters-above'
            : 'sql-filter-add-condition-button'
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

export default SqlFilters;
