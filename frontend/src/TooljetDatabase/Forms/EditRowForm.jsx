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
import Maximize from '@/TooljetDatabase/Icons/maximize.svg';
import { Link } from 'react-router-dom';
import { getPrivateRoute } from '@/_helpers/routes';
import ForeignKeyIndicator from '../Icons/ForeignKeyIndicator.svg';
import ArrowRight from '../Icons/ArrowRight.svg';
import Skeleton from 'react-loading-skeleton';

const EditRowForm = ({
  onEdit,
  onClose,
  selectedRowObj = null,
  referencedColumnDetails,
  setReferencedColumnDetails,
  initiator,
}) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { organizationId, selectedTable, columns, foreignKeys } = useContext(TooljetDatabaseContext);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState(Array.isArray(columns) ? columns.map(() => 'Custom') : []);
  const currentValue = selectedRowObj;
  const [inputValues, setInputValues] = useState([]);
  const inputRefs = useRef({});
  const [errorMap, setErrorMap] = useState({});

  useEffect(() => {
    toast.dismiss();
  }, []);

  useEffect(() => {
    if (currentValue) {
      const keysWithNullValues = Object.keys(currentValue).filter((key) => currentValue[key] === null);
      const keysWithDefaultValues = Object.keys(currentValue).filter(
        (key, index) => currentValue[key]?.toString() === columns[index].column_default
      );
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
          if (currentValue[key]?.toString() === columns[index].column_default) {
            newActiveTabs[index] = 'Default';
          }
        });
        return newActiveTabs;
      });
      const initialInputValues = currentValue
        ? Object.keys(currentValue).map((key, index) => {
            const value =
              currentValue[key] === null ? null : currentValue[key] === currentValue[key] ? currentValue[key] : '';
            const disabledValue =
              currentValue[key] === null || currentValue[key]?.toString() === columns[index].column_default
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
        inputElement?.style?.setProperty('background-color', darkMode ? '#1f2936' : '#FFFFFF', 'important');
        setErrorMap((prev) => {
          return { ...prev, [accessor]: '' };
        });
      }
    });
  }, [rowData]);

  const referenceTableDetails = referencedColumnDetails.map((item) => {
    const [key, value] = Object.entries(item);
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
    } else if (nullValue && tabData === 'Null' && dataType !== 'boolean') {
      newInputValues[index] = { value: null, disabled: true, label: null };
    } else if (nullValue && tabData === 'Null' && dataType === 'boolean') {
      newInputValues[index] = { value: null, disabled: true, label: null };
    } else if (tabData === 'Custom' && customVal.length > 0) {
      newInputValues[index] = { value: customVal, disabled: false, label: customVal };
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

  const handleInputChange = (index, value, columnName) => {
    const newInputValues = [...inputValues];
    newInputValues[index] = {
      value: value === 'Null' ? null : value,
      disabled: false,
      label: value === 'Null' ? null : value,
    };
    setInputValues(newInputValues);
    setRowData({ ...rowData, [columnName]: value === 'Null' ? null : value });
  };

  useEffect(() => {
    toast.dismiss();
  }, []);

  const handleSubmit = async () => {
    setFetching(true);
    let flag = 0;

    const { hasEmptyValue, newErrorMap } = editRowColumns.reduce(
      (acc, { accessor, dataType }) => {
        if (['double precision', 'bigint', 'integer'].includes(dataType) && rowData[accessor] === '') {
          acc.hasEmptyValue = true;
          acc.newErrorMap[accessor] = 'Cannot be empty';

          const inputElement = inputRefs.current?.[accessor];
          inputElement?.style?.setProperty('background-color', darkMode ? '#1f2936' : '#FFF8F7', 'important');
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
        inputElement?.style?.setProperty('background-color', darkMode ? '#1f2936' : '#FFF8F7', 'important');
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
            inputElement?.style?.setProperty('background-color', darkMode ? '#1f2936' : '#FFF8F7', 'important');
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

  const renderElement = (columnName, dataType, index, shouldInputBeDisabled = false) => {
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
                    No data available
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
                disabled={inputValues[index]?.disabled || shouldInputBeDisabled}
                topPlaceHolder={inputValues[index]?.value !== null && 'Select a value'}
                onChange={(value) => handleInputChange(index, value.value, columnName)}
                onAdd={true}
                addBtnLabel={'Open referenced table'}
                foreignKeys={foreignKeys}
                setReferencedColumnDetails={setReferencedColumnDetails}
                scrollEventForColumnValus={true}
                cellColumnName={columnName}
              />
            ) : (
              <input
                //defaultValue={currentValue}
                value={inputValues[index]?.value !== null && inputValues[index]?.value}
                type="text"
                disabled={inputValues[index]?.disabled || shouldInputBeDisabled}
                onChange={(e) => handleInputChange(index, e.target.value, columnName)}
                placeholder={inputValues[index]?.value !== null ? 'Enter a value' : null}
                className={`${!darkMode ? 'form-control' : 'form-control dark-form-row'} ${
                  errorMap[columnName] ? 'input-error-border' : ''
                }`}
                data-cy={`${String(columnName).toLocaleLowerCase().replace(/\s+/g, '-')}-input-field`}
                autoComplete="off"
                ref={(el) => (inputRefs.current[columnName] = el)}
                // onFocus={onFocused}
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

  const handleNavigateToReferencedtable = (id, name) => {
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
      <div className="card-body">
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
                    {renderElement(accessor, dataType, index, shouldInputBeDisabled)}
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
          shouldDisableCreateBtn={Object.values(matchingObject).includes('') || (isSubset && isSubsetForCharacter)}
          initiator={initiator}
        />
      )}
    </div>
  );
};

export default EditRowForm;
