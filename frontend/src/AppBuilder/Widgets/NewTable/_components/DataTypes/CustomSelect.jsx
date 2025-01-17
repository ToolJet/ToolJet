import React, { useRef, useState, useEffect, useMemo } from 'react';
import Select, { components } from 'react-select';
import { OverlayTrigger } from 'react-bootstrap';
import { isArray, isString } from 'lodash';
import { Checkbox } from '@/_ui/CheckBox/CheckBox';
import SolidIcon from '@/_ui/Icon/SolidIcons';
const { MenuList } = components;

export const CustomSelect = ({
  options,
  value,
  onChange,
  fuzzySearch = false,
  placeholder,
  disabled,
  className,
  darkMode,
  defaultOptionsList,
  textColor = '',
  isMulti,
  containerWidth,
  optionsLoadingState = false,
  horizontalAlignment = 'left',
  isEditable,
}) => {
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (isMulti && !containerRef.current?.contains(event.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    // Focus the input search box when the menu list is open and the component is focused
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  const customStyles = {
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
    multiValueLabel: (provided) => ({
      ...provided,
      padding: '2px 6px',
      background: 'var(--surfaces-surface-03)',
      borderRadius: '6px',
      color: textColor || 'var(--text-primary)',
      fontSize: '12px',
    }),
    singleValue: (provided) => ({
      ...provided,
      padding: '2px 6px',
      background: 'var(--surfaces-surface-03)',
      borderRadius: '6px',
      color: textColor || 'var(--text-primary)',
      fontSize: '12px',
    }),
  };

  const customComponents = {
    MenuList: (props) => <CustomMenuList {...props} optionsLoadingState={optionsLoadingState} inputRef={inputRef} />,
    Option: CustomMultiSelectOption,
    DropdownIndicator: isEditable ? DropdownIndicator : null,
    ...(isMulti && {
      MultiValueRemove,
      MultiValueContainer: CustomMultiValueContainer,
    }),
  };

  const defaultValue = useMemo(() => {
    if (defaultOptionsList.length >= 1) {
      return !isMulti ? defaultOptionsList[defaultOptionsList.length - 1] : defaultOptionsList;
    } else {
      return isMulti ? [] : {};
    }
  }, [isMulti, defaultOptionsList]);

  const _value = useMemo(() => {
    // Return null to show default value
    if (!value) {
      return null;
    }
    if (isMulti && value?.length) {
      if (isArray(value)) {
        return options?.filter((option) =>
          value?.find((val) => {
            if (val.hasOwnProperty('value')) {
              return option.value === val.value;
            } else return option.value === val;
          })
        );
      } else {
        return []; // Return empty array to not show default value in case of wrong value to be set
      }
    } else {
      // Condition for single select
      return options?.find((option) => option.value === value) || [];
    }
  }, [options, value, isMulti]);

  const selectContainerRef = useRef(null);
  const containerHeight = selectContainerRef.current?.clientHeight;
  const valueContainerHeight = selectContainerRef.current?.querySelector(
    '.react-select__value-container'
  )?.clientHeight;

  return (
    <OverlayTrigger
      placement="bottom"
      overlay={
        isMulti && (_value?.length || defaultValue?.length) && !isFocused ? (
          getOverlay(_value ? _value : defaultValue, containerWidth, darkMode)
        ) : (
          <div></div>
        )
      }
      trigger={isMulti && !isFocused && valueContainerHeight > containerHeight && ['hover', 'focus']}
      rootClose={true}
    >
      <div className="w-100 h-100 d-flex align-items-center" ref={selectContainerRef}>
        <Select
          options={options}
          hasSearch={false}
          fuzzySearch={fuzzySearch}
          isDisabled={disabled}
          className={className}
          components={customComponents}
          value={_value}
          onMenuInputFocus={() => setIsFocused(true)}
          onChange={(value) => {
            setIsFocused(false);
            if (!isMulti && value === _value?.value) {
              onChange('');
            } else {
              onChange(value);
            }
          }}
          styles={customStyles}
          defaultValue={defaultValue}
          placeholder={placeholder}
          isMulti={isMulti}
          hideSelectedOptions={false}
          isClearable={false}
          clearIndicator={false}
          darkMode={darkMode}
          {...{
            menuIsOpen: isFocused || undefined,
            isFocused: isFocused || undefined,
          }}
        />
      </div>
    </OverlayTrigger>
  );
};

export const CustomMenuList = ({ optionsLoadingState, children, selectProps, inputRef, ...props }) => {
  const { onInputChange, inputValue, onMenuInputFocus } = selectProps;

  return (
    <div className="table-select-custom-menu-list" onClick={(e) => e.stopPropagation()}>
      <div className="table-select-column-type-search-box-wrapper ">
        {!inputValue && (
          <span className="">
            <SolidIcon name="search" width="14" />
          </span>
        )}
        <input
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
          type="text"
          value={inputValue}
          onChange={(e) =>
            onInputChange(e.currentTarget.value, {
              action: 'input-change',
            })
          }
          onMouseDown={(e) => {
            e.stopPropagation();
            e.target.focus();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.target.focus();
          }}
          onFocus={onMenuInputFocus}
          placeholder="Search..."
          className="table-select-column-type-search-box"
          ref={inputRef} // Assign the ref to the input search box
        />
      </div>
      <MenuList {...props} selectProps={selectProps}>
        {optionsLoadingState ? (
          <div class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="sr-only"></span>
            </div>
          </div>
        ) : (
          children
        )}
      </MenuList>
    </div>
  );
};

const CustomMultiSelectOption = ({ innerRef, innerProps, children, isSelected, ...props }) => {
  return (
    <div ref={innerRef} {...innerProps} className="option-wrapper d-flex">
      {props.isMulti ? (
        <Checkbox label="" isChecked={isSelected} onChange={(e) => e.stopPropagation()} key="" value={children} />
      ) : (
        <div style={{ visibility: isSelected ? 'visible' : 'hidden' }}>
          <Checkbox label="" isChecked={isSelected} onChange={(e) => e.stopPropagation()} key="" value={children} />
        </div>
      )}
      {children}
    </div>
  );
};

const MultiValueRemove = (props) => {
  const { innerProps } = props;
  return <div {...innerProps} />;
};
const CustomMultiValueContainer = (props) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      {props.children}
    </div>
  );
};

const getOverlay = (value, containerWidth, darkMode) => {
  const getLabel = (option) => {
    if (option?.hasOwnProperty('label')) {
      return option.label;
    } else if (isString(option)) {
      return option;
    } else return '';
  };

  return Array.isArray(value) ? (
    <div
      style={{
        maxWidth: '266px',
      }}
      className={`overlay-cell-table overlay-multiselect-table ${darkMode && 'dark-theme'}`}
    >
      {value?.map((option) => {
        return (
          <span
            style={{
              padding: '2px 6px',
              background: 'var(--surfaces-surface-03)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              fontSize: '12px',
            }}
            key={getLabel(option)}
          >
            {getLabel(option)}
          </span>
        );
      })}
    </div>
  ) : (
    <div></div>
  );
};

const DropdownIndicator = (props) => {
  return (
    <div {...props} className="cell-icon-display">
      {/* Your custom SVG */}
      {props.selectProps.menuIsOpen ? (
        <SolidIcon name="arrowUpTriangle" width="16" height="16" fill={'#6A727C'} />
      ) : (
        <SolidIcon name="arrowDownTriangle" width="16" height="16" fill={'#6A727C'} />
      )}
    </div>
  );
};
