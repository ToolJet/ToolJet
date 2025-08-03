import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import defaultStyles from '@/_ui/Select/styles';
import { FILTER_OPTIONS } from './filterConstants';
import useStore from '@/AppBuilder/_stores/store';

export const FilterRow = memo(
  ({ id, filter, index, columns, darkMode, onColumnChange, onOperationChange, onValueChange, onRemove }) => {
    const { t } = useTranslation();
    const isDragging = useStore((state) => state.draggingComponentId === id);

    const selectStyles = (width) => {
      return {
        ...defaultStyles(darkMode, width),
        menuPortal: (provided) => ({ ...provided, zIndex: 999 }),
        menuList: (base) => ({
          ...base,
        }),
        menu: (base) => ({
          ...base,
          display: isDragging ? 'none' : 'block',
        }),
      };
    };

    return (
      <div className="row mb-2">
        <div className="col p-2" style={{ maxWidth: '70px' }}>
          <small data-cy={`label-filter-column`}>{index > 0 ? 'and' : 'column'}</small>
        </div>
        <div data-cy={`select-coloumn-dropdown-${index}`} className="col">
          <Select
            options={columns}
            value={filter.id}
            search={true}
            onChange={(value) => onColumnChange(index, value)}
            components={{ ValueContainer: CustomValueContainer }}
            placeholder={t('globals.select', 'Select') + '...'}
            className={`${darkMode ? 'select-search-dark' : 'select-search'} mb-0`}
            styles={selectStyles('100%')}
            useCustomStyles={true}
            darkMode={darkMode}
            openMenuOnFocus={true}
          />
        </div>
        <div data-cy={`select-operation-dropdown-${index}`} className="col" style={{ maxWidth: '180px' }}>
          <Select
            options={FILTER_OPTIONS}
            value={filter.value.condition}
            search={true}
            onChange={(value) => onOperationChange(index, value)}
            components={{ ValueContainer: CustomValueContainer }}
            className={`${darkMode ? 'select-search-dark' : 'select-search'}`}
            placeholder={t('globals.select', 'Select') + '...'}
            styles={selectStyles('100%')}
            useCustomStyles={true}
            darkMode={darkMode}
            openMenuOnFocus={true}
          />
        </div>
        <div className="col">
          {!['isEmpty', 'isNotEmpty'].includes(filter.value.condition) && (
            <input
              data-cy={`data-filtervalue-input-${index}`}
              type="text"
              value={filter.value.value}
              placeholder="value"
              className="form-control"
              onChange={(e) => onValueChange(index, e.target.value)}
            />
          )}
        </div>
        <div className="col-auto">
          <button
            data-cy={`button-close-filter-${index}`}
            onClick={() => onRemove(index)}
            className={`btn ${darkMode ? 'btn-dark' : 'btn-light'} btn-sm p-2 text-danger font-weight-bold`}
          >
            x
          </button>
        </div>
      </div>
    );
  }
);

const CustomValueContainer = (props) => {
  const handleClick = (e) => {
    if (props.selectProps?.selectRef?.current) {
      props.selectProps.selectRef.current.focus();
    }
    if (props.innerProps?.onMouseDown) {
      props.innerProps.onMouseDown(e);
    }
  };
  return <components.ValueContainer {...props} innerProps={{ ...props.innerProps, onMouseDown: handleClick }} />;
};
