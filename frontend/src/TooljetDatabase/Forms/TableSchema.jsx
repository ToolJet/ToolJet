import React, { useState, useEffect } from 'react';
import { UniqueConstraintPopOver } from '../Table/ActionsPopover/UniqueConstraintPopOver';
import cx from 'classnames';
import { ToolTip } from '@/_components/ToolTip';
import Serial from '../Icons/Serial.svg';
import ForeignKeyRelation from '../Icons/Fk-relation.svg';
import IndeterminateCheckbox from '@/_ui/IndeterminateCheckbox';
import SelectIcon from '../Icons/Select-column.svg';
import MenuIcon from '../Icons/Unique-menu.svg';
import ArrowRight from '../Icons/ArrowRight.svg';
import Tick from '../Icons/Tick.svg';
import Information from '@/_ui/Icon/solidIcons/Information';
import DropDownSelect from '../../Editor/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import tjdbDropdownStyles, { dataTypes, formatOptionLabel, serialDataType, checkDefaultValue } from '../constants';
import Select, { components } from 'react-select';
import Skeleton from 'react-loading-skeleton';

function TableSchema({
  columns,
  setColumns,
  darkMode,
  columnSelection,
  setColumnSelection,
  handleDelete,
  isEditMode,
  indexHover,
  editColumns,
  foreignKeyDetails,
  existingForeignKeyDetails,
}) {
  const [referencedColumnDetails, setReferencedColumnDetails] = useState([]);

  const { Option } = components;

  const darkDisabledBackground = '#1f2936';
  const lightDisabledBackground = '#f4f6fa';
  const lightFocussedBackground = '#fff';
  const darkFocussedBackground = 'transparent';
  const lightBackground = '#fff';
  const darkBackground = 'transparent';

  const darkBorderHover = '#dadcde';
  const lightBorderHover = '#dadcde';

  const darkDisabledBorder = '#3a3f42';
  const lightDisabledBorder = '#dadcde';
  const lightFocussedBorder = '#90B5E2 !important';
  const darkFocussedBorder = '#90b5e2 !important';
  const lightBorder = '#dadcde';
  const darkBorder = '#dadcde';
  const dropdownContainerWidth = '360px';

  const columnDetails = isEditMode ? editColumns : columns;

  const [defaultValue, setDefaultValue] = useState([]);

  useEffect(() => {
    const newDefaultValue = Object.keys(columnDetails).map((key, index) => ({
      label: columnDetails[index]?.column_default || '',
      value: columnDetails[index]?.column_default || '',
    }));
    setDefaultValue(newDefaultValue);
  }, [columnDetails]);

  const CustomSelectOption = (props) => {
    return (
      <Option {...props}>
        <div className="selected-dropdownStyle d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center justify-content-start">
            <div>{props.data.icon}</div>
            <span className="dataType-dropdown-label">{props.data.label}</span>
            <span className="dataType-dropdown-value">{props.data.name}</span>
          </div>
          <div>
            {columnDetails[columnSelection.index]?.data_type === props.data.value ? (
              <div>
                <Tick width="16" height="16" />
              </div>
            ) : null}
          </div>
        </div>
      </Option>
    );
  };

  const customStyles = tjdbDropdownStyles(
    darkMode,
    darkDisabledBackground,
    lightDisabledBackground,
    lightFocussedBackground,
    darkFocussedBackground,
    lightBackground,
    darkBackground,
    darkBorderHover,
    lightBorderHover,
    darkDisabledBorder,
    lightDisabledBorder,
    lightFocussedBorder,
    darkFocussedBorder,
    lightBorder,
    darkBorder,
    dropdownContainerWidth
  );

  const getToolTipPlacementStyle = (index, isEditMode, columns) => {
    return {
      width: isEditMode && columns[index]?.constraints_type?.is_primary_key === true ? '150px' : '126px',
    };
  };

  function countPrimaryKeyLength(primaryKeyColumn) {
    let _count = 0;
    for (const key in primaryKeyColumn) {
      if (primaryKeyColumn[key]?.constraints_type?.is_primary_key === true) {
        _count++;
      }
    }
    return _count;
  }

  const primaryKeyLength = countPrimaryKeyLength(columnDetails);

  function checkMatchingColumnNamesInForeignKey(foreignKeys, columnName) {
    return foreignKeys?.some((foreignKey) => foreignKey?.column_names?.includes(columnName));
  }

  const referenceTableDetails = referencedColumnDetails.map((item) => {
    const [key, _value] = Object.entries(item);
    return {
      label: key[1] === null ? 'Null' : key[1],
      value: key[1] === null ? 'Null' : key[1],
    };
  });

  return (
    <div className="column-schema-container">
      {Object.keys(columnDetails).map((index) => (
        <div
          key={index}
          className={`list-group-item mb-1 mt-2 table-schema  ${index == indexHover ? 'foreignKey-hover' : ''}`}
        >
          <div className="table-schema-row">
            {/* <div className="col-1">
                  <DragIcon />
                </div> */}
            <div className="m-0 pe-0 ps-1 columnName" data-cy="column-name-input-field">
              <input
                onChange={(e) => {
                  e.persist();
                  const prevColumns = { ...columnDetails };
                  prevColumns[index].column_name = e.target.value;
                  setColumns(prevColumns);
                }}
                value={columnDetails[index].column_name}
                type="text"
                className="form-control"
                placeholder="Enter name"
                data-cy={`name-input-field-${columnDetails[index].column_name}`}
                // disabled={columns[index]?.constraints_type?.is_primary_key === true}
              />
            </div>

            <ToolTip
              message={
                foreignKeyDetails.some((item) => item.column_names[0] === columnDetails[index]?.column_name) ? (
                  <div>
                    <span>Foreign key relation</span>
                    <div className="d-flex align-item-center justify-content-between mt-2 custom-tooltip-style">
                      <span>
                        {
                          foreignKeyDetails.find((item) => item.column_names[0] === columnDetails[index]?.column_name)
                            ?.column_names[0]
                        }
                      </span>
                      <ArrowRight />
                      <span>{`${
                        foreignKeyDetails.find((item) => item.column_names[0] === columnDetails[index]?.column_name)
                          ?.referenced_table_name
                      }.${
                        foreignKeyDetails.find((item) => item.column_names[0] === columnDetails[index]?.column_name)
                          ?.referenced_column_names[0]
                      }`}</span>
                    </div>
                  </div>
                ) : columnDetails[index]?.data_type === 'boolean' ? (
                  'Foreign key relation cannot be created for boolean type column'
                ) : columnDetails[index]?.data_type === 'serial' ? (
                  'Foreign key relation cannot be created for serial type column'
                ) : (
                  'No foreign key relation'
                )
              }
              placement="top"
              tooltipClassName="tootip-table"
            >
              <div
                className={cx({
                  'foreign-key-relation-active': foreignKeyDetails?.some(
                    (item) => item.column_names[0] === columnDetails[index]?.column_name
                  ),
                  'foreign-key-relation': foreignKeyDetails?.some(
                    (item) => item.column_names[0] !== columnDetails[index]?.column_name
                  ),
                })}
              >
                <ForeignKeyRelation width="13" height="13" />
              </div>
            </ToolTip>

            <ToolTip
              message="Primary key data type cannot be modified"
              placement="top"
              tooltipClassName="tootip-table"
              style={getToolTipPlacementStyle(index, isEditMode, columnDetails)}
              show={isEditMode && columnDetails[index]?.constraints_type?.is_primary_key === true ? true : false}
            >
              <div className="p-0 datatype-dropdown" data-cy="type-dropdown-field">
                <Select
                  width="120px"
                  height="36px"
                  //useMenuPortal={false}
                  value={columnDetails[index]?.dataTypeDetails}
                  defaultValue={columnDetails[index]?.constraints_type?.is_primary_key === true ? serialDataType : null}
                  options={dataTypes}
                  onChange={(value) => {
                    setColumnSelection((prevState) => ({
                      ...prevState,
                      index: index,
                      value: value.value,
                    }));
                    const prevColumns = { ...columnDetails };
                    prevColumns[index].data_type = value ? value.value : null;
                    isEditMode &&
                      (prevColumns[index].column_default = value.value === 'serial' ? 'Auto-generated' : null);
                    prevColumns[index].dataTypeDetails = value;
                    const columnConstraints = prevColumns[index]?.constraints_type ?? {};
                    columnConstraints.is_not_null =
                      value.value === 'serial' ||
                      (prevColumns[index].constraints_type?.is_primary_key &&
                        prevColumns[index]?.data_type !== 'serial');

                    columnConstraints.is_unique = prevColumns[index].constraints_type?.is_primary_key
                      ? true
                      : value?.value === 'boolean'
                      ? false
                      : false;

                    columnConstraints.is_primary_key = value.value === 'boolean' && false;
                    // columnConstraints.is_primary_key = value.value === 'serial' && true;
                    prevColumns[index].constraints_type = { ...columnConstraints };
                    setColumns(prevColumns);
                  }}
                  components={{
                    Option: CustomSelectOption,
                    IndicatorSeparator: () => null,
                  }}
                  styles={customStyles}
                  formatOptionLabel={formatOptionLabel}
                  placeholder={
                    columnDetails[index].data_type === 'serial' ? (
                      <div>
                        <span style={{ marginRight: '5px' }}>
                          <Serial width="16" />
                        </span>
                        <span>{columns[0]?.data_type}</span>
                      </div>
                    ) : (
                      <div>
                        <span style={{ marginRight: '3px' }}>
                          <SelectIcon width="17" />
                        </span>
                        <span style={{ color: '#889096' }}>Select...</span>
                      </div>
                    )
                  }
                  onMenuOpen={() => {
                    setColumnSelection((prevState) => ({
                      ...prevState,
                      index: index,
                      value: columnDetails[index]?.data_type,
                    }));
                  }}
                  onMenuClose={() => {
                    setColumnSelection({ index: 0, value: '' });
                  }}
                  isDisabled={
                    isEditMode && columnDetails[index]?.constraints_type?.is_primary_key === true ? true : false
                  }
                />
              </div>
            </ToolTip>
            {checkMatchingColumnNamesInForeignKey(foreignKeyDetails, columnDetails[index].column_name) ? (
              <DropDownSelect
                buttonClasses="border border-end-1 foreignKeyAcces-container"
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
                    <Skeleton height={18} width={176} className="skeleton" style={{ margin: '15px 50px 7px 7px' }} />
                    <Skeleton height={18} width={212} className="skeleton" style={{ margin: '7px 14px 7px 7px' }} />
                    <Skeleton height={18} width={176} className="skeleton" style={{ margin: '7px 50px 15px 7px' }} />
                  </div>
                }
                isLoading={true}
                value={
                  columnDetails[index].column_default !== null
                    ? { value: columnDetails[index].column_default, label: columnDetails[index].column_default }
                    : defaultValue[index]
                }
                // foreignKeyAccessInRowForm={true}
                disabled={
                  (columnDetails[index].data_type === 'serial' &&
                    columnDetails[index]?.constraints_type?.is_primary_key === true) ||
                  columnDetails[index].data_type === 'serial'
                }
                topPlaceHolder={
                  (columnDetails[index].data_type === 'serial' &&
                    columnDetails[index]?.constraints_type?.is_primary_key === true) ||
                  columnDetails[index].data_type === 'serial'
                    ? 'Auto-generated'
                    : 'Null'
                }
                onChange={(value) => {
                  setDefaultValue((prevState) => {
                    const newState = [...prevState];
                    newState[index].value = value.value === 'Null' ? null : value.value;
                    newState[index].label = value.value === 'Null' ? null : value.value;
                    return newState;
                  });
                  const prevColumns = { ...columnDetails };
                  prevColumns[index].column_default = value.value;
                  setColumns(prevColumns);
                }}
                onAdd={true}
                addBtnLabel={'Open referenced table'}
                foreignKeys={foreignKeyDetails}
                setReferencedColumnDetails={setReferencedColumnDetails}
                scrollEventForColumnValues={true}
                cellColumnName={columnDetails[index].column_name}
                columnDataType={columnDetails[index].data_type}
                isEditTable={isEditMode}
                isCreateTable={!isEditMode}
              />
            ) : (
              <ToolTip
                message={
                  columnDetails[index]?.data_type === 'serial' ? 'Serial data type values cannot be modified' : null
                }
                placement="top"
                tooltipClassName="tootip-table"
                style={getToolTipPlacementStyle(index, isEditMode, columnDetails)}
                show={columnDetails[index]?.data_type === 'serial'}
              >
                <div className="m-0" data-cy="column-default-input-field">
                  <input
                    onChange={(e) => {
                      e.persist();
                      const prevColumns = { ...columnDetails };
                      prevColumns[index].column_default = e.target.value;
                      setColumns(prevColumns);
                    }}
                    value={
                      columnDetails[index].data_type === 'serial'
                        ? 'Auto-generated'
                        : // : checkDefaultValue(columnDetails[index].column_default)
                          // ? null
                          columnDetails[index].column_default
                    }
                    type="text"
                    className="form-control defaultValue"
                    data-cy="default-input-field"
                    placeholder={
                      (columnDetails[index].data_type === 'serial' &&
                        columnDetails[index]?.constraints_type?.is_primary_key === true) ||
                      columnDetails[index].data_type === 'serial'
                        ? 'Auto-generated'
                        : 'Enter value'
                    }
                    disabled={
                      (columnDetails[index].data_type === 'serial' &&
                        columnDetails[index]?.constraints_type?.is_primary_key === true) ||
                      columnDetails[index].data_type === 'serial'
                    }
                  />
                </div>
              </ToolTip>
            )}

            <ToolTip
              message={
                columnDetails[index]?.data_type === 'boolean'
                  ? 'Boolean type column cannot be a primary key'
                  : 'There must be atleast one Primary key'
              }
              placement="top"
              tooltipClassName="tootip-table"
              show={
                (primaryKeyLength === 1 && columnDetails[index]?.constraints_type?.is_primary_key === true) ||
                columnDetails[index]?.data_type === 'boolean'
              }
            >
              <div className="primary-check">
                <IndeterminateCheckbox
                  checked={
                    columnDetails[index]?.constraints_type?.is_primary_key &&
                    columnDetails[index]?.data_type === 'boolean'
                      ? false
                      : columnDetails[index]?.constraints_type?.is_primary_key
                      ? true
                      : false
                  }
                  onChange={(e) => {
                    const prevColumns = { ...columnDetails };
                    const columnConstraints = prevColumns[index]?.constraints_type ?? {};
                    // const data = e.target.checked === true ? true : false;
                    columnConstraints.is_primary_key = e.target.checked;
                    columnConstraints.is_not_null =
                      // isEditMode && e.target.checked === false
                      //   ? true
                      e.target.checked === true ||
                      prevColumns[index].data_type === 'serial' ||
                      e.target.checked === false
                        ? true
                        : false;
                    columnConstraints.is_unique =
                      e.target.checked === true ||
                      prevColumns[index].data_type === 'serial' ||
                      e.target.checked === false
                        ? true
                        : false;
                    prevColumns[index].constraints_type = { ...columnConstraints };
                    // prevColumns[index].data_type = data === false && '';
                    setColumns(prevColumns);
                  }}
                  disabled={
                    (primaryKeyLength === 1 && columnDetails[index]?.constraints_type?.is_primary_key === true) ||
                    columnDetails[index].data_type === 'boolean'
                  }
                />
              </div>
            </ToolTip>

            <ToolTip
              // message="Primary key values cannot be null"
              message={
                columnDetails[index]?.constraints_type?.is_primary_key === true
                  ? 'Primary key values cannot be null'
                  : columnDetails[index]?.data_type === 'serial' &&
                    columnDetails[index]?.constraints_type?.is_primary_key !== true
                  ? 'Serial data type cannot have NULL value'
                  : null
              }
              placement="top"
              tooltipClassName="tootip-table"
              style={getToolTipPlacementStyle(index, isEditMode, columnDetails)}
              show={
                columnDetails[index]?.constraints_type?.is_primary_key === true ||
                (columnDetails[index]?.data_type === 'serial' &&
                  columnDetails[index]?.constraints_type?.is_primary_key !== true)
              }
            >
              <div className="d-flex not-null-toggle">
                <label className={`form-switch`}>
                  <input
                    className="form-check-input"
                    data-cy={`${String(
                      columnDetails[index]?.constraints_type?.is_not_null ?? false ? 'NOT NULL' : 'NULL'
                    )
                      .toLowerCase()
                      .replace(/\s+/g, '-')}-checkbox`}
                    type="checkbox"
                    checked={columnDetails[index]?.constraints_type?.is_not_null ?? false}
                    onChange={(e) => {
                      const prevColumns = { ...columnDetails };
                      const columnConstraints = prevColumns[index]?.constraints_type ?? {};
                      columnConstraints.is_not_null = e.target.checked;
                      prevColumns[index].constraints_type = { ...columnConstraints };
                      setColumns(prevColumns);
                    }}
                    disabled={
                      columnDetails[index]?.constraints_type?.is_primary_key === true ||
                      columnDetails[index]?.data_type === 'serial'
                    }
                  />
                </label>
                <p
                  data-cy={`${String(columnDetails[index]?.constraints_type?.is_not_null ?? false ? 'NOT NULL' : 'NULL')
                    .toLowerCase()
                    .replace(/\s+/g, '-')}-text`}
                  className="m-0"
                >
                  {columnDetails[index]?.constraints_type?.is_not_null ?? false ? (
                    <span
                      className={`${
                        columnDetails[index]?.constraints_type?.is_primary_key === true ? 'not-null-with-disable' : ''
                      }`}
                    >
                      NOT NULL
                    </span>
                  ) : (
                    <span>NULL</span>
                  )}
                </p>
              </div>
            </ToolTip>

            <div>
              <UniqueConstraintPopOver
                disabled={false}
                onDelete={() => handleDelete(index)}
                darkMode={darkMode}
                columns={columnDetails}
                setColumns={setColumns}
                index={index}
                isEditMode={isEditMode}
              >
                <div className="cursor-pointer">
                  <MenuIcon />
                </div>
              </UniqueConstraintPopOver>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TableSchema;
