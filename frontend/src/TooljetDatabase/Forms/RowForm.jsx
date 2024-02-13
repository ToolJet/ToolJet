import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';
import BigInt from '../Icons/Biginteger.svg';
import Float from '../Icons/Float.svg';
import Integer from '../Icons/Integer.svg';
import CharacterVar from '../Icons/Text.svg';
import Boolean from '../Icons/Toggle.svg';
import './styles.scss';

const RowForm = ({ onCreate, onClose }) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const { organizationId, selectedTable, columns } = useContext(TooljetDatabaseContext);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState(Array.isArray(columns) ? columns.map(() => 'Custom') : []);
  const [inputValues, setInputValues] = useState(
    Array.isArray(columns)
      ? columns.map((item) => {
          if (item.column_default !== null) {
            return { value: '', checkboxValue: false, disabled: false };
          } else if (item.constraints_type.is_not_null === false) {
            return { value: '', checkboxValue: false, disabled: false };
          }
          return { value: '', checkboxValue: false, disabled: false };
        })
      : []
  );

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

  const handleTabClick = (index, tabData, defaultValue, nullValue, columnName, dataType) => {
    const newActiveTabs = [...activeTab];
    newActiveTabs[index] = tabData;
    setActiveTab(newActiveTabs);
    const newInputValues = [...inputValues];
    const actualDefaultVal = defaultValue === 'true' ? true : false;
    if (defaultValue && tabData === 'Default' && dataType !== 'boolean') {
      newInputValues[index] = { value: defaultValue, checkboxValue: defaultValue, disabled: true };
    } else if (defaultValue && tabData === 'Default' && dataType === 'boolean') {
      newInputValues[index] = { value: defaultValue, checkboxValue: actualDefaultVal, disabled: true };
    } else if (nullValue && tabData === 'Null' && dataType !== 'boolean') {
      newInputValues[index] = { value: null, checkboxValue: false, disabled: true };
    } else if (nullValue && tabData === 'Null' && dataType === 'boolean') {
      newInputValues[index] = { value: null, checkboxValue: null, disabled: true };
    } else if (tabData === 'Custom' && dataType === 'character varying') {
      newInputValues[index] = { value: '', checkboxValue: false, disabled: false };
    } else {
      newInputValues[index] = { value: '', checkboxValue: false, disabled: false };
    }

    setInputValues(newInputValues);
    if (dataType === 'boolean') {
      setData({
        ...data,
        [columnName]: newInputValues[index].checkboxValue === null ? null : newInputValues[index].checkboxValue,
      });
    } else {
      setData({
        ...data,
        [columnName]:
          newInputValues[index].value === null
            ? null
            : newInputValues[index].value === 'Default'
            ? defaultValue
            : newInputValues[index].value,
      });
    }
  };

  const handleInputChange = (index, value, columnName) => {
    const newInputValues = [...inputValues];
    newInputValues[index] = { value, checkboxValue: inputValues[index].checkboxValue, disabled: false };
    setInputValues(newInputValues);
    setData({ ...data, [columnName]: value });
  };

  const handleCheckboxChange = (index, value, columnName) => {
    const newInputValues = [...inputValues];
    newInputValues[index] = {
      value: inputValues[index].value,
      checkboxValue: !inputValues[index].checkboxValue,
      disabled: inputValues[index].disabled,
    };
    setInputValues(newInputValues);
    setData({ ...data, [columnName]: value });
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
    setData(
      columns.reduce((result, item) => {
        if (item.accessor !== 'id') {
          if (item.dataType === 'boolean') {
            result[item.accessor] = false;
          } else {
            result[item.accessor] = '';
          }
        }
        return result;
      }, {})
    );
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
    switch (dataType) {
      case 'character varying':
      case 'integer':
      case 'bigint':
      case 'serial':
      case 'double precision':
        return (
          <div style={{ position: 'relative' }}>
            <input
              //defaultValue={!isPrimaryKey && defaultValue?.length > 0 ? removeQuotes(defaultValue.split('::')[0]) : ''}
              type="text"
              value={inputValues[index]?.value === null ? '' : inputValues[index]?.value}
              onChange={(e) => handleInputChange(index, e.target.value, columnName)}
              disabled={isPrimaryKey || inputValues[index]?.disabled}
              placeholder={isPrimaryKey ? 'Auto-generated' : inputValues[index]?.value !== null && 'Enter a value'}
              className={
                isPrimaryKey && !darkMode
                  ? 'primary-idKey-light'
                  : isPrimaryKey && darkMode
                  ? 'primary-idKey-dark'
                  : !darkMode
                  ? 'form-control'
                  : 'form-control dark-form-row'
              }
              data-cy={`${String(columnName).toLocaleLowerCase().replace(/\s+/g, '-')}-input-field`}
              autoComplete="off"
            />
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
    const keyName = Object.values(obj)[0];
    const dataType = Object.values(obj)[2];

    if (data[keyName] !== undefined && dataType !== 'character varying') {
      matchingObject[keyName] = data[keyName];
    }
  });

  return (
    <div className="drawer-card-wrapper ">
      <div className="card-header">
        <h3 className="card-title" data-cy="create-new-row-header">
          Create a new row
        </h3>
      </div>
      <div className="card-body tj-app-input">
        {Array.isArray(columns) &&
          columns?.map(({ Header, accessor, dataType, constraints_type, column_default }, index) => {
            const isPrimaryKey = constraints_type.is_primary_key;
            const isNullable = !constraints_type.is_not_null;
            const headerText = Header.charAt(0).toUpperCase() + Header.slice(1);
            return (
              <div className="mb-3 " key={index}>
                <div className="d-flex align-items-center justify-content-between">
                  <div
                    className="form-label"
                    data-cy={`${String(Header).toLocaleLowerCase().replace(/\s+/g, '-')}-column-name-label`}
                  >
                    <div className="headerText-withIcon d-flex align-items-center justify-content-start">
                      <span style={{ width: '24px' }}>
                        {Header == 'id' ? (
                          <Integer width="18" height="18" className="tjdb-column-header-name" />
                        ) : (
                          checkDataTypeIcons(dataType)
                        )}
                      </span>
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
                      {column_default !== null && (
                        <div
                          onClick={() =>
                            handleTabClick(index, 'Default', column_default, isNullable, accessor, dataType)
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
                    </div>
                  )}
                </div>
                {renderElement(accessor, dataType, isPrimaryKey, column_default, index)}
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
