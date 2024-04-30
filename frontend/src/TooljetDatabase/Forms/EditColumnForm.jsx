import React, { useState, useContext } from 'react';
import Select from 'react-select';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import tjdbDropdownStyles, { dataTypes, formatOptionLabel, serialDataType, getColumnDataType } from '../constants';
import WarningInfo from '../Icons/Edit-information.svg';
import { isEmpty } from 'lodash';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components/ToolTip';

const ColumnForm = ({ onClose, selectedColumn, setColumns, rows }) => {
  const nullValue = selectedColumn?.constraints_type?.is_not_null ?? false;
  const uniqueConstraintValue = selectedColumn?.constraints_type?.is_unique ?? false;

  const [columnName, setColumnName] = useState(selectedColumn?.Header);
  const [defaultValue, setDefaultValue] = useState(selectedColumn?.column_default);
  const [dataType, setDataType] = useState(selectedColumn?.dataType);
  const [fetching, setFetching] = useState(false);
  const [isNotNull, setIsNotNull] = useState(nullValue);
  const [isUniqueConstraint, setIsUniqueConstraint] = useState(uniqueConstraintValue);
  const { organizationId, selectedTable, handleRefetchQuery, queryFilters, pageCount, pageSize, sortFilters } =
    useContext(TooljetDatabaseContext);
  const disabledDataType = dataTypes.find((e) => e.value === dataType);
  const [defaultValueLength] = useState(defaultValue?.length);

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
  const lightFocussedBorder = '#dadcde';
  const darkFocussedBorder = '#3e63dd !important';
  const lightBorder = '#dadcde';
  const darkBorder = '#3a3f42 !important';
  const dropdownContainerWidth = '360px';

  const darkMode = localStorage.getItem('darkMode') === 'true';

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

  const handleTypeChange = (value) => {
    setDataType(value);
  };

  const handleEdit = async () => {
    const colDetails = {
      column: {
        column_name: selectedColumn?.Header,
        data_type: selectedColumn?.dataType,
        ...(selectedColumn?.dataType !== 'serial' && { column_default: defaultValue }),
        constraints_type: {
          is_not_null: isNotNull,
          is_primary_key: selectedColumn?.constraints_type?.is_primary_key ?? false,
          is_unique: isUniqueConstraint,
        },
        ...(columnName !== selectedColumn?.Header ? { new_column_name: columnName } : {}),
      },
    };

    if (
      columnName !== selectedColumn?.Header ||
      defaultValue?.length > 0 ||
      defaultValue !== selectedColumn?.column_default ||
      nullValue !== isNotNull ||
      uniqueConstraintValue !== isUniqueConstraint
    ) {
      setFetching(true);
      const { error } = await tooljetDatabaseService.updateColumn(organizationId, selectedTable.table_name, colDetails);
      setFetching(false);
      if (error) {
        toast.error(error?.message ?? `Failed to edit a column in "${selectedTable.table_name}" table`);
        return;
      }
    }

    tooljetDatabaseService.viewTable(organizationId, selectedTable.table_name).then(({ data = [], error }) => {
      if (error) {
        toast.error(error?.message ?? `Error fetching columns for table "${selectedTable}"`);
        return;
      }

      if (data?.result?.length > 0) {
        setColumns(
          data?.result.map(({ column_name, data_type, ...rest }) => ({
            Header: column_name,
            accessor: column_name,
            dataType: getColumnDataType({ column_default: rest.column_default, data_type }),
            ...rest,
          }))
        );
      }
    });
    handleRefetchQuery(queryFilters, sortFilters, pageCount, pageSize);
    toast.success(`Column edited successfully`);
    onClose && onClose();
  };

  const toolTipPlacementStyle = {
    width: '126px',
  };

  return (
    <div className="drawer-card-wrapper ">
      <div className="drawer-card-title ">
        <h3 className="primaryKey-indication-container" data-cy="create-new-column-header">
          Edit column
          {selectedColumn.constraints_type.is_primary_key === true && (
            <ToolTip
              message={'Primary key'}
              placement="bottom"
              tooltipClassName="primary-key-tooltip"
              show={selectedColumn.constraints_type.is_primary_key === true}
            >
              <div className="primaryKey-indication">
                <SolidIcon name="primarykey" />
              </div>
            </ToolTip>
          )}
        </h3>
      </div>

      <div className="card-body">
        <div className="edit-warning-info mb-3">
          <div className="edit-warning-icon">
            <WarningInfo />
          </div>
          <span className="edit-warning-text">
            Editing the column could break queries and apps connected with this table.
          </span>
        </div>
        <div className="mb-3 tj-app-input">
          <div className="form-label" data-cy="column-name-input-field-label">
            <span style={{ marginRight: '6px' }}>Column name</span>
            {selectedColumn?.constraints_type?.is_primary_key === true}
          </div>
          <input
            value={columnName}
            type="text"
            placeholder="Enter column name"
            className="form-control"
            data-cy="column-name-input-field"
            autoComplete="off"
            onChange={(e) => setColumnName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="column-datatype-selector mb-3 data-type-dropdown-section" data-cy="data-type-dropdown-section">
          <div className="form-label" data-cy="data-type-input-field-label">
            Data type
          </div>
          <ToolTip message={'Data type cannot be modified'} placement="top" tooltipClassName="tootip-table">
            <div>
              <Select
                isDisabled={true}
                defaultValue={selectedColumn?.dataType === 'serial' ? serialDataType : disabledDataType}
                formatOptionLabel={formatOptionLabel}
                options={dataTypes}
                onChange={handleTypeChange}
                components={{ IndicatorSeparator: () => null }}
                styles={customStyles}
                isSearchable={false}
              />
            </div>
          </ToolTip>
        </div>
        <div className="mb-3 tj-app-input">
          <div className="form-label" data-cy="default-value-input-field-label">
            Default value
          </div>
          <ToolTip
            message={selectedColumn?.dataType === 'serial' ? 'Serial data type values cannot be modified' : null}
            placement="top"
            tooltipClassName="tootip-table"
            show={selectedColumn?.dataType === 'serial'}
          >
            <div>
              <input
                value={selectedColumn?.dataType !== 'serial' ? defaultValue : null}
                type="text"
                placeholder={selectedColumn?.dataType === 'serial' ? 'Auto-generated' : 'Enter default value'}
                className={'form-control'}
                data-cy="default-value-input-field"
                autoComplete="off"
                onChange={(e) => setDefaultValue(e.target.value)}
                disabled={selectedColumn?.dataType === 'serial'}
              />
            </div>
          </ToolTip>
          {isNotNull === true &&
          selectedColumn?.dataType !== 'serial' &&
          rows.length > 0 &&
          !isEmpty(defaultValue) &&
          defaultValueLength > 0 ? (
            <span className="form-warning-message">
              Changing the default value will NOT update the fields having existing default value
            </span>
          ) : null}
        </div>
        <ToolTip
          message={
            selectedColumn.constraints_type.is_primary_key === true
              ? 'Primary key values cannot be null'
              : selectedColumn.dataType === 'serial' &&
                (selectedColumn.constraints_type.is_primary_key !== true ||
                  selectedColumn.constraints_type.is_primary_key === true)
              ? 'Serial data type cannot have null value'
              : null
          }
          placement="top"
          tooltipClassName="tooltip-table-edit-column"
          style={toolTipPlacementStyle}
          show={
            selectedColumn.constraints_type.is_primary_key === true ||
            (selectedColumn.dataType === 'serial' &&
              (selectedColumn.constraints_type.is_primary_key !== true ||
                selectedColumn.constraints_type.is_primary_key === true))
          }
        >
          <div className="row mb-1">
            <div className="col-1">
              <label className={`form-switch`}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={isNotNull}
                  onChange={(e) => {
                    setIsNotNull(e.target.checked);
                  }}
                  disabled={selectedColumn?.dataType === 'serial' || selectedColumn?.constraints_type?.is_primary_key}
                />
              </label>
            </div>
            <div className="col d-flex flex-column">
              <p className="m-0 p-0 fw-500">{isNotNull ? 'NOT NULL' : 'NULL'}</p>
              <p className="fw-400 secondary-text">
                {isNotNull ? 'Not null constraint is added' : 'This field can accept NULL value'}
              </p>
            </div>
          </div>
        </ToolTip>
        <ToolTip
          message={
            selectedColumn.constraints_type.is_primary_key === true
              ? 'Primary key values must be unique'
              : selectedColumn.dataType === 'serial' &&
                (selectedColumn.constraints_type.is_primary_key !== true ||
                  selectedColumn.constraints_type.is_primary_key === true)
              ? 'Serial data type value must be unique'
              : null
          }
          placement="top"
          tooltipClassName="tooltip-table-edit-column"
          style={toolTipPlacementStyle}
          show={
            selectedColumn.constraints_type?.is_primary_key === true ||
            (selectedColumn.dataType === 'serial' &&
              (selectedColumn.constraints_type.is_primary_key !== true ||
                selectedColumn.constraints_type.is_primary_key === true))
          }
        >
          <div className="row mb-1">
            <div className="col-1">
              <label className={`form-switch`}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={isUniqueConstraint || selectedColumn?.constraints_type?.is_primary_key ? true : false}
                  onChange={(e) => {
                    setIsUniqueConstraint(e.target.checked);
                  }}
                  disabled={selectedColumn?.dataType === 'serial' || selectedColumn?.constraints_type?.is_primary_key}
                />
              </label>
            </div>
            <div className="col d-flex flex-column">
              <p className="m-0 p-0 fw-500">
                {isUniqueConstraint || selectedColumn?.constraints_type?.is_primary_key ? 'UNIQUE' : 'NOT UNIQUE'}
              </p>
              <p className="fw-400 secondary-text">
                {isUniqueConstraint || selectedColumn?.constraints_type?.is_primary_key
                  ? 'Unique value constraint is added'
                  : 'Unique value constraint is not added'}
              </p>
            </div>
          </div>
        </ToolTip>
      </div>
      <DrawerFooter
        isEditMode={true}
        fetching={fetching}
        onClose={onClose}
        onEdit={handleEdit}
        shouldDisableCreateBtn={columnName === ''}
      />
    </div>
  );
};
export default ColumnForm;
