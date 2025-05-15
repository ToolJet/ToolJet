import React, { useContext, useMemo, useState } from 'react';
import { NoCondition } from '../NoConditionUI';
import './style.scss';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import { isEmpty } from 'lodash';
import { SelectBox } from './Select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { TooljetDatabaseContext } from '@/TooljetDatabase/index';
import { v4 as uuidv4 } from 'uuid';
import { Confirm } from '@/Editor/Viewer/Confirm';
import { toast } from 'react-hot-toast';
import { ToolTip } from '@/_components';
export const AggregateFilter = ({ darkMode, operation = '' }) => {
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
  const operationDetails = useMemo(() => {
    switch (operation) {
      case 'listRows':
        return listRowsOptions;
      case 'joinTable':
        return joinTableOptions;
      default:
        return {};
    }
  }, [operation, listRowsOptions, joinTableOptions]);

  const handleChange = useMemo(() => {
    switch (operation) {
      case 'listRows':
        return handleOptionsChange;
      case 'joinTable':
        return joinTableOptionsChange;
      default:
        return () => {};
    }
  }, [operation, handleOptionsChange, joinTableOptionsChange]);

  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [currentAggregateKeyForDeleteConfirmation, setCurrentAggregateKeyForDeleteConfirmation] = useState(null);

  const addNewAggregateOption = () => {
    const currentAggregates = { ...(operationDetails?.aggregates || {}) };
    const uniqueId = uuidv4();
    const newAggregate = { aggFx: '', column: '' };
    const updatedAggregates = {
      ...currentAggregates,
      [uniqueId]: newAggregate,
    };
    handleChange('aggregates', updatedAggregates);
  };

  const handleAggregateOptionChange = (key, selectedValue, optionToUpdate) => {
    const currentAggregates = { ...(operationDetails?.aggregates || {}) };

    const getValue = (operation, optionToUpdate, selectedValue) => {
      if (optionToUpdate === 'aggFx') {
        return selectedValue.value;
      } else if (optionToUpdate === 'column') {
        switch (operation) {
          case 'listRows':
            return selectedValue.value;
          case 'joinTable': {
            const value = selectedValue.value.split('-')[0];
            return value;
          }
          default:
            break;
        }
      }
    };

    const value = getValue(operation, optionToUpdate, selectedValue);
    const tableIdExist = selectedValue.hasOwnProperty('tableId');
    const aggregateToUpdate = {
      ...currentAggregates[key],
      [optionToUpdate]: value,
      ...(tableIdExist && { table_id: selectedValue.tableId }),
    };
    const updatedAggregates = {
      ...currentAggregates,
      [key]: aggregateToUpdate,
    };
    handleChange('aggregates', updatedAggregates);
  };

  const showConfirmationMoalForLastFilledValue = (currentAggregates, aggregateKey) => {
    if (!currentAggregates[aggregateKey]) {
      return false;
    }

    // Check if all values for the matched key are truthy
    const allValuesTruthy = Object.values(currentAggregates[aggregateKey]).every((value) => Boolean(value));
    if (!allValuesTruthy) {
      return false;
    }

    // Check if the rest of the keys have values that are either all empty or partially filled
    const keys = Object.keys(currentAggregates);
    for (const key of keys) {
      if (key !== aggregateKey) {
        const values = Object.values(currentAggregates[key]);
        const allEmpty = values.every((value) => value === '');
        const partiallyFilled = values.some((value) => value !== '') && values.some((value) => value === '');

        if (!(allEmpty || partiallyFilled)) {
          return false;
        }
      }
    }

    return true;
  };

  const handleDeleteAggregate = (aggregateKey) => {
    const currentAggregates = { ...(operationDetails?.aggregates || {}) };
    const numberOfAggregates = Object.keys(currentAggregates).length;
    const currentGroupBy = { ...(operationDetails?.group_by || {}) };
    const showConfirmationModal = showConfirmationMoalForLastFilledValue(currentAggregates, aggregateKey);

    const isValidGroupByPresent = Object.values(currentGroupBy).some((selectedColumn) => selectedColumn.length >= 1);

    const deleteAggregate = () => {
      delete currentAggregates[aggregateKey];
      handleChange('aggregates', currentAggregates);
      return toast.success('Aggregate function deleted successfully!');
    };

    const showError = () => {
      return toast.error('Could not delete aggregate function. Please try again!');
    };

    try {
      if (numberOfAggregates > 1) {
        if (showConfirmationModal && isValidGroupByPresent) {
          setCurrentAggregateKeyForDeleteConfirmation(aggregateKey);
          setShowDeleteConfirmation(true);
          return;
        } else {
          deleteAggregate();
          return;
        }
      } else {
        if (isValidGroupByPresent) {
          setCurrentAggregateKeyForDeleteConfirmation(aggregateKey);
          setShowDeleteConfirmation(true);
          return;
        } else {
          deleteAggregate();
          return;
        }
      }
    } catch (error) {
      showError();
      return;
    }
  };

  const executeAggregateDeletion = () => {
    const aggregateKey = currentAggregateKeyForDeleteConfirmation || '';

    try {
      if (!aggregateKey) {
        throw new Error('Could not delete aggregate function. Please try again!');
      }
      const currentAggregates = { ...(operationDetails?.aggregates || {}) };
      delete currentAggregates[aggregateKey];
      const currentGroupBy = {};

      handleChange('group_by', currentGroupBy);
      handleChange('aggregates', currentAggregates);
      toast.success('Aggregate function deleted successfully!');
      return;
    } catch (error) {
      return toast.error('Could not delete aggregate function. Please try again!');
    }
  };

  const handleGroupByChange = (selectedTableId, value) => {
    const currentGroupBy = { ...(operationDetails?.group_by || {}) };
    const validValueData = value?.reduce((acc, val) => {
      if (typeof val === 'object' && !acc.some((option) => option === val.value)) {
        acc.push(val.value);
      } else if (typeof val !== 'object' && !acc.some((option) => option === val.value)) {
        acc.push(val);
      }
      return acc;
    }, []);
    const updatedGroupBy = {
      ...currentGroupBy,
      [selectedTableId]: validValueData,
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

  const tableListOptions = useMemo(() => {
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
  }, [joinOptions, tableInfo]);

  const getColumnsDetails = (tableId) => {
    const tableDetails = findTableDetails(tableId);
    return tableInfo?.[tableDetails?.table_name]?.map((columns) => ({
      label: columns.Header,
      value: columns.Header,
    }));
  };

  const aggFxOptions = [
    {
      label: 'Sum',
      value: 'sum',
      description: 'Sum of all values in this column',
    },
    {
      label: 'Count',
      value: 'count',
      description: 'Count number of not null values in this column',
    },
  ];

  const getJoinTableOption = (value, tableId) => {
    const valueToFilter = `${value}-${tableId}`;
    let foundOption = null; // Use a variable to store the found option

    tableListOptions?.forEach((singleOption) => {
      if (foundOption) return; // Exit early if foundOption is set
      singleOption?.options?.some((option) => {
        if (option.value === valueToFilter) {
          foundOption = {
            value: valueToFilter.split('-')[0],
            label: option.tableName + '.' + option.label,
            table: tableId,
          };
          return true; // Exit the some loop early
        }
        return false; // Continue the some loop
      });
    });

    return foundOption || {};
  };

  const getListRowsOption = (value) => {
    const option = columnAccessorsOptions?.find((option) => option?.value === value);
    return option || {};
  };

  const constructAggregateValue = (value, operation, option, tableId = '') => {
    if (option === 'aggFx') {
      const option = aggFxOptions.find((option) => option?.value === value);
      return option || {};
    }
    if (option === 'column') {
      if (operation === 'joinTable') {
        return getJoinTableOption(value, tableId);
      } else if (operation === 'listRows') {
        return getListRowsOption(value);
      }
    }
  };

  const constructGroupByValue = (value) => {
    return (
      value?.map((val) => {
        return {
          label: val,
          value: val,
        };
      }) || []
    );
  };

  const selectedTableName = getTableName(selectedTableId);

  const isGroupByTableNameTruncated = (text) => {
    const container = document.querySelector('.truncate-container');
    const textElement = document.createElement('span');
    textElement.innerText = text;
    document.body.append(textElement);
    const isTruncated = textElement?.offsetWidth > container?.offsetWidth;
    document.body.removeChild(textElement);
    return isTruncated;
  };

  return (
    <>
      <div className="d-flex" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label flex-shrink-0" data-cy="label-column-filter">
          Aggregate
        </label>
        <div
          className={`field-container col d-flex custom-gap-8 flex-column ${
            !isEmpty(operationDetails?.aggregates) && 'minw-400-w-400'
          }`}
        >
          {isEmpty(operationDetails?.aggregates || {}) && <NoCondition />}
          {operationDetails?.aggregates &&
            !isEmpty(operationDetails?.aggregates) &&
            Object.entries(operationDetails.aggregates).map(([aggregateKey, aggregateDetails]) => {
              return (
                <div key={aggregateKey} className="d-flex flex-row ">
                  <div
                    style={{ minWidth: '25%', borderRadius: '4px 0 0 4px' }}
                    className="border overflow-hidden border-width-except-right"
                  >
                    <SelectBox
                      width="25%"
                      height="32"
                      value={constructAggregateValue(aggregateDetails.aggFx, operation, 'aggFx')}
                      options={aggFxOptions}
                      placeholder="Select..."
                      handleChange={(value) => handleAggregateOptionChange(aggregateKey, value, 'aggFx')}
                      darkMode={darkMode}
                      showDescription={true}
                    />
                  </div>
                  <div style={{ flex: '1' }} className="border border-width-except-right">
                    <SelectBox
                      height="32"
                      width="100%"
                      value={
                        operation === 'joinTable'
                          ? constructAggregateValue(
                              aggregateDetails.column,
                              'joinTable',
                              'column',
                              aggregateDetails?.table_id
                            )
                          : constructAggregateValue(aggregateDetails.column, 'listRows', 'column')
                      }
                      options={operation === 'joinTable' ? tableListOptions : columnAccessorsOptions}
                      handleChange={(value) => handleAggregateOptionChange(aggregateKey, value, 'column')}
                      darkMode={darkMode}
                      placeholder="Select column..."
                    />
                  </div>
                  <div
                    style={{
                      width: '32px',
                      minWidth: '32px',
                      borderRadius: '0 4px 4px 0',
                    }}
                    className="d-flex justify-content-center align-items-center border"
                    onClick={() => handleDeleteAggregate(aggregateKey)}
                  >
                    <SolidIcon name="trash" width="16" fill="var(--slate9)" />
                  </div>
                  <Confirm
                    show={showDeleteConfirmation}
                    message={
                      'Deleting the aggregate function will also delete the  group by conditions. Are you sure, you want to continue?'
                    }
                    // confirmButtonLoading={isDeletingQueryInProcess}
                    onConfirm={() => {
                      executeAggregateDeletion();
                    }}
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
            className={`d-flex justify-content-start width-fit-content`}
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
      <div className="d-flex" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label flex-shrink-0" data-cy="label-column-filter">
          Group by
        </label>
        <div className="field-container col minw-400-w-400">
          {/* tooltip is not working */}
          {operation === 'listRows' && (
            <div className="border rounded ">
              <SelectBox
                width="100%"
                height="32"
                value={constructGroupByValue(operationDetails?.group_by?.[selectedTableId])}
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
            <div className="d-flex flex-column custom-gap-8 join-group-bys ">
              <div className="border rounded d-flex">
                <ToolTip
                  message={selectedTableName}
                  placement="top"
                  tooltipClassName="tjdb-cell-tooltip"
                  show={isGroupByTableNameTruncated(selectedTableName)}
                >
                  <div
                    style={{ width: '25%', padding: '4px 8px' }}
                    className="border border-only-right d-block align-items-center text-truncate truncate-container"
                  >
                    {selectedTableName}
                  </div>
                </ToolTip>
                <div style={{ width: '75%' }}>
                  <SelectBox
                    width="100%"
                    height="32"
                    value={constructGroupByValue(operationDetails?.group_by?.[selectedTableId])}
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
                if (table.hasOwnProperty('table') && table.table) {
                  const tableName = getTableName(table.table); // Replace with your dynamic text
                  const isTextTruncated = isGroupByTableNameTruncated(tableName);
                  const tableNameEmpty = !tableName;
                  const showTooltip = tableNameEmpty || isTextTruncated;
                  const toolTipMessage = tableNameEmpty ? 'Please select joining table to see its name' : tableName;
                  return (
                    <div key={table.table} className="border rounded d-flex">
                      <ToolTip
                        message={toolTipMessage}
                        placement="top"
                        tooltipClassName="tjdb-cell-tooltip"
                        show={showTooltip}
                      >
                        <div
                          style={{ width: '25%', padding: '4px 8px' }}
                          className="border border-only-right d-block align-items-center text-truncate group-by-trunate"
                        >
                          {tableName}
                        </div>
                      </ToolTip>
                      <div style={{ width: '75%' }}>
                        <SelectBox
                          width="100%"
                          height="32"
                          value={constructGroupByValue(operationDetails?.group_by?.[table.table])}
                          options={getColumnsDetails(table.table)}
                          placeholder={`Select column(s) to group by`}
                          isMulti={true}
                          handleChange={(value) => handleGroupByChange(table.table, value)}
                          disabled={disableGroupBy() || tableNameEmpty}
                          darkMode={darkMode}
                          showTooltip={disableGroupBy()}
                        />
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
