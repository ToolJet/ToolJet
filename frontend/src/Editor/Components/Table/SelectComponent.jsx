import React, { useRef, useState, useEffect } from 'react';
import Select from '@/_ui/Select';
import { components } from 'react-select';
import defaultStyles from '@/_ui/Select/styles';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import classNames from 'classnames';
import { Spinner } from 'react-bootstrap';

const { MenuList, ValueContainer, SingleValue, Placeholder } = components;
export const SelectComponent = ({
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
  const customStyles = defaultStyles(darkMode, '100%');
  return (
    <div className="w-100">
      <Select
        options={options}
        hasSearch={false}
        fuzzySearch={false}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        components={{
          MenuList: CustomMenuList,
          ValueContainer: CustomValueContainer,
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
      />
    </div>
  );
};

export const CustomMenuList = ({ selectProps, ...props }) => {
  const { onInputChange, inputValue, onMenuInputFocus, isDarkMode, optionLoadingState } = selectProps;
  if (optionLoadingState) {
    return (
      <div className={classNames('table-select-custom-menu-list', { 'theme-dark dark-theme': isDarkMode })}>
        <div style={{ minHeight: '224px' }} className={'d-flex align-items-center justify-content-center'}>
          <Spinner style={{ width: '36px', height: '36px', color: 'var(--indigo9)' }} />,
        </div>
      </div>
    );
  }
  return (
    <div
      className={classNames('table-select-custom-menu-list', { 'theme-dark dark-theme': isDarkMode })}
      onClick={(e) => e.stopPropagation()}
    >
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
          onChange={(e) => {
            onInputChange(e.currentTarget.value, {
              action: 'input-change',
            });
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.target.focus();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.target.focus();
          }}
          onFocus={onMenuInputFocus}
          placeholder="Search"
          className="table-select-column-type-search-box"
        />
      </div>
      <MenuList {...props} selectProps={selectProps} />
    </div>
  );
};

const CustomValueContainer = ({ children, selectProps, ...props }) => {
  const commonProps = {
    cx: props.cx,
    clearValue: props.clearValue,
    getStyles: props.getStyles,
    getValue: props.getValue,
    hasValue: props.hasValue,
    isMulti: props.isMulti,
    isRtl: props.isRtl,
    options: props.options,
    selectOption: props.selectOption,
    setValue: props.setValue,
    selectProps,
    theme: props.theme,
    getClassNames: props.getClassNames,
  };

  return (
    <ValueContainer {...props} selectProps={selectProps}>
      {React.Children.map(children, (child) => {
        return child ? (
          child
        ) : props.hasValue ? (
          <SingleValue {...commonProps} isFocused={selectProps.isFocused} isDisabled={selectProps.isDisabled}>
            {selectProps?.getOptionLabel(props?.getValue()[0])}
          </SingleValue>
        ) : (
          <Placeholder {...commonProps} key="placeholder" isDisabled={selectProps.isDisabled} data={props.getValue()}>
            {selectProps.placeholder}
          </Placeholder>
        );
      })}
    </ValueContainer>
  );
};
