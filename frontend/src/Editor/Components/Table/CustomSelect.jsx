import React, { useRef, useState, useEffect } from 'react';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import defaultStyles from '@/_ui/Select/styles';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { Checkbox } from '@/_ui/CheckBox/CheckBox';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

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
  textColor,
  isMulti,
  containerWidth,
}) => {
  const containerRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const onDomClick = (e) => {
    let menu = containerRef?.current?.querySelector('.select__menu');
    if (!containerRef?.current?.contains(e.target) || !menu || !menu?.contains(e.target)) {
      setIsFocused(false);
      setInputValue('');
    }
  };
  useEffect(() => {
    document.addEventListener('mousedown', onDomClick);

    return () => {
      document.removeEventListener('mousedown', onDomClick);
    };
  }, []);

  const customStyles = {
    ...defaultStyles(darkMode, '100%'),
    singleValue: (provided) => ({
      ...provided,
      color: textColor,
    }),
    ...(isMulti && {
      multiValue: (provided) => ({
        ...provided,
        display: 'inline-block', // Display selected options inline
        marginRight: '4px', // Add some space between options
      }),
      valueContainer: (provided, _state) => ({
        ...provided,
        marginBottom: '0',
        display: 'flex',
        flexWrap: 'no-wrap',
        overflow: 'hidden',
        flexDirection: 'row',
      }),
    }),
  };
  const customCustomComponents = {
    MenuList: CustomMenuList,
    Option: CustomMultiSelectOption,
    DropdownIndicator,
    ...(isMulti && {
      MultiValueRemove,
      MultiValueContainer: customMultiValueContainer,
    }),
    ...(!isMulti && {
      SingleValue: customMultiValueContainer,
    }),
  };

  const defaultValue = defaultOptionsList.length >= 1 ? defaultOptionsList[defaultOptionsList.length - 1] : null;
  return (
    <OverlayTrigger
      placement="bottom"
      overlay={isMulti && getOverlay(value, containerWidth, isMulti)}
      trigger={isMulti && ['hover', 'focus']}
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
          onInputChange={(val) => {
            setInputValue(val);
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

const CustomMenuList = ({ selectProps, ...props }) => {
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
        />
      </div>
      <MenuList {...props} selectProps={selectProps} />
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

const customMultiValueContainer = (props) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        padding: '2px 6px',
        background: 'var(--slate3)',
        margin: '0 5px',
        borderRadius: '6px',
        color: 'var(--slate12)',
      }}
    >
      {props.children}
    </div>
  );
};

const getOverlay = (value, containerWidth) => {
  return Array.isArray(value) ? (
    <div
      style={{
        height: 'fit-content',
        maxWidth: containerWidth,
        width: containerWidth,
        background: 'var(--base)',
        display: 'inline-flex',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '16px',
        borderRadius: '6px',
        boxShadow: '0px 8px 16px 0px rgba(48, 50, 51, 0.05)',
      }}
    >
      {value?.map((option) => {
        return (
          <span
            style={{ padding: '2px 6px', background: 'var(--slate3)', borderRadius: '6px', color: 'var(--slate12)' }}
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
    <div {...props}>
      {/* Your custom SVG */}
      {props.selectProps.menuIsOpen ? (
        <SolidIcon name="arrowUpTriangle" width="16" height="16" fill={'#6A727C'} />
      ) : (
        <SolidIcon name="arrowDownTriangle" width="16" height="16" fill={'#6A727C'} />
      )}
    </div>
  );
};
