import React, { useRef, useState, useEffect } from 'react';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import defaultStyles from '@/_ui/Select/styles';
import SolidIcon from '@/_ui/Icon/SolidIcons';

const { MenuList, ValueContainer, SingleValue, Placeholder } = components;
export const CustomSelect = ({
  options,
  value,
  onChange,
  fuzzySearch = false,
  placeholder,
  disabled,
  className,
  styles,
  darkMode,
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
  };
  return (
    <div className="w-100">
      <Select
        options={options}
        hasSearch={false}
        fuzzySearch={false}
        placeholder={placeholder}
        isDisabled={disabled}
        className={className}
        components={{
          MenuList: CustomMenuList,
        }}
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
        defaultValue={options[0]}
      />
    </div>
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
