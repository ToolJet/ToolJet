import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';
import Select from '@/_ui/Select';
import _ from 'lodash';
import BigInt from '../Icons/Biginteger.svg';
import Float from '../Icons/Float.svg';
import Integer from '../Icons/Integer.svg';
import CharacterVar from '../Icons/Text.svg';
import Boolean from '../Icons/Toggle.svg';
import './styles.scss';

const EditRowForm = ({ onEdit, onClose, rowIdToBeEdited = null }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { organizationId, selectedTable, columns, selectedTableData } = useContext(TooljetDatabaseContext);
  const [fetching, setFetching] = useState(false);
  const [selectedRow, setSelectedRow] = useState(rowIdToBeEdited);
  const [activeTab, setActiveTab] = useState(Array.isArray(columns) ? columns.map(() => 'Custom') : []);
  const currentValue = selectedTableData.find((row) => row.id === selectedRow);
  const [inputValues, setInputValues] = useState([]);

  useEffect(() => {
    toast.dismiss();
  }, []);

  useEffect(() => {
    if (currentValue) {
      const keysWithNullValues = Object.keys(currentValue).filter((key) => currentValue[key] === null);
      setActiveTab((prevActiveTabs) => {
        const newActiveTabs = [...prevActiveTabs];
        keysWithNullValues.forEach((key) => {
          const index = Object.keys(currentValue).indexOf(key);
          if (currentValue[key] === null) {
            newActiveTabs[index] = 'Null';
          }
        });
        return newActiveTabs;
      });
      const initialInputValues = currentValue
        ? Object.keys(currentValue).map((key) => {
            const value =
              currentValue[key] === null ? null : currentValue[key] === currentValue[key] ? currentValue[key] : '';
            const disabledValue = currentValue[key] === null ? true : false;
            return { value: value, disabled: disabledValue };
          })
        : [];

      setInputValues(initialInputValues);
    }
  }, [currentValue, selectedRow]);

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

  const checkDataTypeIcons = (type) => {
    switch (type) {
      case 'integer':
        return <Integer width="18" height="18" className="tjdb-column-header-name" />;
      case 'bigint':
        return <BigInt width="18" height="18" className="tjdb-column-header-name" />;
      case 'character varying':
        return <CharacterVar width="18" height="18" className="tjdb-column-header-name" />;
      case 'boolean':
        return <Boolean width="18" height="18" className="tjdb-column-header-name" />;
      case 'double precision':
        return <Float width="18" height="18" className="tjdb-column-header-name" />;
      default:
        return type;
    }
  };

  useEffect(() => {
    toast.dismiss();
  }, []);

  const handleOnSelect = (selectedOption) => {
    setSelectedRow(selectedOption);
  };

  const handleSubmit = async () => {
    setFetching(true);
    const query = `id=eq.${selectedRow}&order=id`;
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

  const renderElement = (columnName, dataType, isPrimaryKey, index) => {
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
              disabled={inputValues[index]?.disabled}
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
              disabled={inputValues[index]?.value === null}
            />
          </label>
        );

      default:
        break;
    }
  };

  const primaryColumn = columns.find((column) => column.constraints_type.is_primary_key)?.accessor || null;

  const options = selectedTableData.map((row) => {
    return {
      value: row[primaryColumn],
      label: row[primaryColumn],
    };
  });

  const headerText = primaryColumn.charAt(0).toUpperCase() + primaryColumn.slice(1);

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
          Edit a row
        </h3>
      </div>
      <div className="card-body">
        <div>
          <div className="createRow-idContainer">
            <div
              className="form-label d-flex align-items-center justify-content-start mb-2"
              data-cy={`${primaryColumn}-column-name-label`}
            >
              <span style={{ width: '24px' }}>
                <Integer width="18" height="18" className="tjdb-column-header-name" />
              </span>
              <span>{headerText}</span>
            </div>
            <div className="edit-row-dropdown col-auto row-edit-select-container w-100" data-cy="select-row-dropdown">
              <Select
                isDisabled={true}
                useMenuPortal={false}
                placeholder="Select a row to edit"
                value={selectedRow}
                options={options}
                onChange={handleOnSelect}
              />
            </div>
          </div>

          {selectedRow &&
            Array.isArray(columns) &&
            columns?.map(({ Header, accessor, dataType, column_default, constraints_type }, index) => {
              const currentValue = selectedTableData.find((row) => row.id === selectedRow)?.[accessor];
              const headerText = Header.charAt(0).toUpperCase() + Header.slice(1);
              const isPrimaryKey = constraints_type.is_primary_key;
              const isNullable = !constraints_type.is_not_null;

              if (isPrimaryKey) return null;

              return (
                <div className="edit-row-container mb-3" key={index}>
                  <div className="edit-field-container d-flex align-items-center justify-content-between">
                    <div
                      className="form-label"
                      data-cy={`${String(Header).toLocaleLowerCase().replace(/\s+/g, '-')}-column-name-label`}
                    >
                      <div className="d-flex align-items-center justify-content-start mb-2">
                        <span style={{ width: '24px' }}>{checkDataTypeIcons(dataType)}</span>
                        <span>{headerText}</span>
                      </div>
                    </div>
                    {index > 0 && (
                      <div
                        className={`${
                          darkMode ? 'row-tabs-dark' : 'row-tabs'
                        } d-flex align-items-center justify-content-start gap-2`}
                      >
                        {isNullable && (
                          <div
                            onClick={() =>
                              handleTabClick(
                                index,
                                'Null',
                                column_default,
                                isNullable,
                                accessor,
                                dataType,
                                currentValue
                              )
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
                        {column_default !== null && (
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
                      </div>
                    )}
                  </div>

                  {renderElement(accessor, dataType, isPrimaryKey, index)}
                </div>
              );
            })}
        </div>
      </div>
      {selectedRow && (
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
