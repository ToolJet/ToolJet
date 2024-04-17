import React, { useState } from 'react';
import { dataTypes } from '../constants';
import DropDownSelect from '../../Editor/QueryManager/QueryEditors/TooljetDatabase/DropDownSelect';
import Information from '@/_ui/Icon/solidIcons/Information';

function TableDetailsDropdown({
  firstColumnName,
  secondColumnName,
  firstColumnPlaceholder,
  secondColumnPlaceholder,
  tableList = [],
  tableColumns = [],
  source = false,
  handleSelectColumn = () => {},
}) {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  const [column, setColumn] = useState({});
  const [table, setTable] = useState({});
  return (
    <div className="mt-3">
      <div className="d-flex align-items-center justify-content-between">
        <span className="keyRelation-column-title">{firstColumnName}</span>
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
            value={source ? tableList[0] : table}
            foreignKeyAccess={true}
            disabled={source ? true : false}
            onChange={(value) => {
              setTable(value);
            }}
          />
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between mt-2">
        <span className="keyRelation-column-title">{secondColumnName}</span>
        <div style={{ width: '80%' }}>
          <DropDownSelect
            buttonClasses="border border-end-1 foreignKeyAcces-container"
            showPlaceHolder={true}
            options={tableColumns}
            darkMode={darkMode}
            emptyError={
              <div className="dd-select-alert-error m-2 d-flex align-items-center">
                <Information />
                No table selected
              </div>
            }
            value={column}
            foreignKeyAccess={true}
            onChange={(value) => {
              if (source) {
                setColumn(value);
              } else {
                handleSelectColumn();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default TableDetailsDropdown;
