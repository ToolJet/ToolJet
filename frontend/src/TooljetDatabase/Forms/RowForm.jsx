import React, { useState, useContext, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';
import { postgresErrorCode, renderDatatypeIcon } from '../constants';
import { ToolTip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import DropDownSelect from '../../Editor/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import Information from '@/_ui/Icon/solidIcons/Information';
import ForeignKeyIndicator from '../Icons/ForeignKeyIndicator.svg';
import ArrowRight from '../Icons/ArrowRight.svg';
import cx from 'classnames';

import './styles.scss';
import Skeleton from 'react-loading-skeleton';

const RowForm = ({
  onCreate,
  onClose,
  referencedColumnDetails,
  setReferencedColumnDetails,
  initiator,
  shouldResetRowForm,
}) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { organizationId, selectedTable, columns, foreignKeys } = useContext(TooljetDatabaseContext);
  const inputRefs = useRef({});
  const primaryKeyColumns = [];
  const nonPrimaryKeyColumns = [];
  columns.forEach((column) => {
    if (column?.constraints_type?.is_primary_key) {
      primaryKeyColumns.push({ ...column });
    } else {
      nonPrimaryKeyColumns.push({ ...column });
    }
  });

  const defaultActiveTab = () => {
    if (Array.isArray(rowColumns)) {
      return rowColumns.map((item) => {
        if (item.column_default === null || item.constraints_type.is_primary_key === true) {
          return 'Custom';
        } else {
          return 'Default';
        }
      });
    } else {
      return [];
    }
  };

  const inputValuesDefaultValues = () => {
    return Array.isArray(rowColumns)
      ? rowColumns.map((item, _index) => {
          if (item.accessor === 'id') {
            return { value: '', checkboxValue: false, disabled: false, label: '' };
          }
          if (item.column_default !== null && item.constraints_type.is_primary_key !== true) {
            return {
              value: item.column_default || '',
              checkboxValue: item.column_default === 'true' ? true : false,
              disabled: true,
              label: item.column_default || '',
            };
          }
          if (item.column_default !== null && item.constraints_type.is_primary_key === true) {
            return { value: '', checkboxValue: false, disabled: false, label: '' };
          } else if (item.constraints_type.is_not_null === false) {
            return { value: '', checkboxValue: false, disabled: false, label: '' };
          }
          return { value: '', checkboxValue: false, disabled: false, label: '' };
        })
      : [];
  };

  const rowColumns = [...primaryKeyColumns, ...nonPrimaryKeyColumns];
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultActiveTab());
  const [inputValues, setInputValues] = useState(inputValuesDefaultValues());
  const [errorMap, setErrorMap] = useState({});

  useEffect(() => {
    rowColumns.map(({ accessor, dataType, column_default }, index) => {
      saveData(dataType, accessor, inputValues, index, column_default);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [data, setData] = useState(() => {
    const data = {};
    rowColumns.forEach(({ accessor, dataType }) => {
      if (dataType === 'boolean') {
        if (!accessor) {
          data[accessor] = false;
        }
      }
    });
    return data;
  });

  const referenceTableDetails = referencedColumnDetails.map((item) => {
    const [key, _value] = Object.entries(item);
    return {
      label: key[1] === null ? 'Null' : key[1],
      value: key[1] === null ? 'Null' : key[1],
    };
  });

  function isMatchingForeignKeyColumn(columnName) {
    return foreignKeys.some((foreignKey) => foreignKey.column_names[0] === columnName);
  }

  function isMatchingForeignKeyColumnDetails(columnHeader) {
    const matchingColumn = foreignKeys.find((foreignKey) => foreignKey.column_names[0] === columnHeader);
    return matchingColumn;
  }

  const handleTabClick = (index, tabData, defaultValue, nullValue, columnName, dataType) => {
    const newActiveTabs = [...activeTab];
    newActiveTabs[index] = tabData;
    setActiveTab(newActiveTabs);
    const newInputValues = [...inputValues];
    const actualDefaultVal = defaultValue === 'true' ? true : false;
    if (defaultValue && tabData === 'Default' && dataType !== 'boolean') {
      newInputValues[index] = { value: defaultValue, checkboxValue: defaultValue, disabled: true, label: defaultValue };
    } else if (defaultValue && tabData === 'Default' && dataType === 'boolean') {
      newInputValues[index] = {
        value: defaultValue,
        checkboxValue: actualDefaultVal,
        disabled: true,
        label: defaultValue,
      };
    } else if (nullValue && tabData === 'Null' && dataType !== 'boolean') {
      newInputValues[index] = { value: null, checkboxValue: false, disabled: true, label: null };
    } else if (nullValue && tabData === 'Null' && dataType === 'boolean') {
      newInputValues[index] = { value: null, checkboxValue: null, disabled: true, label: null };
    } else if (tabData === 'Custom' && dataType === 'character varying') {
      newInputValues[index] = { value: '', checkboxValue: false, disabled: false, label: '' };
    } else {
      newInputValues[index] = { value: '', checkboxValue: false, disabled: false, label: '' };
    }
    setInputValues(newInputValues);
    saveData(dataType, columnName, newInputValues, index, defaultValue);
  };

  const saveData = (dataType, accessor, inputValuesArr, index, defaultVal) => {
    if (dataType === 'boolean') {
      setData({
        ...data,
        [accessor]: inputValuesArr[index].checkboxValue === null ? null : inputValuesArr[index].checkboxValue,
      });
    } else {
      setData({
        ...data,
        [accessor]:
          inputValuesArr[index].value === null
            ? null
            : inputValuesArr[index].value === 'Default'
            ? defaultVal
            : inputValuesArr[index].value,
      });
    }
  };

  const handleInputChange = (index, value, columnName) => {
    const newInputValues = [...inputValues];
    newInputValues[index] = {
      value: value === 'Null' ? null : value,
      checkboxValue: inputValues[index].checkboxValue,
      disabled: false,
      label: value === 'Null' ? null : value,
    };
    setInputValues(newInputValues);
    setData({ ...data, [columnName]: value === 'Null' ? null : value });
  };

  const handleCheckboxChange = (index, value, columnName) => {
    const newInputValues = [...inputValues];
    newInputValues[index] = {
      value: inputValues[index].value,
      checkboxValue: !inputValues[index].checkboxValue,
      disabled: inputValues[index].disabled,
      label: inputValues[index].value,
    };
    setInputValues(newInputValues);
    setData({ ...data, [columnName]: value });
  };

  const defaultDataValues = () => {
    return rowColumns.reduce((result, column) => {
      const { dataType, column_default } = column;
      if (dataType === 'serial') {
        return result;
      }

      if (column.dataType === 'boolean') {
        result[column.accessor] = column_default ? column_default : false;
        return result;
      }

      result[column.accessor] = column_default ? column_default : '';
      return result;
    }, {});
  };

  useEffect(() => {
    toast.dismiss();
    setData(defaultDataValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (shouldResetRowForm) {
      setActiveTab(defaultActiveTab());
      setInputValues(inputValuesDefaultValues());
      setData(defaultDataValues());
    }
  }, [shouldResetRowForm]);

  useEffect(() => {
    rowColumns.forEach(({ accessor }) => {
      if (data[accessor] != '') {
        const inputElement = inputRefs.current?.[accessor];
        inputElement?.style?.setProperty('background-color', '#FFFFFF');
        setErrorMap((prev) => {
          return { ...prev, [accessor]: '' };
        });
      }
    });
  }, [data]);

  const handleSubmit = async (shouldKeepDrawerOpen) => {
    setFetching(true);
    let flag = 0;
    rowColumns.forEach(({ accessor, dataType }) => {
      if (['double precision', 'bigint', 'integer'].includes(dataType) && data[accessor] === '') {
        flag = 1;
        setErrorMap((prev) => {
          return { ...prev, [accessor]: 'Cannot be empty' };
        });
        const inputElement = inputRefs.current?.[accessor];
        inputElement?.style?.setProperty('background-color', '#FFF8F7');
      }
    });
    if (flag) {
      setFetching(false);
      return;
    }
    const { error } = await tooljetDatabaseService.createRow(organizationId, selectedTable.id, data);
    setFetching(false);
    if (error) {
      // TODO: Need all of this logic on the backend should ideally just get list of columns with error messages to map over
      if (error?.code === postgresErrorCode.UniqueViolation) {
        const columnName = error?.message.split('.')?.[1];
        setErrorMap((prev) => {
          return { ...prev, [columnName]: 'Value already exists' };
        });
        const inputElement = inputRefs.current?.[columnName];
        inputElement?.style?.setProperty('background-color', '#FFF8F7');
      } else if (error?.message.includes('Invalid input syntax for type')) {
        const errorMessageSplit = error?.message.split(':');
        const columnValue = errorMessageSplit[1]?.slice(2, -1);
        const mainErrorMessageSplit = errorMessageSplit?.[0]?.split('type ');
        const columnType = mainErrorMessageSplit?.[mainErrorMessageSplit.length - 1];
        const columnNamesWithSameValue = Object.keys(data).filter(
          (key) => String(data[key]).toLowerCase() === columnValue
        );
        rowColumns.forEach(({ accessor, dataType }) => {
          if (columnNamesWithSameValue.includes(accessor) && dataType === columnType) {
            setErrorMap((prev) => {
              return { ...prev, [accessor]: `Data type mismatch` };
            });
            const inputElement = inputRefs.current?.[accessor];
            inputElement?.style?.setProperty('background-color', '#FFF8F7');
          }
        });
      }

      toast.error(error?.message ?? `Failed to create a new column table "${selectedTable}"`);
      return;
    }
    toast.success(`Row created successfully`);
    onCreate && onCreate(shouldKeepDrawerOpen);
  };

  const renderElement = (columnName, dataType, isPrimaryKey, defaultValue, index) => {
    const isSerialDataTypeColumn = dataType === 'serial';
    switch (dataType) {
      case 'character varying':
      case 'integer':
      case 'bigint':
      case 'serial':
      case 'double precision':
        return (
          <div style={{ position: 'relative' }}>
            {isMatchingForeignKeyColumn(columnName) ? (
              <DropDownSelect
                buttonClasses="border border-end-1 foreignKeyAcces-container-drawer"
                showPlaceHolder={true}
                options={referenceTableDetails}
                darkMode={darkMode}
                emptyError={
                  <div className="dd-select-alert-error m-2 d-flex align-items-center">
                    <Information />
                    No data found
                  </div>
                }
                loader={
                  <div className="mx-2">
                    <Skeleton height={22} width={396} className="skeleton" style={{ margin: '15px 50px 7px 7px' }} />
                    <Skeleton height={22} width={450} className="skeleton" style={{ margin: '7px 14px 7px 7px' }} />
                    <Skeleton height={22} width={396} className="skeleton" style={{ margin: '7px 50px 15px 7px' }} />
                  </div>
                }
                isLoading={true}
                value={inputValues[index]?.value !== null && inputValues[index]}
                foreignKeyAccessInRowForm={true}
                disabled={isSerialDataTypeColumn || inputValues[index]?.disabled}
                topPlaceHolder={
                  isSerialDataTypeColumn ? 'Auto-generated' : inputValues[index]?.value !== null && 'Select a value'
                }
                onChange={(value) => {
                  handleInputChange(index, value.value, columnName);
                }}
                onAdd={true}
                addBtnLabel={'Open referenced table'}
                foreignKeys={foreignKeys}
                setReferencedColumnDetails={setReferencedColumnDetails}
                scrollEventForColumnValues={true}
                cellColumnName={columnName}
                columnDataType={dataType}
                isCreateRow={true}
              />
            ) : (
              <input
                //defaultValue={!isPrimaryKey && defaultValue?.length > 0 ? removeQuotes(defaultValue.split('::')[0]) : ''}
                type="text"
                value={
                  isSerialDataTypeColumn
                    ? 'Auto-generated'
                    : inputValues[index]?.value === null
                    ? ''
                    : inputValues[index]?.value
                }
                onChange={(e) => handleInputChange(index, e.target.value, columnName)}
                disabled={isSerialDataTypeColumn || inputValues[index]?.disabled}
                placeholder={
                  isSerialDataTypeColumn ? 'Auto-generated' : inputValues[index]?.value !== null && 'Enter a value'
                }
                className={cx(
                  isSerialDataTypeColumn && !darkMode
                    ? 'primary-idKey-light'
                    : isSerialDataTypeColumn && darkMode
                    ? 'primary-idKey-dark'
                    : !darkMode
                    ? 'form-control'
                    : 'form-control dark-form-row',
                  errorMap[columnName] ? 'input-error-border' : ''
                )}
                data-cy={`${String(columnName).toLocaleLowerCase().replace(/\s+/g, '-')}-input-field`}
                autoComplete="off"
                ref={(el) => (inputRefs.current[columnName] = el)}
              />
            )}
            {inputValues[index].value === null && (
              <p className={darkMode === true ? 'null-tag-dark' : 'null-tag'}>Null</p>
            )}

            {errorMap[columnName] && (
              <small
                className="tj-input-error"
                style={{
                  fontSize: '10px',
                  color: '#DB4324',
                }}
                data-cy="app-name-error-label"
              >
                {errorMap[columnName]}
              </small>
            )}
          </div>
        );

      case 'boolean':
        return (
          <label className={`form-switch`}>
            <input
              className="form-check-input"
              data-cy={`${String(columnName).toLocaleLowerCase().replace(/\s+/g, '-')}-check-input`}
              type="checkbox"
              checked={inputValues[index].checkboxValue}
              onChange={(e) => {
                if (!inputValues[index].disabled) handleCheckboxChange(index, e.target.checked, columnName);
              }}
              disabled={inputValues[index].checkboxValue === null}
            />
          </label>
        );

      default:
        break;
    }
  };

  let matchingObject = {};
  rowColumns.forEach((obj) => {
    const { dataType = '', accessor, _column_default } = obj;
    const keyName = accessor;

    if (data[keyName] !== undefined && dataType !== 'character varying' && dataType !== 'serial') {
      matchingObject[keyName] = data[keyName];
    }
  });

  return (
    <div className="drawer-card-wrapper ">
      <div className="card-header">
        <h3 className="card-title" data-cy="create-new-row-header">
          Create row
        </h3>
      </div>
      <div className="card-body tj-app-input create-drawer-body">
        {Array.isArray(rowColumns) &&
          rowColumns?.map(({ Header, accessor, dataType, constraints_type, column_default }, index) => {
            const isPrimaryKey = constraints_type.is_primary_key;
            const isNullable = !constraints_type.is_not_null;
            const headerText = Header;
            const isSerialDataTypeColumn = dataType === 'serial';
            return (
              <div className="mb-3 " key={index}>
                <div className="d-flex align-items-center justify-content-between">
                  <div
                    className="form-label"
                    data-cy={`${String(Header).toLocaleLowerCase().replace(/\s+/g, '-')}-column-name-label`}
                  >
                    <div className="headerText-withIcon d-flex align-items-center justify-content-start">
                      <span style={{ width: '24px' }}>
                        {renderDatatypeIcon(isSerialDataTypeColumn ? 'serial' : dataType)}
                      </span>
                      <span style={{ marginRight: '5px' }}>{headerText}</span>
                      {constraints_type?.is_primary_key === true && (
                        <span style={{ marginRight: '3px' }}>
                          <SolidIcon name="primarykey" />
                        </span>
                      )}
                      <ToolTip
                        message={
                          isMatchingForeignKeyColumn(Header) ? (
                            <div>
                              <span>Foreign key relation</span>
                              <div className="d-flex align-item-center justify-content-between mt-2 custom-tooltip-style">
                                <span>{isMatchingForeignKeyColumnDetails(Header)?.column_names[0]}</span>
                                <ArrowRight />
                                <span>{`${isMatchingForeignKeyColumnDetails(Header)?.referenced_table_name}.${
                                  isMatchingForeignKeyColumnDetails(Header)?.referenced_column_names[0]
                                }`}</span>
                              </div>
                            </div>
                          ) : null
                        }
                        placement="top"
                        tooltipClassName="tjdb-table-tooltip"
                      >
                        <div>
                          {isMatchingForeignKeyColumn(Header) && (
                            <span>
                              <ForeignKeyIndicator />
                            </span>
                          )}
                        </div>
                      </ToolTip>
                    </div>
                  </div>
                  <div
                    className={`${
                      darkMode ? 'row-tabs-dark' : 'row-tabs'
                    } d-flex align-items-center justify-content-start gap-2`}
                  >
                    {isNullable && !isPrimaryKey && (
                      <div
                        onClick={() => handleTabClick(index, 'Null', column_default, isNullable, accessor, dataType)}
                        style={{
                          backgroundColor:
                            activeTab[index] === 'Null' && !darkMode
                              ? 'white'
                              : activeTab[index] === 'Null' && darkMode
                              ? '#242f3c'
                              : 'transparent',
                          color:
                            activeTab[index] === 'Null' && !darkMode
                              ? '#3E63DD'
                              : activeTab[index] === 'Null' && darkMode
                              ? 'white'
                              : '#687076',
                        }}
                        className="row-tab-content"
                      >
                        Null
                      </div>
                    )}
                    {column_default !== null && !isSerialDataTypeColumn && (
                      <div
                        onClick={() => handleTabClick(index, 'Default', column_default, isNullable, accessor, dataType)}
                        style={{
                          backgroundColor:
                            activeTab[index] === 'Default' && !darkMode
                              ? 'white'
                              : activeTab[index] === 'Default' && darkMode
                              ? '#242f3c'
                              : 'transparent',
                          color:
                            activeTab[index] === 'Default' && !darkMode
                              ? '#3E63DD'
                              : activeTab[index] === 'Default' && darkMode
                              ? 'white'
                              : '#687076',
                        }}
                        className="row-tab-content"
                      >
                        Default value
                      </div>
                    )}
                    {!isSerialDataTypeColumn && (
                      <div
                        onClick={() => handleTabClick(index, 'Custom', column_default, isNullable, accessor, dataType)}
                        style={{
                          backgroundColor:
                            activeTab[index] === 'Custom' && !darkMode
                              ? 'white'
                              : activeTab[index] === 'Custom' && darkMode
                              ? '#242f3c'
                              : 'transparent',
                          color:
                            activeTab[index] === 'Custom' && !darkMode
                              ? '#3E63DD'
                              : activeTab[index] === 'Custom' && darkMode
                              ? 'white'
                              : '#687076',
                        }}
                        className="row-tab-content"
                      >
                        Custom
                      </div>
                    )}
                  </div>
                </div>
                <ToolTip
                  message="Serial data type value is auto-generated and cannot be edited"
                  placement="top"
                  tooltipClassName="tootip-table"
                  show={dataType === 'serial'}
                >
                  {renderElement(accessor, dataType, isPrimaryKey, column_default, index)}
                </ToolTip>
              </div>
            );
          })}
      </div>
      <DrawerFooter
        fetching={fetching}
        onClose={onClose}
        onCreate={handleSubmit}
        shouldDisableCreateBtn={Object.values(matchingObject).includes('')}
        initiator={initiator}
      />
    </div>
  );
};

export default RowForm;
