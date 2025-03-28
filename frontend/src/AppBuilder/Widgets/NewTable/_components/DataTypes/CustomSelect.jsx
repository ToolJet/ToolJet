import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import defaultStyles from '@/_ui/Select/styles';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Checkbox } from '@/_ui/CheckBox/CheckBox';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import { isArray } from 'lodash';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const { MenuList } = components;

const CustomMenuList = ({ optionsLoadingState, children, selectProps, inputRef, ...props }) => {
  const { onInputChange, inputValue, onMenuInputFocus } = selectProps;

  return (
    <div className="table-select-custom-menu-list" onClick={(e) => e.stopPropagation()}>
      <div className="table-select-column-type-search-box-wrapper">
        {!inputValue && (
          <span>
            <SolidIcon name="search" width="14" />
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.currentTarget.value, { action: 'input-change' })}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.target.focus();
          }}
          onFocus={onMenuInputFocus}
          placeholder="Search..."
          className="table-select-column-type-search-box"
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
        />
      </div>
      <MenuList {...props} selectProps={selectProps}>
        {optionsLoadingState ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only" />
            </div>
          </div>
        ) : (
          children
        )}
      </MenuList>
    </div>
  );
};

const CustomOption = ({ innerRef, innerProps, children, isSelected, ...props }) => (
  <div ref={innerRef} {...innerProps} className="option-wrapper d-flex">
    {props.selectProps.isMulti ? (
      <Checkbox label="" isChecked={isSelected} onChange={(e) => e.stopPropagation()} key="" value={children} />
    ) : (
      <div style={{ visibility: isSelected ? 'visible' : 'hidden' }}>
        <Checkbox label="" isChecked={isSelected} onChange={(e) => e.stopPropagation()} key="" value={children} />
      </div>
    )}
    {children}
  </div>
);

const MultiValueRemove = ({ innerProps }) => <div {...innerProps} />;

const CustomMultiValueContainer = ({ children }) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
    }}
  >
    {children}
  </div>
);

const DropdownIndicator = ({ selectProps }) => (
  <div className="cell-icon-display">
    <SolidIcon
      name={selectProps.menuIsOpen ? 'arrowUpTriangle' : 'arrowDownTriangle'}
      width="16"
      height="16"
      fill="#6A727C"
    />
  </div>
);

const getOverlay = (value, containerWidth, darkMode) => {
  if (!isArray(value)) return <div />;

  return (
    <div
      style={{ maxWidth: '266px' }}
      className={`overlay-cell-table overlay-multiselect-table ${darkMode ? 'dark-theme' : ''}`}
    >
      {value.map((option) => (
        <span
          key={option.label || option}
          style={{
            padding: '2px 6px',
            background: 'var(--surfaces-surface-03)',
            borderRadius: '6px',
            color: 'var(--text-primary)',
            fontSize: '12px',
          }}
        >
          {option.label || option}
        </span>
      ))}
    </div>
  );
};

export const CustomSelectColumn = ({
  options,
  value,
  onChange,
  fuzzySearch = false,
  placeholder,
  disabled,
  className,
  darkMode,
  defaultOptionsList = [],
  textColor = '',
  isMulti,
  containerWidth,
  optionsLoadingState = false,
  horizontalAlignment = 'left',
  isEditable,
  column,
  isNewRow,
}) => {
  const validateWidget = useStore((state) => state.validateWidget, shallow);

  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const validationData = validateWidget({
    validationObject: {
      customRule: { value: column.customRule },
    },
    widgetValue: value,
    customResolveObjects: { value },
  });
  const { isValid, validationError } = validationData;

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if ((isMulti || isNewRow) && !containerRef.current?.contains(event.target)) setIsFocused(false);
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, [isMulti, isNewRow]);

  const customComponents = {
    MenuList: (props) => <CustomMenuList {...props} optionsLoadingState={optionsLoadingState} inputRef={inputRef} />,
    Option: CustomOption,
    DropdownIndicator: isEditable ? DropdownIndicator : null,
    ...(isMulti && {
      MultiValueRemove,
      MultiValueContainer: CustomMultiValueContainer,
    }),
  };

  const customStyles = useMemo(
    () => ({
      ...defaultStyles(darkMode, '100%'),
      ...(isMulti && {
        multiValue: (provided) => ({
          ...provided,
          display: 'inline-block',
          marginRight: '4px',
        }),
        multiValueLabel: (provided) => ({
          ...provided,
          padding: '2px 6px',
          background: 'var(--surfaces-surface-03)',
          borderRadius: '6px',
          color: textColor || 'var(--text-primary)',
          fontSize: '12px',
        }),
      }),
      valueContainer: (provided) => ({
        ...provided,
        ...(isMulti && {
          marginBottom: '0',
          display: 'flex',
          flexWrap: 'no-wrap',
          overflow: 'hidden',
          flexDirection: 'row',
        }),
        justifyContent: horizontalAlignment,
      }),
      menuList: (base) => ({
        ...base,
        backgroundColor: 'var(--surfaces-surface-01)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        overflow: 'auto',
      }),
      singleValue: (provided) => ({
        ...provided,
        padding: '2px 6px',
        background: 'var(--surfaces-surface-03)',
        borderRadius: '6px',
        color: textColor || 'var(--text-primary)',
        fontSize: '12px',
      }),
    }),
    [darkMode, isMulti, horizontalAlignment, textColor]
  );

  const defaultValue = useMemo(
    () =>
      defaultOptionsList.length >= 1
        ? isMulti
          ? defaultOptionsList
          : defaultOptionsList.slice(-1)[0]
        : isMulti
        ? []
        : {},
    [isMulti, defaultOptionsList]
  );

  const selectedValue = useMemo(() => {
    if (!value) return null;
    if (isMulti && value?.length) {
      return isArray(value)
        ? options?.filter((option) =>
            value?.find((val) => (val.hasOwnProperty('value') ? option.value === val.value : option.value === val))
          )
        : [];
    }
    return options?.find((option) => option.value === value) || [];
  }, [options, value, isMulti]);

  const handleChange = useCallback(
    (newValue) => {
      setIsFocused(false);
      if (!isMulti && newValue === selectedValue?.value) {
        onChange('');
      } else {
        onChange(newValue);
      }
    },
    [isMulti, selectedValue, onChange]
  );

  const isOverflowing = useCallback(() => {
    if (!containerRef.current) return false;
    const valueContainer = containerRef.current.querySelector('.react-select__value-container');
    return valueContainer?.clientHeight > containerRef.current?.clientHeight;
  }, []);

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={
        isMulti && (selectedValue?.length || defaultValue?.length) && !isFocused ? (
          getOverlay(selectedValue || defaultValue, containerWidth, darkMode)
        ) : (
          <div />
        )
      }
      trigger={isMulti && !isFocused && isOverflowing() && ['hover', 'focus']}
      rootClose={true}
    >
      <>
        <div
          className="w-100 h-100 d-flex align-items-center"
          ref={containerRef}
          onClick={() => {
            if (isNewRow && isEditable) {
              setIsFocused((prev) => !prev);
            }
          }}
        >
          <Select
            options={options}
            hasSearch={false}
            fuzzySearch={fuzzySearch}
            isDisabled={disabled}
            className={className}
            components={customComponents}
            value={selectedValue}
            onMenuInputFocus={() => {
              setIsFocused(true);
            }}
            onChange={handleChange}
            useCustomStyles={true}
            styles={customStyles}
            defaultValue={defaultValue}
            placeholder={placeholder}
            isMulti={isMulti}
            hideSelectedOptions={false}
            isClearable={false}
            clearIndicator={false}
            darkMode={darkMode}
            menuIsOpen={isFocused || undefined}
            isFocused={isFocused || undefined}
          />
        </div>
        <div
          onClick={() => {
            if (!isValid) {
              setIsFocused(true); // Open the dropdown
            }
          }}
          className={` ${isValid ? 'd-none' : 'invalid-feedback d-block'}`}
        >
          {validationError}
        </div>
      </>
    </OverlayTrigger>
  );
};
