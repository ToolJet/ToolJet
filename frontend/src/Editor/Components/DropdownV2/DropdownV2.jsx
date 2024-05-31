import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
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
import { getInputBackgroundColor, getInputBorderColor } from './utils';

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
        <TriangleUpArrow width={'16'} className="cursor-pointer" fill={'var(--borders-strong)'} />
      ) : (
        <TriangleDownArrow width={'16'} className="cursor-pointer" fill={'var(--borders-strong)'} />
      )}
    </DropdownIndicator>
  );
};

export const CustomClearIndicator = (props) => {
  return (
    <ClearIndicator {...props}>
      <ClearIndicatorIcon width={'16'} fill={'var(--borders-strong)'} className="cursor-pointer" />
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
  component,
  exposedVariables,
  dataCy,
}) => {
  const {
    label,
    value,
    advanced,
    schema,
    placeholder,
    loadingState: dropdownLoadingState,
    disabledState,
    options,
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
  const [currentValue, setCurrentValue] = useState(() => (advanced ? findDefaultItem(schema) : value));
  const { value: exposedValue } = exposedVariables;
  const currentState = useCurrentState();
  const isMandatory = resolveReferences(component?.definition?.validation?.mandatory?.value, currentState);
  const validationData = validate(currentValue);
  const { isValid, validationError } = validationData;
  const ref = React.useRef(null);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isDropdownLoading, setIsDropdownLoading] = useState(dropdownLoadingState);
  const [isDropdownDisabled, setIsDropdownDisabled] = useState(disabledState);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const _height = padding === 'default' ? `${height}px` : `${height + 4}px`;
  const inputRef = React.useRef(null); // Ref for the input search box
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
        .filter((data) => data.visible)
        .map((value) => ({
          ...value,
          isDisabled: value.disable,
        }));
      return _selectOptions;
    } else {
      return [];
    }
  }, [advanced, schema, options]);

  function selectOption(value) {
    const val = selectOptions.filter((option) => !option.isDisabled)?.find((option) => option.value === value);
    if (val) {
      setCurrentValue(value);
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
      setInputValue(searchText);
      fireEvent('onSearchTextChanged');
    }
  };

  const handleOutsideClick = (e) => {
    let menu = ref.current.querySelector('.select__menu');
    if (!ref.current.contains(e.target) || !menu || !menu.contains(e.target)) {
      setIsFocused(false);
      setInputValue('');
    }
  };

  useEffect(() => {
    // Focus the input search box when the menu list is open and the component is focused
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  useEffect(() => {
    if (advanced) {
      setCurrentValue(findDefaultItem(schema));
    } else setCurrentValue(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advanced, value, JSON.stringify(schema)]);

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  useEffect(() => {
    if (visibility !== properties.visibility) setVisibility(properties.visibility);
    if (isDropdownLoading !== dropdownLoadingState) setIsDropdownLoading(dropdownLoadingState);
    if (isDropdownDisabled !== disabledState) setIsDropdownDisabled(disabledState);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, dropdownLoadingState, disabledState]);

  // Exposed variables
  useEffect(() => {
    if (exposedValue !== currentValue) {
      const _selectedOption = selectOptions.find((option) => option.value === currentValue);
      setExposedVariable('selectedOption', pick(_selectedOption, ['label', 'value']));
    }
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
    setExposedVariable('label', label);
    setExposedVariable('searchText', inputValue);
    setExposedVariable('isValid', isValid);
    setExposedVariable('isVisible', properties.visibility);
    setExposedVariable('isLoading', dropdownLoadingState);
    setExposedVariable('isDisabled', disabledState);
    setExposedVariable('isMandatory', isMandatory);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, dropdownLoadingState, disabledState, isMandatory, label, inputValue, isValid]);

  useEffect(() => {
    const exposedVariables = {
      clear: async function () {
        setCurrentValue(null);
      },
      setVisibility: async function (value) {
        setVisibility(value);
      },
      setLoading: async function (value) {
        setIsDropdownLoading(value);
      },
      setDisable: async function (value) {
        setIsDropdownDisabled(value);
      },
    };
    setExposedVariables(exposedVariables);
  }, []);

  const customStyles = {
    container: (base) => ({
      ...base,
      width: '100%',
    }),
    control: (provided, state) => {
      return {
        ...provided,
        'var(--tblr-input-border-color-darker)': tinycolor(fieldBorderColor).darken(24).toString(),
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
        }),
        backgroundColor: getInputBackgroundColor({
          fieldBackgroundColor,
          darkMode,
          isLoading: isDropdownLoading,
          isDisabled: isDropdownDisabled,
        }),
        '&:hover': {
          borderColor: 'var(--tblr-input-border-color-darker)',
        },
      };
    },
    valueContainer: (provided, _state) => ({
      ...provided,
      height: _height,
      padding: '0 6px',
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
      padding: '1.33px',
      '&:hover': {
        padding: '1.33px',
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
      backgroundColor:
        darkMode && ['#ffffff', '#ffffffff', '#fff'].includes(fieldBackgroundColor)
          ? 'var(--surfaces-surface-01)'
          : fieldBackgroundColor,
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
      padding: '8px',
      borderRadius: '8px',
      // this is needed otherwise :active state doesn't look nice, gap is required
      display: 'flex',
      flexDirection: 'column',
      gap: '4px !important',
      overflowY: 'auto',
      backgroundColor:
        darkMode && ['#ffffff', '#ffffffff', '#fff'].includes(fieldBackgroundColor)
          ? 'var(--surfaces-surface-01)'
          : fieldBackgroundColor,
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
        data-cy={`label-${String(component.name).toLowerCase()} `}
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
          onComponentClick(id, component, event);
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
        />
        <div className="w-100 px-0 h-100" ref={ref}>
          <Select
            isDisabled={isDropdownDisabled}
            value={selectOptions.filter((option) => option.value === currentValue)[0] ?? null}
            onChange={(selectedOption, actionProps) => {
              if (actionProps.action === 'clear') {
                setCurrentValue(null);
              }
              if (actionProps.action === 'select-option') {
                setCurrentValue(selectedOption.value);
                fireEvent('onSelect');
              }
              setIsFocused(false);
            }}
            options={selectOptions}
            styles={customStyles}
            isLoading={isDropdownLoading}
            onInputChange={onSearchTextChange}
            onFocus={() => {
              fireEvent('onFocus');
            }}
            onMenuInputFocus={() => setIsFocused(true)}
            onBlur={() => {
              fireEvent('onBlur');
            }}
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
            {...{
              menuIsOpen: isFocused || undefined,
              isFocused: isFocused || undefined,
            }}
            isClearable
            // select props
            icon={icon}
            doShowIcon={iconVisibility}
            iconColor={iconColor}
            isSearchable={false}
            darkMode={darkMode}
            inputValue={inputValue}
            setInputValue={setInputValue}
            optionsLoadingState={properties.optionsLoadingState}
            inputRef={inputRef}
          />
        </div>
      </div>
      <div
        className={`${isValid ? '' : visibility ? 'd-flex' : 'none'}`}
        style={{
          color: errTextColor,
          justifyContent: direction === 'right' ? 'flex-start' : 'flex-end',
          fontSize: '11px',
          fontWeight: '400',
          lineHeight: '16px',
        }}
      >
        {!isValid && validationError}
      </div>
    </>
  );
};
