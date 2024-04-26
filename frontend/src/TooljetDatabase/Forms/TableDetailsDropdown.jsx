import React, { useState } from 'react';
import { ToolTip } from '@/_components/ToolTip';
import DropDownSelect from '../../Editor/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import Information from '@/_ui/Icon/solidIcons/Information';
import DropdownInformation from '../Icons/dropdownInfo.svg';
import tjdbDropdownStyles, {
  dataTypes,
  formatOptionLabel,
  serialDataType,
  getColumnDataType,
  renderDatatypeIcon,
} from '../constants';

function TableDetailsDropdown({
  firstColumnName,
  secondColumnName,
  tableList = [],
  tableColumns = [],
  source = false,
  handleSelectColumn = () => {},
  showColumnInfo = false,
  showRedirection = false,
  showDescription = false,
  isEditColumn,
  isCreateColumn,
  defaultValue = [],
  onAdd = false,
  actions,
  setForeignKeyDetails,
  foreignKeyDetails,
}) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return (
    <div className="mt-3">
      <div className="d-flex align-items-center justify-content-between">
        <span className="keyRelation-column-title">{firstColumnName}</span>

        <ToolTip message={source ? 'Current table' : ''} placement="top" tooltipClassName="tootip-table" show={source}>
          <div style={{ width: '80%' }}>
            <DropDownSelect
              buttonClasses="border border-end-1 foreignKeyAcces-container"
              showPlaceHolder={true}
              options={tableList}
              darkMode={darkMode}
              emptyError={
                <div className="dd-select-alert-error m-2 d-flex align-items-center">
                  <Information />
                  No table selected
                </div>
              }
              value={
                source
                  ? tableList[0]
                  : actions
                  ? foreignKeyDetails?.on_update
                  : foreignKeyDetails?.referenced_table_name
              }
              foreignKeyAccess={true}
              disabled={source || isEditColumn || isCreateColumn ? true : false}
              onChange={(value) => {
                if (actions) {
                  setForeignKeyDetails((prevDetails) => ({
                    ...prevDetails,
                    on_update: value,
                  }));
                } else {
                  setForeignKeyDetails((prevDetails) => ({
                    ...prevDetails,
                    referenced_table_name: value,
                    referenced_column_names: {},
                  }));
                  // setTable(value);
                  handleSelectColumn(value?.value);
                }
              }}
              onAdd={onAdd}
              addBtnLabel={'Add new table'}
              showRedirection={showRedirection}
              showDescription={showDescription}
            />
          </div>
        </ToolTip>
      </div>

      <ToolTip message={source ? 'Current column' : null} placement="top" tooltipClassName="tootip-table" show={source}>
        <div className="d-flex align-items-center justify-content-between mt-2">
          <span className="keyRelation-column-title">{secondColumnName}</span>
          <div style={{ width: '80%' }}>
            <DropDownSelect
              buttonClasses="border border-end-1 foreignKeyAcces-container"
              showPlaceHolder={true}
              options={tableColumns.length > 0 ? tableColumns : []}
              darkMode={darkMode}
              emptyError={
                <div className="dd-select-alert-error m-2 d-flex align-items-center">
                  <Information />
                  {tableColumns.length === 0 ? 'There are no columns of the same datatype' : 'No table selected yet'}
                </div>
              }
              value={
                source && (!isEditColumn || !isCreateColumn)
                  ? foreignKeyDetails?.column_names
                  : source && (isEditColumn || isCreateColumn)
                  ? defaultValue
                  : actions
                  ? foreignKeyDetails?.on_delete
                  : foreignKeyDetails?.referenced_column_names
              }
              foreignKeyAccess={true}
              onChange={(value) => {
                if (source) {
                  // updateSelectedSourceColumns(value);
                  setForeignKeyDetails((prevDetails) => ({
                    ...prevDetails,
                    column_names: value,
                  }));
                } else if (actions) {
                  setForeignKeyDetails((prevDetails) => ({
                    ...prevDetails,
                    on_delete: value,
                  }));
                } else {
                  setForeignKeyDetails((prevDetails) => ({
                    ...prevDetails,
                    referenced_column_names: value,
                  }));
                }
              }}
              onAdd={onAdd}
              addBtnLabel={'Add new column'}
              columnInfoForTable={
                <div className="columnInfoForTable m-2 d-flex align-items-center">
                  <DropdownInformation />
                  Only columns of same data type can be added
                </div>
              }
              showColumnInfo={showColumnInfo}
              showDescription={showDescription}
              disabled={isEditColumn || isCreateColumn}
            />
          </div>
        </div>
      </ToolTip>
    </div>
  );
}

export default TableDetailsDropdown;
