import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { TooljetDatabaseContext } from '../index';
import { tooljetDatabaseService } from '@/_services';
import Select from '@/_ui/Select';
import _ from 'lodash';
import { useMounted } from '@/_hooks/use-mount';
import BigInt from '../Icons/Biginteger.svg';
import Float from '../Icons/Float.svg';
import Integer from '../Icons/Integer.svg';
import CharacterVar from '../Icons/Text.svg';
import Boolean from '../Icons/Toggle.svg';
import './styles.scss';

const EditRowForm = ({ onEdit, onClose }) => {
  const { organizationId, selectedTable, columns, selectedTableData } = useContext(TooljetDatabaseContext);
  const [fetching, setFetching] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [activeTab, setActiveTab] = useState(Array.isArray(columns) ? columns.map(() => 'Custom') : []);
  const currentValue = selectedTableData.find((row) => row.id === selectedRow);
  const [inputValues, setInputValues] = useState([]);

  useEffect(() => {
    if (currentValue) {
      const keysWithNullValues = Object.keys(currentValue).filter((key) => currentValue[key] === null);
      setActiveTab((prevActiveTabs) => {
        const newActiveTabs = [...prevActiveTabs];
        keysWithNullValues.forEach((key) => {
          const index = Object.keys(currentValue).indexOf(key);
          if (index !== -1) {
            newActiveTabs[index] = 'Null';
          }
        });
        return newActiveTabs;
      });
      const initialInputValues = currentValue
        ? Object.keys(currentValue).map((key) => {
            const value =
              currentValue[key] === null ? 'Null' : currentValue[key] === currentValue[key] ? currentValue[key] : '';
            return { value: value, disabled: false };
          })
        : [];

      setInputValues(initialInputValues);
    }
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
    const customBooleanVal = currentValue === null || false ? false : currentValue;
    const actualDefaultVal = defaultValue === 'true' ? true : false;
    const newInputValues = [...inputValues];
    if (defaultValue && tabData === 'Default' && dataType !== 'boolean') {
      newInputValues[index] = { value: defaultValue, disabled: true };
    } else if (defaultValue && tabData === 'Default' && dataType === 'boolean') {
      newInputValues[index] = { value: actualDefaultVal, disabled: true };
    } else if (nullValue === 'YES' && tabData === 'Null' && dataType !== 'boolean') {
      newInputValues[index] = { value: 'Null', disabled: true };
    } else if (nullValue === 'YES' && tabData === 'Null' && dataType === 'boolean') {
      newInputValues[index] = { value: false, disabled: true };
    } else {
      newInputValues[index] = { value: customVal, disabled: false };
    }
    setInputValues(newInputValues);
    if (dataType === 'boolean') {
      setRowData({
        ...rowData,
        [columnName]:
          newInputValues[index].value === 'Null'
            ? false
            : newInputValues[index].value === defaultValue
            ? defaultValue === 'true'
              ? true
              : false
            : newInputValues[index].value === currentValue
            ? currentValue
            : currentValue === null && customBooleanVal === false
            ? false
            : null,
      });
    } else {
      setRowData({
        ...rowData,
        [columnName]:
          newInputValues[index].value === 'Null'
            ? null
            : newInputValues[index].value === defaultValue
            ? defaultValue
            : newInputValues[index].value === currentValue
            ? currentValue
            : currentValue === null && customVal === ''
            ? null
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
          <input
            //defaultValue={currentValue}
            value={inputValues[index]?.value}
            type="text"
            disabled={isPrimaryKey}
            onChange={(e) => handleInputChange(index, e.target.value, columnName)}
            placeholder={'Enter a value'}
            className="form-control"
            data-cy={`${String(columnName).toLocaleLowerCase().replace(/\s+/g, '-')}-input-field`}
            autoComplete="off"
            // onFocus={onFocused}
          />
        );

      case 'boolean':
        return (
          <label className={`form-switch`}>
            <input
              className="form-check-input"
              type="checkbox"
              checked={inputValues[index]?.value}
              onChange={(e) => handleInputChange(index, e.target.checked, columnName)}
            />
          </label>
        );

      default:
        break;
    }
  };

  const primaryColumn = columns.find((column) => column.isPrimaryKey)?.accessor || null;

  const options = selectedTableData.map((row) => {
    return {
      value: row[primaryColumn],
      label: row[primaryColumn],
    };
  });

  const headerText = primaryColumn.charAt(0).toUpperCase() + primaryColumn.slice(1);

  return (
    <div className="">
      <div className="drawer-card-title">
        <h3 className="card-title" data-cy="edit-row-header">
          Edit a row
        </h3>
      </div>
      <div className="card-body">
        <div>
          <div className="mb-3 row g-2 align-items-center">
            <div className="col-2" data-cy={`${primaryColumn}-column-name-label`}>
              <Integer width="18" height="18" className="tjdb-column-header-name" />
              {headerText}
            </div>
            <div className="col-auto row-edit-select-container" data-cy="select-row-dropdown">
              <Select
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
            columns?.map(({ Header, accessor, dataType, isPrimaryKey, column_default, is_nullable }, index) => {
              const currentValue = selectedTableData.find((row) => row.id === selectedRow)?.[accessor];
              const headerText = Header.charAt(0).toUpperCase() + Header.slice(1);
              if (isPrimaryKey) return null;

              return (
                <div className="mb-3" key={index}>
                  <div className="d-flex align-items-center justify-content-between">
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
                      <div className="row-tabs d-flex align-items-center justify-content-start bg-red gap-2">
                        {is_nullable === 'YES' && (
                          <div
                            onClick={() =>
                              handleTabClick(
                                index,
                                'Null',
                                column_default,
                                is_nullable,
                                accessor,
                                dataType,
                                currentValue
                              )
                            }
                            style={{
                              backgroundColor: activeTab[index] === 'Null' ? 'white' : 'transparent',
                              color: activeTab[index] === 'Null' ? '#3E63DD' : '#687076',
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
                                is_nullable,
                                accessor,
                                dataType,
                                currentValue
                              )
                            }
                            style={{
                              backgroundColor: activeTab[index] === 'Default' ? 'white' : 'transparent',
                              color: activeTab[index] === 'Default' ? '#3E63DD' : '#687076',
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
                              is_nullable,
                              accessor,
                              dataType,
                              currentValue
                            )
                          }
                          style={{
                            backgroundColor: activeTab[index] === 'Custom' ? 'white' : 'transparent',
                            color: activeTab[index] === 'Custom' ? '#3E63DD' : '#687076',
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
      {selectedRow && <DrawerFooter isEditMode={true} fetching={fetching} onClose={onClose} onEdit={handleSubmit} />}
    </div>
  );
};

export default EditRowForm;
