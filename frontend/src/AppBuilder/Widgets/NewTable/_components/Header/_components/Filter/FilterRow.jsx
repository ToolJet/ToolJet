import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import defaultStyles from '@/_ui/Select/styles';
import { FILTER_OPTIONS } from './filterConstants';
import { Search } from 'lucide-react';
import useStore from '@/AppBuilder/_stores/store';
import { FIELD_CLASS, ROW_CLASS, RowConnector, RowCloseButton } from './filterRowParts';

export const FilterRow = memo(
  ({
    id,
    filter,
    index,
    connector,
    onConnectorChange,
    columns,
    darkMode,
    onColumnChange,
    onOperationChange,
    onValueChange,
    onRemove,
  }) => {
    const { t } = useTranslation();
    // "column" for the first row, then how the rows are joined; the panel says which when it knows
    const label = connector ?? (index > 0 ? 'and' : 'column');
    const isDragging = useStore((state) => state.draggingComponentId === id);

    // 36px, 14px, token colours: the same fields as the rest of the panel
    const selectStyles = (width) => {
      return {
        ...defaultStyles(darkMode, width, 36, { fontSize: '14px', border: '1px solid var(--border-default)' }, '6px'),
        placeholder: (base) => ({ ...base, fontSize: '14px', color: 'var(--text-placeholder)' }),
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
      <div className={ROW_CLASS} data-cy={`filter-row-${index}`}>
        <RowConnector label={label} dataCy={`filter-${label}-label`} onChange={onConnectorChange} darkMode={darkMode} />
        <div data-cy={`select-column-dropdown-${index}`}>
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
        <div data-cy={`select-operation-dropdown-${index}`}>
          <Select
            options={FILTER_OPTIONS}
            value={filter.value.condition}
            search={true}
            onChange={(value) => onOperationChange(index, value)}
            components={{ ValueContainer: CustomValueContainer }}
            className={`${darkMode ? 'select-search-dark' : 'select-search'} mb-0`}
            placeholder={t('globals.select', 'Select') + '...'}
            styles={selectStyles('100%')}
            useCustomStyles={true}
            darkMode={darkMode}
            openMenuOnFocus={true}
          />
        </div>
        <div>
          {!['isEmpty', 'isNotEmpty'].includes(filter.value.condition) && (
            <div className={FIELD_CLASS}>
              <Search size={16} className="tw-shrink-0 tw-text-icon-default" />
              <input
                data-cy={`filter-value-input-${index}`}
                type="text"
                value={filter.value.value}
                placeholder="Enter text"
                // the global `input[type="text"]` rule paints any outline that is not "none"; the field border shows the focus
                style={{ outline: 'none' }}
                className="tw-min-w-0 tw-flex-1 tw-border-0 tw-bg-transparent tw-p-0 tw-text-lg tw-text-text-default [font-family:inherit] placeholder:tw-text-text-placeholder"
                onChange={(e) => onValueChange(index, e.target.value)}
              />
            </div>
          )}
        </div>
        <RowCloseButton dataCy={`close-filter-button-${index}`} label="Remove filter" onClick={() => onRemove(index)} />
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
