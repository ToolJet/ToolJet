/* eslint-disable react/jsx-key */
import React from 'react';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import DeleteIcon from '../../Icons/DeleteIcon.svg';
import { ToolTip } from '@/_components/ToolTip';
import Information from '@/_ui/Icon/solidIcons/Information';
import Select, { components } from 'react-select';
import { formatOptionLabel } from '@/TooljetDatabase/constants';
import { getLocalTimeZone } from '@/Editor/QueryManager/QueryEditors/TooljetDatabase/util';
import './styles.scss';
import defaultStyles from '@/_ui/Select/styles';
// eslint-disable-next-line no-unused-vars
export const UniqueConstraintPopOver = ({
  disabled,
  children,
  onDelete,
  darkMode,
  columns,
  setColumns,
  index,
  isEditMode,
  tzDictionary,
  tzOptions,
}) => {
  if (disabled) return children;
  const toolTipPlacementStyle = {
    width: '126px',
  };
  const { Option } = components;
  if (columns[index]?.data_type === 'timestamp with time zone' && !columns[index]?.configurations?.timezone) {
    columns[index].configurations.timezone = getLocalTimeZone();
  }

  const CustomSelectOption = (props) => (
    <Option {...props}>
      <div className="selected-dropdownStyle d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center justify-content-start">
          <div>{props.data.icon}</div>
          <span className="dataType-dropdown-label">{props.data.label}</span>
          <span className="dataType-dropdown-value">{props.data.name}</span>
        </div>
      </div>
    </Option>
  );

  const showUniqueConstraintInfo = () => {
    const numberOfPrimaryKeys = Object.values(columns).reduce((count, column) => {
      if (column.constraints_type?.is_primary_key) {
        return count + 1;
      }
      return count;
    }, 0);
    return numberOfPrimaryKeys >= 2;
  };

  const popover = (
    <Popover className={`create-table-list-items ${darkMode && ' dark-theme'}`}>
      <Popover.Body className={` ${darkMode && 'theme-dark'}`}>
        <div className="unique-constraint-parent">
          {showUniqueConstraintInfo() && (
            <div className="unique-constraint-info">
              <Information width={16} viewBox="0 0 24 24" fill="var(--indigo9)" />
              <span className="tj-text-xxsm">
                Unique constraint will be added to combinations of values of a composite primary key
              </span>
            </div>
          )}
          <div className="column-popover row cursor-pointer p-1">
            {columns[index]?.data_type === 'timestamp with time zone' && (
              <div
                className="column-datatype-selector mb-3 data-type-dropdown-section"
                data-cy="timezone-type-dropdown-section"
              >
                <div className="form-label" data-cy="data-type-input-field-label">
                  Display time
                </div>
                <Select
                  placeholder="Select Timezone"
                  value={tzDictionary[columns[index].configurations.timezone]}
                  styles={{
                    control: (provided, state) => ({
                      ...provided,
                      backgroundColor: darkMode ? '#2b3547' : state.menuIsOpen ? '#F1F3F5' : '#fff',
                    }),
                    singleValue: (provided) => ({
                      ...provided,
                      color: darkMode ? '#fff' : '#232e3c',
                    }),
                    input: (provided) => ({
                      ...provided,
                      color: darkMode ? '#fff' : '#232e3c',
                    }),
                    menu: (provided) => ({
                      ...provided,
                      backgroundColor: darkMode ? 'rgb(31,40,55)' : 'white',
                    }),
                    option: (provided) => ({
                      ...provided,
                      backgroundColor: darkMode ? '#2b3547' : '#fff',
                      color: darkMode ? '#fff' : '#232e3c',
                      cursor: 'pointer',
                      ':hover': {
                        backgroundColor: darkMode ? '#323C4B' : '#d8dce9',
                      },
                    }),
                  }}
                  formatOptionLabel={formatOptionLabel}
                  options={tzOptions}
                  onChange={(option) => {
                    const prevColumns = { ...columns };
                    const columnConfigurations = prevColumns[index]?.configurations ?? {};
                    columnConfigurations.timezone = option.value;
                    prevColumns[index].configurations = { ...columnConfigurations };
                    setColumns(prevColumns);
                  }}
                  components={{ Option: CustomSelectOption, IndicatorSeparator: () => null }}
                />
              </div>
            )}
            <ToolTip
              message={
                columns[index]?.constraints_type?.is_primary_key === true
                  ? 'Primary key values must be unique'
                  : columns[index]?.data_type === 'boolean'
                  ? 'Boolean data type cannot be unique'
                  : columns[index]?.data_type === 'timestamp with time zone'
                  ? 'Unique constraint cannot be added to this column type'
                  : columns[index]?.data_type === 'jsonb'
                  ? 'JSON cannot cannot have unique constraint'
                  : null
              }
              placement="top"
              tooltipClassName="tootip-table"
              style={toolTipPlacementStyle}
              show={
                columns[index]?.constraints_type?.is_primary_key === true ||
                ['boolean', 'jsonb', 'timestamp with time zone'].includes(columns[index]?.data_type)
              }
            >
              <div className="d-flex not-null-toggle">
                <label className={`form-switch`}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    checked={
                      isEditMode &&
                      columns[index]?.constraints_type?.is_unique === false &&
                      columns[index]?.constraints_type?.is_primary_key
                        ? true
                        : columns[index]?.data_type === 'boolean'
                        ? false
                        : columns[index]?.data_type === 'serial'
                        ? true
                        : columns[index]?.constraints_type?.is_unique
                        ? true
                        : false
                    }
                    onChange={(e) => {
                      const prevColumns = { ...columns };
                      const columnConstraints = prevColumns[index]?.constraints_type ?? {};
                      columnConstraints.is_unique = e.target.checked;
                      prevColumns[index].constraints_type = { ...columnConstraints };
                      setColumns(prevColumns);
                    }}
                    disabled={
                      columns[index]?.constraints_type?.is_primary_key === true ||
                      ['boolean', 'jsonb', 'timestamp with time zone'].includes(columns[index]?.data_type)
                    }
                  />
                </label>

                <div>
                  <div className="tj-text-xsm unique-tag">{'UNIQUE'}</div>
                  <div className="tj-text-xsm">This constraint restricts entry of duplicate values in this column.</div>
                </div>
              </div>
            </ToolTip>
          </div>
        </div>

        <hr />

        <div className="column-popover delete-column-table-creation cursor-pointer p-1 mt-2" onClick={onDelete}>
          <div data-cy="delete-column-option-icon">
            <DeleteIcon width="14" height="15" />
          </div>
          <div className="text-truncate text-danger delete-column-text" data-cy="delete-column-option">
            Delete column
          </div>
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger rootClose={true} trigger="click" placement="bottom" overlay={popover}>
      {children}
    </OverlayTrigger>
  );
};
