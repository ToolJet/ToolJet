import React, { useContext, useMemo, useState } from 'react';
import { NoCondition } from './NoConditionUI';
import './style.scss'; // Ensure the path is correct based on your project structure
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { isEmpty } from 'lodash';
import { SelectBox } from './Select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import { v4 as uuidv4 } from 'uuid';
import { ToolTip } from '@/_components/ToolTip';
import { Confirm } from '@/Editor/Viewer/Confirm';
export const AggregateUi = ({ darkMode, operation = '' }) => {
  const {
    columns,
    listRowsOptions,
    selectedTableId,
    handleOptionsChange,
    joinTableOptionsChange,
    joinTableOptions,
    tables,
    joinOptions,
    tableInfo,
    findTableDetails,
  } = useContext(TooljetDatabaseContext);
  const operationDetails = operation === 'listRows' ? listRowsOptions : joinTableOptions;
  const handleChange = operation === 'listRows' ? handleOptionsChange : joinTableOptionsChange;

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const addNewAggregateOption = () => {
    const currentAggregates = { ...(operationDetails?.aggregates || {}) };
    const uniqueId = uuidv4();
    const newAggregate = { aggFx: '', column: '', tableId: '' };
    const updatedAggregates = {
      ...currentAggregates,
      [uniqueId]: newAggregate,
    };
    handleChange('aggregates', updatedAggregates);
  };

  const handleAggregateOptionChange = (key, selecetdValue, optionToUpdate) => {
    const currentAggregates = { ...(operationDetails?.aggregates || {}) };
    const aggregateToUpdate = {
      ...currentAggregates[key],
      [optionToUpdate]: selecetdValue,
    };
    const updatedAggregates = {
      ...currentAggregates,
      [key]: aggregateToUpdate,
    };
    console.log('db :: handleAggregateOptionChange', { key, selecetdValue, optionToUpdate, updatedAggregates });
    handleChange('aggregates', updatedAggregates);
  };

  const handleDeleteAggregate = (aggregateKey) => {
    const currentAggregates = { ...(operationDetails?.aggregates || {}) };
    const numberOfAggregates = Object.keys(currentAggregates).length;
    if (numberOfAggregates > 1) {
      delete currentAggregates[aggregateKey];
      return handleChange('aggregates', currentAggregates);
    } else {
      const currentGroupBy = { ...(operationDetails?.group_by || {}) };
      const isValidGroupByPresent = Object.entries(currentGroupBy).some(([tableId, selectedColumn]) => {
        if (tableId && selectedColumn.length >= 1) {
          return true;
        }
        return false;
      });
      if (isValidGroupByPresent) {
        setShowDeleteConfirmation(true);
      } else {
        delete currentAggregates[aggregateKey];
        return handleChange('aggregates', currentAggregates);
      }
    }
  };

  const executeAggregateDeletion = async (aggregateKey) => {
    const currentAggregates = { ...(operationDetails?.aggregates || {}) };
    delete currentAggregates[aggregateKey];
    const currentGroupBy = { ...(operationDetails?.group_by || {}) };
    delete currentGroupBy?.[selectedTableId];

    handleChange('group_by', currentGroupBy);
    handleChange('aggregates', currentAggregates);
  };

  const handleGroupByChange = (selectedTableId, value) => {
    const currentGroupBy = { ...(operationDetails?.group_by || {}) };
    const updatedGroupBy = {
      ...currentGroupBy,
      [selectedTableId]: value,
    };
    handleChange('group_by', updatedGroupBy);
  };

  const columnAccessorsOptions = useMemo(() => {
    return columns.map((column) => {
      return {
        label: column.accessor,
        value: column.accessor,
      };
    });
  }, [columns]);

  const disableGroupBy = () => {
    const currentAggregates = { ...(operationDetails?.aggregates || {}) };
    const isAnyAggregateTruthyValue = isEmpty(currentAggregates)
      ? false
      : Object.values(currentAggregates).some((aggregate) => {
          if (aggregate.aggFx && aggregate.column) {
            return true;
          } else {
            return false;
          }
        });
    return !isAnyAggregateTruthyValue;
  };
  const getTableName = (id) => {
    return tables.find((table) => table.table_id === id)?.table_name;
  };

  const getTableList = () => {
    const tableList = [];

    const tableSet = new Set();
    (joinOptions || []).forEach((join) => {
      const { table, conditions } = join;
      tableSet.add(table);
      conditions?.conditionsList?.forEach((condition) => {
        const { leftField, rightField } = condition;
        if (leftField?.table) {
          tableSet.add(leftField?.table);
        }
        if (rightField?.table) {
          tableSet.add(rightField?.table);
        }
      });
    });

    const tablesDetails = [...tableSet];

    tablesDetails.forEach((tableId) => {
      const tableDetails = findTableDetails(tableId);
      if (tableDetails?.table_name && tableInfo[tableDetails.table_name]) {
        const tableDetailsForDropDown = {
          label: tableDetails.table_name,
          value: tableId,
          options:
            tableInfo[tableDetails.table_name]?.map((columns) => ({
              label: columns.Header,
              value: columns.Header + '-' + tableId,
              tableId: tableId,
              tableName: tableDetails?.table_name,
            })) || [],
        };
        tableList.push(tableDetailsForDropDown);
      }
    });
    return tableList;
  };

  const getColumnsDetails = (tableId) => {
    const tableDetails = findTableDetails(tableId);
    return tableInfo?.[tableDetails?.table_name]?.map((columns) => ({
      label: columns.Header,
      value: columns.Header,
    }));
  };

  return (
    <>
      <div className="d-flex mb-2">
        <label className="form-label" data-cy="label-column-filter">
          Aggregate
        </label>
        <div className="field-container col d-flex custom-gap-8 flex-column ">
          {isEmpty(operationDetails?.aggregates || {}) && <NoCondition />}
          {operationDetails?.aggregates &&
            !isEmpty(operationDetails?.aggregates) &&
            Object.entries(operationDetails.aggregates).map(([aggregateKey, aggregateDetails]) => {
              console.log('man ::', { aggregateDetails });
              return (
                <div key={aggregateKey} className="d-flex flex-row ">
                  <div
                    style={{ minWidth: '25%', borderRadius: '4px 0 0 4px' }}
                    className="border overflow-hidden border-width-except-right"
                  >
                    <SelectBox
                      width="25%"
                      height="32"
                      value={aggregateDetails.aggFx}
                      options={[
                        { label: 'Sum', value: 'sum', description: 'Sum of all values in this column' },
                        {
                          label: 'Count',
                          value: 'count',
                          description: 'Count number of not null values in this column',
                        },
                      ]}
                      placeholder="Select..."
                      handleChange={(value) => handleAggregateOptionChange(aggregateKey, value, 'aggFx')}
                      darkMode={darkMode}
                    />
                  </div>
                  <div style={{ flex: '1', borderRadius: '0 4px 4px 0' }} className="border border-width-except-right">
                    <SelectBox
                      height="32"
                      width="100%"
                      value={
                        operation === 'joinTable'
                          ? {
                              ...aggregateDetails.column,
                              label: aggregateDetails.column.tableName + '.' + aggregateDetails.column.label,
                            }
                          : aggregateDetails.column
                      }
                      options={operation === 'joinTable' ? getTableList() : columnAccessorsOptions}
                      handleChange={(value) => handleAggregateOptionChange(aggregateKey, value, 'column')}
                      darkMode={darkMode}
                      placeholder="Select column..."
                    />
                  </div>
                  <div
                    style={{ width: '32px', minWidth: '32px', borderRadius: '0 4px 4px 0' }}
                    className="d-flex justify-content-center align-items-center border"
                    onClick={() => handleDeleteAggregate(aggregateKey)}
                  >
                    <SolidIcon name="trash" width="16" fill="var(--slate9)" />
                  </div>
                  <Confirm
                    show={showDeleteConfirmation}
                    message={
                      'Deleting the aggregate function will alo delete the  group by conditions. Are you sure, you want to continue?'
                    }
                    // confirmButtonLoading={isDeletingQueryInProcess}
                    onConfirm={() => executeAggregateDeletion(aggregateKey)}
                    onCancel={() => setShowDeleteConfirmation(false)}
                    darkMode={darkMode}
                  />
                </div>
              );
            })}

          <ButtonSolid
            variant="ghostBlue"
            size="sm"
            onClick={() => {
              addNewAggregateOption();
            }}
            className={`${
              isEmpty(operationDetails?.aggregates || {}) ? '' : 'mt-2'
            } d-flex justify-content-start width-fit-content`}
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
      </div>
      <div className="d-flex mb-2">
        <label className="form-label" data-cy="label-column-filter">
          Group by
        </label>
        <div className="field-container col ">
          {/* tooltip is not working */}
          {operation === 'listRows' && (
            <div className="border rounded">
              <SelectBox
                width="100%"
                height="32"
                value={operationDetails?.group_by?.[selectedTableId]}
                options={columnAccessorsOptions}
                placeholder={`Select column(s) to group by`}
                isMulti={true}
                handleChange={(value) => handleGroupByChange(selectedTableId, value)}
                disabled={disableGroupBy()}
                darkMode={darkMode}
                showTooltip={disableGroupBy()}
              />
            </div>
          )}
          {operation === 'joinTable' && (
            <div className="d-flex flex-column custom-gap-8">
              <div className="border rounded d-flex">
                <div
                  style={{ width: '15%', padding: '4px 8px' }}
                  className="border border-only-right d-flex align-items-center"
                >
                  {getTableName(selectedTableId)}
                </div>
                <div style={{ width: '85%' }}>
                  <SelectBox
                    width="100%"
                    height="32"
                    value={operationDetails?.group_by?.[selectedTableId]}
                    options={getColumnsDetails(selectedTableId)}
                    placeholder={`Select column(s) to group by`}
                    isMulti={true}
                    handleChange={(value) => handleGroupByChange(selectedTableId, value)}
                    disabled={disableGroupBy()}
                    darkMode={darkMode}
                    showTooltip={disableGroupBy()}
                  />
                </div>
              </div>
              {joinTableOptions?.joins?.map((table) => {
                return (
                  <div key={table.table} className="border rounded d-flex">
                    <div
                      style={{ width: '15%', padding: '4px 8px' }}
                      className="border border-only-right d-flex align-items-center"
                    >
                      {getTableName(table.table)}
                    </div>
                    <div style={{ width: '85%' }}>
                      <SelectBox
                        width="100%"
                        height="32"
                        value={operationDetails?.group_by?.[table.table]}
                        options={getColumnsDetails(table.table)}
                        placeholder={`Select column(s) to group by`}
                        isMulti={true}
                        handleChange={(value) => handleGroupByChange(table.table, value)}
                        disabled={disableGroupBy()}
                        darkMode={darkMode}
                        showTooltip={disableGroupBy()}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
