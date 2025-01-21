import React, { useState, useContext, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';
import _ from 'lodash';
import { renderDatatypeIcon, listAllPrimaryKeyColumns, postgresErrorCode } from '../constants';
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';
import DropDownSelect from '../../Editor/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import Information from '@/_ui/Icon/solidIcons/Information';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components/ToolTip';
import './styles.scss';
import cx from 'classnames';
// import Maximize from '@/TooljetDatabase/Icons/maximize.svg';
// import { Link } from 'react-router-dom';
// import { getPrivateRoute } from '@/_helpers/routes';
import ForeignKeyIndicator from '../Icons/ForeignKeyIndicator.svg';
import ArrowRight from '../Icons/ArrowRight.svg';
import Skeleton from 'react-loading-skeleton';
import DateTimePicker from '@/Editor/QueryManager/QueryEditors/TooljetDatabase/DateTimePicker';
import { getLocalTimeZone, getUTCOffset } from '@/Editor/QueryManager/QueryEditors/TooljetDatabase/util';
import CodeHinter from '@/AppBuilder/CodeEditor';
import { resolveReferences } from '@/AppBuilder/CodeEditor/utils';

const compareValueInObject = (currentValue, defaultValue) => {
  try {
    let cv = currentValue;
    let defaultVal = defaultValue;

    // Step 1: Parse cv until it's fully converted to an object
    while (typeof cv === 'string') {
      cv = JSON.parse(cv);
    }

    // Step 2: Use Lodash's isEqual for a deep comparison
    return _.isEqual(cv, defaultVal);
  } catch (error) {
    return false;
  }
};

const transformJSONValue = (value) => {
  if (typeof value === 'string') {
    return JSON.stringify(JSON.parse(value));
  } else {
    return JSON.stringify(value);
  }
};

const EditRowForm = ({
  onEdit,
  onClose,
  selectedRowObj = null,
  referencedColumnDetails,
  setReferencedColumnDetails,
  initiator,
}) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { organizationId, selectedTable, columns, foreignKeys, getConfigurationProperty } =
    useContext(TooljetDatabaseContext);
  const inputRefs = useRef({});
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState(Array.isArray(columns) ? columns.map(() => 'Custom') : []);
  const currentValue = selectedRowObj;
  const [inputValues, setInputValues] = useState([]);
  const [errorMap, setErrorMap] = useState({});

  const [disabledSaveButton, setDisabledSaveButton] = useState(false);

  const handleInputError = (bool = false) => {
    setDisabledSaveButton(bool);
  };

  useEffect(() => {
    toast.dismiss();
  }, []);

  useEffect(() => {
    if (currentValue) {
      const keysWithNullValues = Object.keys(currentValue).filter((key) => currentValue[key] === null);
      const keysWithDefaultValues = Object.keys(currentValue).filter((key, index) => {
        if (columns[index].dataType === 'jsonb') {
          try {
            return compareValueInObject(currentValue[key], columns[index].column_default);
          } catch (error) {
            return false;
          }
        }
        return currentValue[key]?.toString() === columns[index].column_default;
      });

      setActiveTab((prevActiveTabs) => {
        const newActiveTabs = [...prevActiveTabs];
        keysWithNullValues.forEach((key) => {
          const index = Object.keys(currentValue).indexOf(key);
          if (currentValue[key] === null) {
            newActiveTabs[index] = 'Null';
          }
        });

        keysWithDefaultValues.forEach((key) => {
          const index = Object.keys(currentValue).indexOf(key);
          const compareCondition =
            columns[index].dataType === 'jsonb'
              ? compareValueInObject(currentValue[key], columns[index].column_default)
              : currentValue[key]?.toString() === columns[index].column_default;
          if (compareCondition) {
            newActiveTabs[index] = 'Default';
          }
        });
        return newActiveTabs;
      });

      const initialInputValues = currentValue
        ? Object.keys(currentValue).map((key, index) => {
            const isJsonDataType = columns[index].dataType === 'jsonb';
            let isJsonbCurrentAndDefaultValueEqual = false;
            if (isJsonDataType) {
              isJsonbCurrentAndDefaultValueEqual = compareValueInObject(
                currentValue[key],
                columns[index].column_default
              );
            }
            const value = currentValue[key] === null ? null : currentValue[key] ? currentValue[key] : '';
            const disabledValue =
              currentValue[key] === null ||
              (isJsonDataType
                ? isJsonbCurrentAndDefaultValueEqual
                : currentValue[key]?.toString() === columns[index].column_default)
                ? true
                : false;
            return { value: value, disabled: disabledValue, label: value };
          })
        : [];

      setInputValues(initialInputValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue]);

  const [rowData, setRowData] = useState(() => {
    const data = {};
    columns.forEach(({ accessor, dataType }) => {
      if (dataType === 'boolean') {
        if (!accessor) {
          data[accessor] = false;
        }
      }
    });

    return data;
  });

  useEffect(() => {
    editRowColumns.forEach(({ accessor }) => {
      if (rowData[accessor] != '') {
        const inputElement = inputRefs.current[accessor];
        inputElement?.style?.setProperty('background-color', darkMode ? '#1f2936' : '#FFFFFF');
        setErrorMap((prev) => {
          return { ...prev, [accessor]: '' };
        });
      }
    });
  }, [rowData]);

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

  const handleTabClick = (index, tabData, defaultValue, nullValue, columnName, dataType, currentValue) => {
    const newActiveTabs = [...activeTab];
    newActiveTabs[index] = tabData;
    setActiveTab(newActiveTabs);
    const customVal = currentValue === null || '' ? '' : currentValue;
    const customBooleanVal = currentValue === false ? false : currentValue;
    const actualDefaultVal = defaultValue === 'true' ? true : false;
    const newInputValues = [...inputValues];
    if (defaultValue && tabData === 'Default' && dataType !== 'boolean') {
      newInputValues[index] = { value: defaultValue, disabled: true, label: defaultValue };
    } else if (defaultValue && tabData === 'Default' && dataType === 'boolean') {
      newInputValues[index] = { value: actualDefaultVal, disabled: true, label: actualDefaultVal };
    } else if (defaultValue && tabData === 'Default' && dataType === 'jsonb') {
      const [_, __, resolvedValue] = resolveReferences(`{{${defaultValue}}}`);
      newInputValues[index] = { value: resolvedValue, disabled: false, label: resolvedValue };
    } else if (nullValue && tabData === 'Null' && dataType !== 'boolean') {
      newInputValues[index] = { value: null, disabled: true, label: null };
    } else if (nullValue && tabData === 'Null' && dataType === 'boolean') {
      newInputValues[index] = { value: null, disabled: true, label: null };
    } else if (tabData === 'Custom' && customVal?.length > 0 && dataType !== 'jsonb') {
      newInputValues[index] = { value: customVal, disabled: false, label: customVal };
    } else if (tabData === 'Custom' && customVal?.length > 0 && dataType === 'jsonb') {
      const [_, __, resolvedValue] = resolveReferences(`{{${customVal}}}`);
      newInputValues[index] = { value: resolvedValue, disabled: false, label: resolvedValue };
    } else if (tabData === 'Custom' && customVal.length <= 0) {
      newInputValues[index] = { value: '', disabled: false, label: '' };
    } else {
      newInputValues[index] = { value: customVal, disabled: false, label: customVal };
    }

    setInputValues(newInputValues);
    if (dataType === 'boolean') {
      setRowData({
        ...rowData,
        [columnName]:
          newInputValues[index].value === null
            ? null
            : newInputValues[index].value === actualDefaultVal
            ? defaultValue === 'true'
              ? true
              : false
            : newInputValues[index].value === currentValue
            ? currentValue
            : currentValue === null && customBooleanVal === false
            ? null
            : null,
      });
    } else if (dataType === 'jsonb') {
      setRowData({
        ...rowData,
        [columnName]:
          newInputValues[index].value === null
            ? null
            : compareValueInObject(newInputValues[index].value, defaultValue)
            ? defaultValue
            : _.isEqual(newInputValues[index].value, currentValue)
            ? currentValue
            : currentValue === null && customVal === ''
            ? ''
            : null,
      });
    } else {
      setRowData({
        ...rowData,
        [columnName]:
          newInputValues[index].value === null
            ? null
            : newInputValues[index].value === defaultValue
            ? defaultValue
            : newInputValues[index].value === currentValue
            ? currentValue
            : currentValue === null && customVal === ''
            ? ''
            : null,
      });
    }
  };

  const handleDisabledInputClick = (index, tabData, defaultValue, nullValue, columnName, dataType, currentValue) => {
    handleTabClick(index, tabData, defaultValue, nullValue, columnName, dataType, currentValue);
    if (inputRefs.current[columnName]) {
      setTimeout(() => {
        inputRefs.current[columnName].focus();
      }, 0);
    }
  };

  const handleInputChange = (index, value, columnName) => {
    const newInputValues = [...inputValues];
    const isNull = value === null || value === 'Null';
    newInputValues[index] = {
      value: isNull ? null : value,
      disabled: isNull,
      label: isNull ? null : value,
    };
    setInputValues(newInputValues);
    setRowData({ ...rowData, [columnName]: isNull ? null : value });
    if (isNull) {
      const newActiveTabs = [...activeTab];
      newActiveTabs[index] = 'Null';
      setActiveTab(newActiveTabs);
    }
  };

  useEffect(() => {
    toast.dismiss();
  }, []);

  const handleSubmit = async () => {
    setFetching(true);
    let flag = 0;

    const { hasEmptyValue, newErrorMap } = editRowColumns.reduce(
      (acc, { accessor, dataType }) => {
        if (['double precision', 'bigint', 'integer', 'jsonb'].includes(dataType) && rowData[accessor] === '') {
          acc.hasEmptyValue = true;
          acc.newErrorMap[accessor] = 'Cannot be empty';

          const inputElement = inputRefs.current?.[accessor];
          inputElement?.style?.setProperty('background-color', darkMode ? '#1f2936' : '#FFF8F7');
        }
        return acc;
      },
      { hasEmptyValue: false, newErrorMap: {} }
    );

    if (hasEmptyValue) {
      setErrorMap((prev) => ({ ...prev, ...newErrorMap }));
      setFetching(false);
      return;
    }

    const primaryKeyColumns = listAllPrimaryKeyColumns(columns);
    const filterQuery = new PostgrestQueryBuilder();
    const sortQuery = new PostgrestQueryBuilder();

    primaryKeyColumns.forEach((primaryKeyColumnName) => {
      if (selectedRowObj[primaryKeyColumnName]) {
        filterQuery.filter(primaryKeyColumnName, 'eq', selectedRowObj[primaryKeyColumnName]);
        sortQuery.order(primaryKeyColumnName, 'desc');
      }
    });

    const query = `${filterQuery.url.toString()}&${sortQuery.url.toString()}`;
    const { error } = await tooljetDatabaseService.updateRows(organizationId, selectedTable.id, rowData, query);
    // TODO: Need all of this logic on the backend should ideally just get list of columns with error messages to map over
    if (error) {
      if (error?.code === postgresErrorCode.UniqueViolation) {
        const columnName = error?.message.split('.')?.[1];
        setErrorMap((prev) => {
          return { ...prev, [columnName]: 'Value already exists' };
        });
        const inputElement = inputRefs.current?.[columnName];
        inputElement?.style?.setProperty('background-color', darkMode ? '#1f2936' : '#FFF8F7');
      } else if (error?.code === postgresErrorCode.NotNullViolation) {
        const columnName = error?.message.split('.')[1];
        setErrorMap((prev) => {
          return { ...prev, [columnName]: 'Cannot be Null' };
        });
        const inputElement = inputRefs.current?.[columnName];
        inputElement?.style?.setProperty('background-color', '#FFF8F7');
      } else if (error?.code === postgresErrorCode.DataTypeMismatch) {
        const errorMessageSplit = error?.message.split(':');
        const columnValue = errorMessageSplit[1]?.slice(2, -1);
        const mainErrorMessageSplit = errorMessageSplit?.[0]?.split('type ');
        const columnType = mainErrorMessageSplit?.[mainErrorMessageSplit.length - 1];
        const columnNamesWithSameValue = Object.keys(rowData).filter(
          (key) => String(rowData[key]).toLowerCase() === columnValue
        );
        editRowColumns.forEach(({ accessor, dataType }) => {
          if (columnNamesWithSameValue.includes(accessor) && dataType === columnType) {
            setErrorMap((prev) => {
              return { ...prev, [accessor]: `Data type mismatch` };
            });
            const inputElement = inputRefs.current?.[accessor];
            inputElement?.style?.setProperty('background-color', darkMode ? '#1f2936' : '#FFF8F7');
          }
        });
      }
      toast.error(error?.message ?? `Failed to create a new column table "${selectedTable.table_name}"`);
      setFetching(false);
      return;
    }
    setFetching(false);
    toast.success(`Row edited successfully`);
    onEdit && onEdit();
  };

  const renderElement = (columnName, dataType, index, isNullable, column_default, shouldInputBeDisabled = false) => {
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
                  <>
                    <Skeleton height={22} width={396} className="skeleton" style={{ margin: '15px 50px 7px 7px' }} />
                    <Skeleton height={22} width={450} className="skeleton" style={{ margin: '7px 14px 7px 7px' }} />
                    <Skeleton height={22} width={396} className="skeleton" style={{ margin: '7px 50px 15px 7px' }} />
                  </>
                }
                isLoading={true}
                value={inputValues[index]?.value !== null && inputValues[index]}
                foreignKeyAccessInRowForm={true}
                disabled={inputValues[index]?.disabled || shouldInputBeDisabled}
                topPlaceHolder={inputValues[index]?.value !== null && 'Select a value'}
                onChange={(value) => handleInputChange(index, value.value, columnName)}
                onAdd={true}
                addBtnLabel={'Open referenced table'}
                foreignKeys={foreignKeys}
                setReferencedColumnDetails={setReferencedColumnDetails}
                scrollEventForColumnValues={true}
                cellColumnName={columnName}
                columnDataType={dataType}
                isEditRow={true}
              />
            ) : (
              <input
                //defaultValue={currentValue}
                value={inputValues[index]?.value !== null && inputValues[index]?.value}
                type="text"
                ref={(input) => (inputRefs.current[columnName] = input)}
                disabled={inputValues[index]?.disabled || shouldInputBeDisabled}
                onChange={(e) => handleInputChange(index, e.target.value, columnName)}
                placeholder={inputValues[index]?.value !== null ? 'Enter a value' : null}
                className={`${!darkMode ? 'form-control' : 'form-control dark-form-row'} ${
                  errorMap[columnName] ? 'input-error-border' : ''
                }`}
                data-cy={`${String(columnName).toLocaleLowerCase().replace(/\s+/g, '-')}-input-field`}
                autoComplete="off"
                // onFocus={onFocused}
              />
            )}
            {(inputValues[index]?.disabled || shouldInputBeDisabled) && (
              <div
                onClick={() =>
                  handleDisabledInputClick(
                    index,
                    'Custom',
                    column_default,
                    isNullable,
                    columnName,
                    dataType,
                    currentValue[columnName]
                  )
                }
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 1,
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                }}
              />
            )}
            {inputValues[index]?.value === null ? (
              <p className={darkMode === true ? 'null-tag-dark' : 'null-tag'}>Null</p>
            ) : null}

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
              type="checkbox"
              checked={inputValues[index]?.value}
              onChange={(e) => {
                if (!inputValues[index]?.disabled) handleInputChange(index, e.target.checked, columnName);
              }}
              disabled={inputValues[index]?.value === null || shouldInputBeDisabled}
            />
          </label>
        );

      case 'timestamp with time zone':
        return (
          <div style={{ position: 'relative' }}>
            <DateTimePicker
              timestamp={inputValues[index]?.value}
              setTimestamp={(value) => handleInputChange(index, value, columnName)}
              isOpenOnStart={false}
              isClearable={activeTab[index] === 'Custom'}
              isPlaceholderEnabled={activeTab[index] === 'Custom'}
              errorMessage={errorMap[columnName]}
              timezone={getConfigurationProperty(columnName, 'timezone', getLocalTimeZone())}
              isDisabled={inputValues[index]?.disabled || shouldInputBeDisabled}
            />
            {(inputValues[index]?.disabled || shouldInputBeDisabled) && (
              <div
                onClick={() =>
                  handleDisabledInputClick(
                    index,
                    'Custom',
                    column_default,
                    isNullable,
                    columnName,
                    dataType,
                    currentValue[columnName]
                  )
                }
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 4,
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                }}
              />
            )}
          </div>
        );
      case 'jsonb':
        return (
          <div style={{ position: 'relative' }} onKeyDown={(e) => e.stopPropagation()}>
            {inputValues[index]?.value === null ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  backgroundColor: 'transparent',
                  width: '100%',
                  border: '1px solid var(--slate7)',
                  padding: '5px 5px',
                  borderRadius: '6px',
                }}
                className={'null-container'}
                tabindex="0"
              >
                <span
                  style={{
                    position: 'static',
                    backgroundColor: 'transparent',
                  }}
                  className={'null-tag'}
                >
                  Null
                </span>
              </div>
            ) : activeTab[index] === 'Default' ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  position: 'relative',
                  backgroundColor: 'transparent',
                  width: '100%',
                  border: '1px solid var(--slate7)',
                  padding: '5px 5px',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  height: '36px',
                  maxHeight: '36px',
                  fontSize: '12px',
                }}
                tabindex="0"
                className="truncate"
              >
                {transformJSONValue(column_default)}
              </div>
            ) : (
              <div className="tjdb-codehinter-wrapper-drawer" onKeyDown={(e) => e.stopPropagation()}>
                <CodeHinter
                  type="tjdbHinter"
                  inEditor={false}
                  initialValue={inputValues[index]?.value ? transformJSONValue(inputValues[index]?.value) : ''}
                  lang="javascript"
                  onChange={(value) => {
                    if (value === 'Null') {
                      handleInputChange(index, value, columnName);
                    } else {
                      const [_, __, resolvedValue] = resolveReferences(`{{${value}}}`);
                      handleInputChange(index, resolvedValue, columnName);
                    }
                  }}
                  componentName={`{} ${columnName}`}
                  errorCallback={handleInputError}
                  lineNumbers={false}
                  placeholder="{}"
                  columnName={columnName}
                  showErrorMessage={true}
                  className={cx(errorMap[columnName] ? 'has-empty-error' : '')}
                />
              </div>
            )}

            {(inputValues[index]?.disabled || shouldInputBeDisabled) && (
              <div
                onClick={() => {
                  handleDisabledInputClick(
                    index,
                    'Custom',
                    column_default,
                    isNullable,
                    columnName,
                    dataType,
                    currentValue[columnName]
                  );
                  handleTabClick(index, 'Custom', column_default, isNullable, columnName, dataType);
                }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 4,
                  cursor: 'pointer',
                  backgroundColor: 'transparent',
                }}
              />
            )}
          </div>
        );

      default:
        break;
    }
  };

  let matchingObject = {};
  let matchingObjectForCharacter = {};

  const primaryKeyColumns = [];
  const nonPrimaryKeyColumns = [];
  columns.forEach((column) => {
    if (column?.constraints_type?.is_primary_key) {
      primaryKeyColumns.push({ ...column });
    } else {
      nonPrimaryKeyColumns.push({ ...column });
    }
  });

  const editRowColumns = [...primaryKeyColumns, ...nonPrimaryKeyColumns];

  columns.forEach((obj) => {
    const keyName = Object.values(obj)[0];
    const dataType = Object.values(obj)[2];

    if (rowData[keyName] !== undefined && dataType !== 'character varying') {
      matchingObject[keyName] = rowData[keyName];
    } else if (rowData[keyName] !== undefined && dataType === 'character varying') {
      matchingObjectForCharacter[keyName] = rowData[keyName];
    }
  });

  const isSubset = Object.entries(matchingObject).every(([key, value]) => currentValue[key] == value);
  const isSubsetForCharacter = Object.entries(matchingObjectForCharacter).every(
    ([key, value]) => currentValue[key] == value
  );

  const _handleNavigateToReferencedtable = (id, name) => {
    const data = { id: id, table_name: name };
    localStorage.setItem('tableDetails', JSON.stringify(data));
  };

  return (
    <div className="drawer-card-wrapper ">
      <div className="drawer-card-title">
        <div className="editRow-header-container">
          <h3 className="card-title" data-cy="edit-row-header">
            Edit row
          </h3>
          {/* {foreignKeys.length > 0 &&
            foreignKeys.map((foreignKey, index) => (
              <ToolTip key={index} message="Open referenced table" placement="right" tooltipClassName="tootip-table">
                <Link target="_blank" to={getPrivateRoute('database')}>
                  <div
                    className="edit-row-tableName"
                    onClick={() =>
                      handleNavigateToReferencedtable(foreignKey.referenced_table_id, foreignKey.referenced_table_name)
                    }
                  >
                    <span>{foreignKey.referenced_table_name}</span> <Maximize />
                  </div>
                </Link>
              </ToolTip>
            ))} */}
        </div>
      </div>
      <div className="card-body edit-row-body">
        <div>
          {selectedRowObj &&
            Array.isArray(editRowColumns) &&
            editRowColumns?.map(({ Header, accessor, dataType, column_default, constraints_type }, index) => {
              const currentValue = selectedRowObj[accessor];
              const headerText = Header;
              const isPrimaryKey = constraints_type?.is_primary_key ?? false;
              const isNullable = !constraints_type?.is_not_null;
              const isSerialDataTypeColumn = dataType === 'serial';
              const shouldInputBeDisabled = isPrimaryKey || isSerialDataTypeColumn;

              return (
                <div className="edit-row-container mb-3" key={index}>
                  <div className="edit-field-container d-flex align-items-center justify-content-between">
                    <div
                      className="form-label"
                      data-cy={`${String(Header).toLocaleLowerCase().replace(/\s+/g, '-')}-column-name-label`}
                    >
                      <div className="headerText-withIcon d-flex align-items-center justify-content-start">
                        <span style={{ width: '24px' }}>
                          {renderDatatypeIcon(isSerialDataTypeColumn ? 'serial' : dataType)}
                        </span>
                        <ToolTip
                          message={<span>{headerText}</span>}
                          show={dataType === 'timestamp with time zone' && headerText.length >= 20}
                          placement="top"
                          tooltipClassName="tjdb-table-tooltip"
                        >
                          <span
                            style={{ marginRight: '5px' }}
                            className={cx({
                              'header-label-timestamp': dataType === 'timestamp with time zone',
                            })}
                          >
                            {headerText}
                          </span>
                        </ToolTip>
                        {constraints_type?.is_primary_key === true && (
                          <span style={{ marginRight: '3px' }}>
                            <SolidIcon name="primarykey" />
                          </span>
                        )}
                        {dataType === 'timestamp with time zone' && (
                          <div
                            style={{
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginLeft: '2px',
                              marginTop: '1px',
                            }}
                          >
                            <span className="tjdb-display-time-pill">{`UTC ${getUTCOffset(
                              getConfigurationProperty(accessor, 'timezone', getLocalTimeZone())
                            )}`}</span>
                          </div>
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
                          onClick={() =>
                            handleTabClick(index, 'Null', column_default, isNullable, accessor, dataType, currentValue)
                          }
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
                      {column_default !== null && !isSerialDataTypeColumn && !isPrimaryKey && (
                        <div
                          onClick={() =>
                            handleTabClick(
                              index,
                              'Default',
                              column_default,
                              isNullable,
                              accessor,
                              dataType,
                              currentValue
                            )
                          }
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
                      {!isSerialDataTypeColumn && !isPrimaryKey && (
                        <div
                          onClick={() =>
                            handleTabClick(
                              index,
                              'Custom',
                              column_default,
                              isNullable,
                              accessor,
                              dataType,
                              currentValue
                            )
                          }
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
                    message={
                      isSerialDataTypeColumn
                        ? 'Serial data type values cannot be modified'
                        : constraints_type?.is_primary_key
                        ? 'Cannot edit primary key values'
                        : null
                    }
                    placement="top"
                    tooltipClassName="tootip-table"
                    show={isSerialDataTypeColumn || constraints_type?.is_primary_key}
                  >
                    {renderElement(accessor, dataType, index, isNullable, column_default, shouldInputBeDisabled)}
                  </ToolTip>
                </div>
              );
            })}
        </div>
      </div>
      {selectedRowObj && (
        <DrawerFooter
          isEditMode={true}
          fetching={fetching}
          onClose={onClose}
          onEdit={handleSubmit}
          shouldDisableCreateBtn={
            Object.values(matchingObject).includes('') || (isSubset && isSubsetForCharacter) || disabledSaveButton
          }
          initiator={initiator}
        />
      )}
    </div>
  );
};

export default EditRowForm;
