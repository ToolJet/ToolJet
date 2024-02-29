import React, { useState, useContext } from 'react';
//import Select from '@/_ui/Select';
import Select from 'react-select';
import DrawerFooter from '@/_ui/Drawer/DrawerFooter';
import { toast } from 'react-hot-toast';
import { tooljetDatabaseService } from '@/_services';
import { TooljetDatabaseContext } from '../index';
import tjdbDropdownStyles, { dataTypes, formatOptionLabel } from '../constants';
import WarningInfo from '../Icons/Edit-information.svg';

const ColumnForm = ({ onClose, selectedColumn, setColumns }) => {
  const nullValue = selectedColumn.constraints_type.is_not_null;

  const [columnName, setColumnName] = useState(selectedColumn?.Header);
  const [defaultValue, setDefaultValue] = useState(selectedColumn?.column_default);
  const [dataType, setDataType] = useState(selectedColumn?.dataType);
  const [fetching, setFetching] = useState(false);
  const [isNotNull, setIsNotNull] = useState(nullValue);
  const { organizationId, selectedTable } = useContext(TooljetDatabaseContext);
  const disabledDataType = dataTypes.find((e) => e.value === dataType);

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
        ...(columnName !== selectedColumn?.Header ? { new_column_name: columnName } : {}),
        ...(defaultValue?.length > 0 || defaultValue !== selectedColumn?.column_default
          ? { column_default: defaultValue }
          : {}),
        ...(nullValue !== isNotNull
          ? {
              constraints_type: {
                is_not_null: isNotNull,
              },
            }
          : {}),
      },
    };

    if (
      columnName !== selectedColumn?.Header ||
      defaultValue?.length > 0 ||
      defaultValue !== selectedColumn?.column_default ||
      nullValue !== isNotNull
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
            dataType: data_type,
            ...rest,
          }))
        );
      }
    });
    toast.success(`Column edited successfully`);
    onClose && onClose();
  };

  // const handleEdit = async () => {
  //   if (isEmpty(columnName)) {
  //     toast.error('Column name cannot be empty');
  //     return;
  //   }
  //   if (isEmpty(dataType?.value)) {
  //     toast.error('Data type cannot be empty');
  //     return;
  //   }
  // setFetching(true);
  // const { error } = await tooljetDatabaseService.updateColumn(
  //   organizationId,
  //   selectedTable.table_name,
  //   columnName,
  //   dataType?.value,
  //   defaultValue
  // );
  // setFetching(false);
  // if (error) {
  //   toast.error(error?.message ?? `Failed to create a new column in "${selectedTable.table_name}" table`);
  //   return;
  // }
  // toast.success(`Column created successfully`);
  //   onCreate && onCreate();
  // };

  return (
    <div className="drawer-card-wrapper ">
      <div className="drawer-card-title ">
        <h3 className="" data-cy="create-new-column-header">
          Edit column
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
            Column name
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
          <Select
            isDisabled={true}
            defaultValue={disabledDataType}
            formatOptionLabel={formatOptionLabel}
            options={dataTypes}
            onChange={handleTypeChange}
            components={{ IndicatorSeparator: () => null }}
            styles={customStyles}
            isSearchable={false}
          />
        </div>
        <div className="mb-3 tj-app-input">
          <div className="form-label" data-cy="default-value-input-field-label">
            Default value
          </div>
          <input
            value={defaultValue}
            type="text"
            placeholder="Enter default value"
            className={
              isNotNull === true && (defaultValue?.length <= 0 || defaultValue === null)
                ? 'form-control form-error'
                : 'form-control'
            }
            data-cy="default-value-input-field"
            autoComplete="off"
            onChange={(e) => setDefaultValue(e.target.value)}
            disabled={dataType === 'serial'}
          />
          {isNotNull === true && (defaultValue?.length <= 0 || defaultValue === null) ? (
            <span className="form-error-message">Default value cannot be empty when NOT NULL constraint is added</span>
          ) : null}
        </div>
        <div className="row mb-3">
          <div className="col-1">
            <label className={`form-switch`}>
              <input
                className="form-check-input"
                type="checkbox"
                checked={isNotNull}
                onChange={(e) => {
                  setIsNotNull(e.target.checked);
                }}
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
      </div>
      <DrawerFooter
        isEditMode={true}
        fetching={fetching}
        onClose={onClose}
        onEdit={handleEdit}
        shouldDisableCreateBtn={columnName === '' || (isNotNull && defaultValue?.length <= 0)}
      />
    </div>
  );
};
export default ColumnForm;
