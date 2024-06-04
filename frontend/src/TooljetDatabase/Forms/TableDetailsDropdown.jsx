import React, { useEffect } from 'react';
import { ToolTip } from '@/_components/ToolTip';
import DropDownSelect from '../../Editor/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import Information from '@/_ui/Icon/solidIcons/Information';
import DropdownInformation from '../Icons/dropdownInfo.svg';
import { isEmpty } from 'lodash';

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
  onAdd,
  actions,
  setForeignKeyDetails,
  foreignKeyDetails,
  setSourceColumn,
  sourceColumn,
  setTargetTable,
  targetTable,
  setOnDelete,
  onDelete,
  setOnUpdate,
  onUpdate,
  targetColumn,
  setTargetColumn,
  tableName,
  fetchTables = () => {},
  onTableClick = false,
  isSourceColumnAvailable = false,
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
                  No data found
                </div>
              }
              value={source ? tableList[0] : actions ? onUpdate : targetTable}
              foreignKeyAccess={true}
              disabled={source || isEditColumn || isCreateColumn ? true : false}
              topPlaceHolder={!source && !actions && 'Select table..'}
              showPlaceHolderInForeignKeyDrawer={true}
              onChange={(value) => {
                if (actions) {
                  setOnUpdate(value);
                } else {
                  setTargetTable(value);
                  handleSelectColumn(value?.value);
                  setTargetColumn({ value: '', label: '', dataType: '' });
                }
              }}
              onAdd={onAdd}
              addBtnLabel={'Add new table'}
              showRedirection={showRedirection}
              showDescription={showDescription}
              tableName={tableName}
              targetTable={targetTable}
              actions={actions}
              actionName={firstColumnName}
              fetchTables={fetchTables}
              onTableClick={onTableClick}
            />
          </div>
        </ToolTip>
      </div>

      <ToolTip
        message={source && (isEditColumn || isCreateColumn) && 'Current column'}
        placement="top"
        tooltipClassName="tootip-table"
        show={(source && (isEditColumn || isCreateColumn)) ?? false}
      >
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
                  {isEmpty(targetTable)
                    ? 'Please select the table'
                    : isSourceColumnAvailable
                    ? 'Please select source column'
                    : tableColumns.length === 0
                    ? 'There are no columns of the same datatype'
                    : 'There are no columns of the same datatype'}
                </div>
              }
              value={
                source && (!isEditColumn || !isCreateColumn)
                  ? sourceColumn
                  : source && (isEditColumn || isCreateColumn)
                  ? defaultValue
                  : actions
                  ? onDelete
                  : targetColumn
              }
              foreignKeyAccess={true}
              topPlaceHolder={!actions && 'Select column..'}
              showPlaceHolderInForeignKeyDrawer={true}
              onChange={(value) => {
                if (source) {
                  setSourceColumn(value);
                } else if (actions) {
                  setOnDelete(value);
                } else {
                  setTargetColumn(value);
                }
              }}
              // onAdd={onAdd}
              // addBtnLabel={'Add new column'}
              columnInfoForTable={
                <div className="columnInfoForTable m-2 d-flex align-items-center">
                  <DropdownInformation />
                  Only columns of same data type can be added
                </div>
              }
              showColumnInfo={showColumnInfo}
              showDescription={showDescription}
              disabled={isEditColumn || isCreateColumn}
              tableName={tableName}
              targetTable={targetTable}
              actions={actions}
              actionName={secondColumnName}
              onTableClick={false}
            />
          </div>
        </div>
      </ToolTip>
    </div>
  );
}

export default TableDetailsDropdown;
