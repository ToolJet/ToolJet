import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';
import _ from 'lodash';
import { renderDatatypeIcon, listAllPrimaryKeyColumns } from '../constants';
import PostgrestQueryBuilder from '@/_helpers/postgrestQueryBuilder';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components/ToolTip';
import './styles.scss';

const EditRowForm = ({ onEdit, onClose, selectedRowObj = null }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { organizationId, selectedTable, columns } = useContext(TooljetDatabaseContext);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState(Array.isArray(columns) ? columns.map(() => 'Custom') : []);
  const currentValue = selectedRowObj;
  const [inputValues, setInputValues] = useState([]);

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
            return { value: value, disabled: disabledValue };
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

  const handleTabClick = (index, tabData, defaultValue, nullValue, columnName, dataType, currentValue) => {
    const newActiveTabs = [...activeTab];
    newActiveTabs[index] = tabData;
    setActiveTab(newActiveTabs);
    const customVal = currentValue === null || '' ? '' : currentValue;
    const customBooleanVal = currentValue === false ? false : currentValue;
    const actualDefaultVal = defaultValue === 'true' ? true : false;
    const newInputValues = [...inputValues];
    if (defaultValue && tabData === 'Default' && dataType !== 'boolean') {
      newInputValues[index] = { value: defaultValue, disabled: true };
    } else if (defaultValue && tabData === 'Default' && dataType === 'boolean') {
      newInputValues[index] = { value: actualDefaultVal, disabled: true };
    } else if (nullValue && tabData === 'Null' && dataType !== 'boolean') {
      newInputValues[index] = { value: null, disabled: true };
    } else if (nullValue && tabData === 'Null' && dataType === 'boolean') {
      newInputValues[index] = { value: null, disabled: true };
    } else if (tabData === 'Custom' && customVal.length > 0) {
      newInputValues[index] = { value: customVal, disabled: false };
    } else if (tabData === 'Custom' && customVal.length <= 0) {
      newInputValues[index] = { value: '', disabled: false };
    } else {
      newInputValues[index] = { value: customVal, disabled: false };
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
    newInputValues[index] = { value: value, disabled: false };
    setInputValues(newInputValues);
    setRowData({ ...rowData, [columnName]: value });
  };

  useEffect(() => {
    toast.dismiss();
  }, []);

  const handleSubmit = async () => {
    setFetching(true);
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
    if (error) {
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
            <input
              //defaultValue={currentValue}
              value={inputValues[index]?.value !== null && inputValues[index]?.value}
              type="text"
              disabled={inputValues[index]?.disabled || shouldInputBeDisabled}
              onChange={(e) => handleInputChange(index, e.target.value, columnName)}
              placeholder={inputValues[index]?.value !== null ? 'Enter a value' : null}
              className={!darkMode ? 'form-control' : 'form-control dark-form-row'}
              data-cy={`${String(columnName).toLocaleLowerCase().replace(/\s+/g, '-')}-input-field`}
              autoComplete="off"
              // onFocus={onFocused}
            />
            {inputValues[index]?.value === null ? (
              <p className={darkMode === true ? 'null-tag-dark' : 'null-tag'}>Null</p>
            ) : null}
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

  columns.forEach((obj) => {
    const keyName = Object.values(obj)[0];
    const dataType = Object.values(obj)[2];

    if (rowData[keyName] !== undefined && dataType !== 'character varying') {
      matchingObject[keyName] = rowData[keyName];
    } else if (rowData[keyName] !== undefined && dataType === 'character varying') {
      matchingObjectForCharacter[keyName] = rowData[keyName];
    }
  });

  const isSubset = Object.entries(matchingObject).every(([key, value]) => currentValue[key] === value);
  const isSubsetForCharacter = Object.entries(matchingObjectForCharacter).every(
    ([key, value]) => currentValue[key] === value
  );

  return (
    <div className="drawer-card-wrapper ">
      <div className="drawer-card-title">
        <h3 className="card-title" data-cy="edit-row-header">
          Edit row
        </h3>
      </div>
      <div className="card-body">
        <div>
          {selectedRowObj &&
            Array.isArray(columns) &&
            columns?.map(({ Header, accessor, dataType, column_default, constraints_type }, index) => {
              const currentValue = selectedRowObj[accessor];
              const headerText = Header.charAt(0).toUpperCase() + Header.slice(1);
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
                      <div className="d-flex align-items-center justify-content-start mb-2">
                        <span style={{ width: '24px' }}>{renderDatatypeIcon(dataType)}</span>
                        <span style={{ marginRight: '5px' }}>{headerText}</span>
                        {constraints_type?.is_primary_key === true && <SolidIcon name="primarykey" />}
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
        />
      )}
    </div>
  );
};

export default EditRowForm;
