import React, { useRef, useState, useEffect } from 'react';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import defaultStyles from '@/_ui/Select/styles';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Checkbox } from '@/_ui/CheckBox/CheckBox';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import _ from 'lodash';
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
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null); // Ref for the input search box

  useEffect(() => {
    const handleDocumentClick = (event) => {
      if (!containerRef.current?.contains(event.target)) {
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
    ...defaultStyles(darkMode, '100%'),
    ...(isMulti && {
      multiValue: (provided) => ({
        ...provided,
        display: 'inline-block', // Display selected options inline
        marginRight: '4px', // Add some space between options
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
      backgroundColor: 'var(--surfaces-surface-01) ',
      color: 'var(--text-primary)',
      cursor: 'pointer',
      overflow: 'auto',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      padding: '2px 6px',
      background: 'var(--surfaces-surface-03)',
      margin: '0 5px',
      borderRadius: '6px',
      color: textColor || 'var(--text-primary)',
      fontSize: '12px',
    }),
    singleValue: (provided) => ({
      ...provided,
      padding: '2px 6px',
      background: 'var(--surfaces-surface-03)',
      margin: '0 5px',
      borderRadius: '6px',
      color: textColor || 'var(--text-primary)',
      fontSize: '12px',
    }),
  };
  const customCustomComponents = {
    MenuList: (props) => <CustomMenuList {...props} optionsLoadingState={optionsLoadingState} inputRef={inputRef} />,
    Option: CustomMultiSelectOption,
    DropdownIndicator,
    ...(isMulti && {
      MultiValueRemove,
      MultiValueContainer: CustomMultiValueContainer,
    }),
  };

  const defaultValue = defaultOptionsList.length >= 1 ? defaultOptionsList[defaultOptionsList.length - 1] : null;
  return (
    <OverlayTrigger
      placement="bottom"
      overlay={isMulti && getOverlay(value, containerWidth, isMulti)}
      trigger={isMulti && ['hover']}
      rootClose={true}
    >
      <div className="w-100 h-100 d-flex align-items-center">
        <Select
          options={options}
          hasSearch={false}
          fuzzySearch={fuzzySearch}
          isDisabled={disabled}
          className={className}
          components={customCustomComponents}
          value={value}
          onMenuInputFocus={() => setIsFocused(true)}
          onChange={(value) => {
            onChange(value);
            setIsFocused(false);
          }}
          {...{
            menuIsOpen: isFocused || undefined,
            isFocused: isFocused || undefined,
          }}
          useCustomStyles={true}
          styles={customStyles}
          defaultValue={defaultValue}
          placeholder={placeholder}
          isMulti={isMulti}
          hideSelectedOptions={false}
          isClearable={false}
          clearIndicator={false}
        />
      </div>
    </OverlayTrigger>
  );
};

const CustomMenuList = ({ optionsLoadingState, children, selectProps, inputRef, ...props }) => {
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
        {optionsLoadingState && _.isEmpty(props.options) ? (
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
        gap: '4px',
      }}
    >
      {props.children}
    </div>
  );
};

const getOverlay = (value, containerWidth) => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  return Array.isArray(value) ? (
    <div
      style={{
        maxWidth: containerWidth,
        width: containerWidth,
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
            key={option.label}
          >
            {option.label}
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
