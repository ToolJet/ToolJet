import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';
import { renderDatatypeIcon } from '../constants';
import { ToolTip } from '@/_components/ToolTip';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import DropDownSelect from '../../Editor/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import Information from '@/_ui/Icon/solidIcons/Information';
import ForeignKeyIndicator from '../Icons/ForeignKeyIndicator.svg';
import ArrowRight from '../Icons/ArrowRight.svg';

import './styles.scss';

const RowForm = ({ onCreate, onClose, referencedColumnDetails, setReferencedColumnDetails }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { organizationId, selectedTable, columns, foreignKeys } = useContext(TooljetDatabaseContext);

  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (Array.isArray(columns)) {
      return columns.map((item) => {
        if (item.column_default === null) {
          return 'Custom';
        } else {
          return 'Default';
        }
      });
    } else {
      return [];
    }
  });

  const [inputValues, setInputValues] = useState(
    Array.isArray(columns)
      ? columns.map((item, index) => {
          if (item.accessor === 'id') {
            return { value: '', checkboxValue: false, disabled: false, label: '' };
          }
          if (item.column_default !== null) {
            return {
              value: item.column_default || '',
              checkboxValue: item.column_default === 'true' ? true : false,
              disabled: true,
              label: item.column_default || '',
            };
          } else if (item.constraints_type.is_not_null === false) {
            return { value: '', checkboxValue: false, disabled: false, label: '' };
          }
          return { value: '', checkboxValue: false, disabled: false, label: '' };
        })
      : []
  );

  useEffect(() => {
    columns.map(({ accessor, dataType, column_default }, index) => {
      saveData(dataType, accessor, inputValues, index, column_default);
    });
  }, []);

  const [data, setData] = useState(() => {
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

  // const referenceColumn = 'Name';

  const referenceTableDetails = referencedColumnDetails.map((item) => {
    const [key, value] = Object.entries(item);
    return {
      label: key[1],
      value: key[1],
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
    newInputValues[index] = { value, checkboxValue: inputValues[index].checkboxValue, disabled: false, label: value };
    setInputValues(newInputValues);
    setData({ ...data, [columnName]: value });
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

  useEffect(() => {
    toast.dismiss();
    setData(
      columns.reduce((result, column) => {
        const { dataType, column_default } = column;
        if (dataType !== 'serial') {
          if (column.dataType === 'boolean') {
            result[column.accessor] = false;
          } else {
            result[column.accessor] = '';
          }
        }
        return result;
      }, {})
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    setFetching(true);
    const { error } = await tooljetDatabaseService.createRow(organizationId, selectedTable.id, data);
    setFetching(false);
    if (error) {
      toast.error(error?.message ?? `Failed to create a new column table "${selectedTable}"`);
      return;
    }
    toast.success(`Row created successfully`);
    onCreate && onCreate();
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
                buttonClasses="border border-end-1 foreignKeyAcces-container"
                showPlaceHolder={true}
                options={referenceTableDetails}
                darkMode={darkMode}
                emptyError={
                  <div className="dd-select-alert-error m-2 d-flex align-items-center">
                    <Information />
                    No table selected
                  </div>
                }
                value={inputValues[index]?.value !== null && inputValues[index]}
                foreignKeyAccessInRowForm={true}
                disabled={isSerialDataTypeColumn || inputValues[index]?.disabled}
                topPlaceHolder={
                  isSerialDataTypeColumn ? 'Auto-generated' : inputValues[index]?.value !== null && 'Enter a value'
                }
                onChange={(value) => {
                  handleInputChange(index, value.value, columnName);
                }}
                onAdd={true}
                addBtnLabel={'Open referenced table'}
                foreignKeys={foreignKeys}
                setReferencedColumnDetails={setReferencedColumnDetails}
                scrollEventForColumnValus={true}
              />
            ) : (
              <input
                //defaultValue={!isPrimaryKey && defaultValue?.length > 0 ? removeQuotes(defaultValue.split('::')[0]) : ''}
                type="text"
                value={inputValues[index]?.value === null ? '' : inputValues[index]?.value}
                onChange={(e) => handleInputChange(index, e.target.value, columnName)}
                disabled={isSerialDataTypeColumn || inputValues[index]?.disabled}
                placeholder={
                  isSerialDataTypeColumn ? 'Auto-generated' : inputValues[index]?.value !== null && 'Enter a value'
                }
                className={
                  isSerialDataTypeColumn && !darkMode
                    ? 'primary-idKey-light'
                    : isSerialDataTypeColumn && darkMode
                    ? 'primary-idKey-dark'
                    : !darkMode
                    ? 'form-control'
                    : 'form-control dark-form-row'
                }
                data-cy={`${String(columnName).toLocaleLowerCase().replace(/\s+/g, '-')}-input-field`}
                autoComplete="off"
              />
            )}
            {inputValues[index].value === null && (
              <p className={darkMode === true ? 'null-tag-dark' : 'null-tag'}>Null</p>
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
  columns.forEach((obj) => {
    const { dataType = '', accessor, column_default } = obj;
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
      <div className="card-body tj-app-input">
        {Array.isArray(columns) &&
          columns?.map(({ Header, accessor, dataType, constraints_type, column_default }, index) => {
            const isPrimaryKey = constraints_type.is_primary_key;
            const isNullable = !constraints_type.is_not_null;
            const headerText = Header.charAt(0).toUpperCase() + Header.slice(1);
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
                        tooltipClassName="tootip-table"
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
      />
    </div>
  );
};

export default RowForm;
