import React, { useState, useEffect, useMemo, useRef } from 'react';
import Select, { components } from 'react-select';
import ClearIndicatorIcon from '@/_ui/Icon/bulkIcons/ClearIndicator';
import TriangleDownArrow from '@/_ui/Icon/bulkIcons/TriangleDownArrow';
import TriangleUpArrow from '@/_ui/Icon/bulkIcons/TriangleUpArrow';
import { useEditorStore } from '@/_stores/editorStore';
import Loader from '@/ToolJetUI/Loader/Loader';
import { has, isObject, pick } from 'lodash';
const tinycolor = require('tinycolor2');
import './dropdownV2.scss';
import CustomValueContainer from './CustomValueContainer';
import CustomMenuList from './CustomMenuList';
import CustomOption from './CustomOption';
import Label from '@/_ui/Label';
import cx from 'classnames';
import { getInputBackgroundColor, getInputBorderColor, getInputFocusedColor } from './utils';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const { DropdownIndicator, ClearIndicator } = components;
const INDICATOR_CONTAINER_WIDTH = 60;
const ICON_WIDTH = 18; // includes flex gap 2px

export const CustomDropdownIndicator = (props) => {
  const {
    selectProps: { menuIsOpen },
  } = props;
  return (
    <DropdownIndicator {...props}>
      {menuIsOpen ? (
        <TriangleUpArrow width={'18'} className="cursor-pointer" fill={'var(--borders-strong)'} />
      ) : (
        <TriangleDownArrow width={'18'} className="cursor-pointer" fill={'var(--borders-strong)'} />
      )}
    </DropdownIndicator>
  );
};

export const CustomClearIndicator = (props) => {
  return (
    <ClearIndicator {...props}>
      <ClearIndicatorIcon width={'18'} fill={'var(--borders-strong)'} className="cursor-pointer" />
    </ClearIndicator>
  );
};

export const DropdownV2 = ({
  height,
  validate,
  properties,
  styles,
  setExposedVariable,
  setExposedVariables,
  fireEvent,
  darkMode,
  onComponentClick,
  id,
  componentName,
  validation,
  dataCy,
}) => {
  const {
    label,
    advanced,
    schema,
    placeholder,
    loadingState: dropdownLoadingState,
    disabledState,
    optionsLoadingState,
  } = properties;
  const {
    selectedTextColor,
    fieldBorderRadius,
    justifyContent,
    boxShadow,
    labelColor,
    alignment,
    direction,
    fieldBorderColor,
    fieldBackgroundColor,
    labelWidth,
    icon,
    iconVisibility,
    errTextColor,
    auto: labelAutoWidth,
    iconColor,
    accentColor,
    padding,
  } = styles;
  const isInitialRender = useRef(true);
  const [currentValue, setCurrentValue] = useState(() => findDefaultItem(schema));
  const isMandatory = validation?.mandatory ?? false;
  const options = properties?.options;
  const [validationStatus, setValidationStatus] = useState(validate(currentValue));
  const { isValid, validationError } = validationStatus;
  const ref = React.useRef(null);
  const dropdownRef = React.useRef(null);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isDropdownLoading, setIsDropdownLoading] = useState(dropdownLoadingState);
  const [isDropdownDisabled, setIsDropdownDisabled] = useState(disabledState);
  const [searchInputValue, setSearchInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const _height = padding === 'default' ? `${height}px` : `${height + 4}px`;
  const labelRef = useRef();
  function findDefaultItem(schema) {
    let _schema = schema;
    if (!Array.isArray(schema)) {
      _schema = [];
    }
    const foundItem = _schema?.find((item) => item?.default === true);
    return !hasVisibleFalse(foundItem?.value) ? foundItem?.value : undefined;
  }
  const selectOptions = useMemo(() => {
    let _options = advanced ? schema : options;
    if (Array.isArray(_options)) {
      let _selectOptions = _options
        .filter((data) => data?.visible ?? true)
        .map((data) => ({
          ...data,
          label: data?.label,
          value: data?.value,
          isDisabled: data?.disable ?? false,
        }));

      return _selectOptions;
    } else {
      return [];
    }
  }, [advanced, schema, options]);

  function selectOption(value) {
    const val = selectOptions.filter((option) => !option.isDisabled)?.find((option) => option.value === value);
    if (val) {
      setInputValue(value);
      fireEvent('onSelect');
    }
  }

  function hasVisibleFalse(value) {
    for (let i = 0; i < schema?.length; i++) {
      if (schema[i].value === value && schema[i].visible === false) {
        return true;
      }
    }
    return false;
  }

  const onSearchTextChange = (searchText, actionProps) => {
    if (actionProps.action === 'input-change') {
      setSearchInputValue(searchText);
      setExposedVariable('searchText', searchText);
      fireEvent('onSearchTextChanged');
    }
  };

  const handleOutsideClick = (e) => {
    let menu = ref.current.querySelector('.select__menu');
    if (!ref.current.contains(e.target) || !menu || !menu.contains(e.target)) {
      setSearchInputValue('');
    }
    if (dropdownRef.current && !dropdownRef.current?.contains(e.target) && !menu && !menu?.contains(e.target)) {
      if (isDropdownOpen) {
        fireEvent('onBlur');
      }
      setIsDropdownOpen(false);
    }
  };

  const handleInsideClick = () => {
    if (!isDropdownDisabled) {
      fireEvent('onFocus');
      setIsDropdownOpen((prev) => !prev);
    }
  };

  const setInputValue = (value) => {
    setCurrentValue(value);
    const _selectedOption = selectOptions.find((option) => option.value === value);
    setExposedVariables({
      value,
      selectedOption: pick(_selectedOption, ['label', 'value']),
    });
    const validationStatus = validate(value);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  };

  useEffect(() => {
    setInputValue(findDefaultItem(advanced ? schema : options));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, JSON.stringify(schema), JSON.stringify(options)]);

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isDropdownLoading !== dropdownLoadingState) setIsDropdownLoading(dropdownLoadingState);
    if (isDropdownDisabled !== disabledState) setIsDropdownDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, dropdownLoadingState, disabledState]);

  // Exposed variables

  useEffect(() => {
    if (isInitialRender.current) return;
    const _options = selectOptions?.map(({ label, value }) => ({ label, value }));
    setExposedVariable('options', _options);

    setExposedVariable('selectOption', async function (value) {
      let _value = value;
      if (isObject(value) && has(value, 'value')) _value = value?.value;
      selectOption(_value);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue, JSON.stringify(selectOptions)]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('label', label);
  }, [label]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('searchText', searchInputValue);
  }, [searchInputValue]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', properties.visibility);
  }, [properties.visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', dropdownLoadingState);
  }, [dropdownLoadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
  }, [disabledState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isMandatory', isMandatory);
  }, [isMandatory]);

  useEffect(() => {
    if (isInitialRender.current) return;
    const validationStatus = validate(currentValue);
    setValidationStatus(validationStatus);
    setExposedVariable('isValid', validationStatus?.isValid);
  }, [validate]);

  useEffect(() => {
    const _options = selectOptions?.map(({ label, value }) => ({ label, value }));
    const exposedVariables = {
      clear: async function () {
        setInputValue(null);
      },
      setVisibility: async function (value) {
        setVisibility(value);
        setExposedVariable('isVisible', value);
      },
      setLoading: async function (value) {
        setIsDropdownLoading(value);
        setExposedVariable('isLoading', value);
      },
      setDisable: async function (value) {
        setIsDropdownDisabled(value);
        setExposedVariable('isDisabled', value);
      },
      selectOption: async function (value) {
        let _value = value;
        if (isObject(value) && has(value, 'value')) _value = value?.value;
        selectOption(_value);
      },
      options: _options,
      value: currentValue,
      label: label,
      searchText: searchInputValue,
      isValid: isValid,
      isVisible: properties.visibility,
      isLoading: dropdownLoadingState,
      isDisabled: disabledState,
      isMandatory: isMandatory,
    };
    setExposedVariables(exposedVariables);
    isInitialRender.current = false;
  }, []);

  const customStyles = {
    container: (base) => ({
      ...base,
      width: '100%',
      minWidth: '72px',
    }),
    control: (provided, state) => {
      return {
        ...provided,
        minHeight: _height,
        height: _height,
        boxShadow: state.isFocused ? boxShadow : boxShadow,
        borderRadius: Number.parseFloat(fieldBorderRadius),
        borderColor: getInputBorderColor({
          isFocused: state.isFocused,
          isValid,
          fieldBorderColor,
          accentColor,
          isLoading: isDropdownLoading,
          isDisabled: isDropdownDisabled,
          userInteracted,
        }),
        backgroundColor: getInputBackgroundColor({
          fieldBackgroundColor,
          darkMode,
          isLoading: isDropdownLoading,
          isDisabled: isDropdownDisabled,
        }),
        '&:hover': {
          borderColor: state.isFocused
            ? getInputFocusedColor({ accentColor })
            : tinycolor(fieldBorderColor).darken(24).toString(),
        },
      };
    },
    valueContainer: (provided, _state) => ({
      ...provided,
      height: _height,
      padding: '0 10px',
      justifyContent,
      display: 'flex',
      gap: '0.13rem',
    }),

    singleValue: (provided, _state) => ({
      ...provided,
      color:
        selectedTextColor !== '#1B1F24'
          ? selectedTextColor
          : isDropdownDisabled || isDropdownLoading
          ? 'var(--text-disabled)'
          : 'var(--text-primary)',
      maxWidth:
        ref?.current?.offsetWidth -
        (iconVisibility ? INDICATOR_CONTAINER_WIDTH + ICON_WIDTH : INDICATOR_CONTAINER_WIDTH),
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    }),
    input: (provided, _state) => ({
      ...provided,
      color: darkMode ? 'white' : 'black',
      margin: '0px',
    }),
    indicatorSeparator: (_state) => ({
      display: 'none',
    }),
    indicatorsContainer: (provided, _state) => ({
      ...provided,
      height: _height,
      marginRight: '10px',
    }),
    clearIndicator: (provided, _state) => ({
      ...provided,
      padding: '2px',
      '&:hover': {
        padding: '2px',
        backgroundColor: 'var(--interactive-overlays-fill-hover)',
        borderRadius: '6px',
      },
    }),
    dropdownIndicator: (provided, _state) => ({
      ...provided,
      padding: '0px',
    }),
    option: (provided) => ({
      ...provided,
      backgroundColor: 'var(--surfaces-surface-01)',
      color:
        selectedTextColor !== '#1B1F24'
          ? selectedTextColor
          : isDropdownDisabled || isDropdownLoading
          ? 'var(--text-disabled)'
          : 'var(--text-primary)',
      padding: '8px 6px 8px 38px',
      '&:hover': {
        backgroundColor: 'var(--interactive-overlays-fill-hover)',
        borderRadius: '8px',
      },
      display: 'flex',
      cursor: 'pointer',
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '1px 8px',
      borderRadius: '8px',
      // this is needed otherwise :active state doesn't look nice, gap is required
      display: 'flex',
      flexDirection: 'column',
      gap: '4px !important',
      overflowY: 'auto',
      backgroundColor: 'var(--surfaces-surface-01)',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '8px',
      boxShadow: 'unset',
      margin: 0,
    }),
  };
  const _width = (labelWidth / 100) * 70; // Max width which label can go is 70% for better UX calculate width based on this value
  return (
    <>
      <div
        ref={dropdownRef}
        data-cy={`label-${String(componentName).toLowerCase()} `}
        className={cx('dropdown-widget', 'd-flex', {
          [alignment === 'top' &&
          ((labelWidth != 0 && label?.length != 0) ||
            (labelAutoWidth && labelWidth == 0 && label && label?.length != 0))
            ? 'flex-column'
            : 'align-items-center']: true,
          'flex-row-reverse': direction === 'right' && alignment === 'side',
          'text-right': direction === 'right' && alignment === 'top',
          invisible: !visibility,
          visibility: visibility,
        })}
        style={{
          position: 'relative',
          whiteSpace: 'nowrap',
          width: '100%',
        }}
        onMouseDown={(event) => {
          onComponentClick(id);
          // This following line is needed because sometimes after clicking on canvas then also dropdown remains selected
          useEditorStore.getState().actions.setHoveredComponent('');
        }}
      >
        <Label
          label={label}
          width={labelWidth}
          labelRef={labelRef}
          darkMode={darkMode}
          color={labelColor}
          defaultAlignment={alignment}
          direction={direction}
          auto={labelAutoWidth}
          isMandatory={isMandatory}
          _width={_width}
          top={'1px'}
        />
        <div className="w-100 px-0 h-100" onClick={handleInsideClick} onTouchEnd={handleInsideClick} ref={ref}>
          <Select
            isDisabled={isDropdownDisabled}
            value={selectOptions.filter((option) => option.value === currentValue)[0] ?? null}
            onChange={(selectedOption, actionProps) => {
              if (actionProps.action === 'clear') {
                setInputValue(null);
                fireEvent('onSelect');
              }
              if (actionProps.action === 'select-option') {
                setInputValue(selectedOption.value);
                fireEvent('onSelect');
              }
              setIsDropdownOpen(false);
              setUserInteracted(true);
            }}
            options={selectOptions}
            styles={customStyles}
            isLoading={isDropdownLoading}
            menuIsOpen={isDropdownOpen}
            onInputChange={onSearchTextChange}
            inputValue={searchInputValue}
            placeholder={placeholder}
            menuPortalTarget={document.body}
            components={{
              MenuList: CustomMenuList,
              ValueContainer: CustomValueContainer,
              Option: CustomOption,
              LoadingIndicator: () => <Loader style={{ right: '11px', zIndex: 3, position: 'absolute' }} width="16" />,
              DropdownIndicator: isDropdownLoading ? () => null : CustomDropdownIndicator,
              ClearIndicator: CustomClearIndicator,
            }}
            isClearable
            icon={icon}
            doShowIcon={iconVisibility}
            iconColor={iconColor}
            isSearchable={false}
            darkMode={darkMode}
            optionsLoadingState={optionsLoadingState && advanced}
            menuPlacement="auto"
          />
        </div>
      </div>
      {userInteracted && visibility && !isValid && (
        <div
          className={'d-flex'}
          style={{
            color: errTextColor,
            justifyContent: direction === 'right' ? 'flex-start' : 'flex-end',
            fontSize: '11px',
            fontWeight: '400',
            lineHeight: '16px',
          }}
        >
          {validationError}
        </div>
      )}
    </>
  );
};
