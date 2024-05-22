import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import React, { useState, useEffect, useMemo } from 'react';
import Select, { components } from 'react-select';
import * as Icons from '@tabler/icons-react';
import CheckMark from '@/_ui/Icon/bulkIcons/CheckMark';
import ClearIndicatorIcon from '@/_ui/Icon/bulkIcons/ClearIndicator';
import TriangleDownCenter from '@/_ui/Icon/solidIcons/TriangleDownCenter';
import TriangleUpCenter from '@/_ui/Icon/solidIcons/TriangleUpCenter';
import cx from 'classnames';
import { useEditorStore } from '@/_stores/editorStore';
import Loader from '@/ToolJetUI/Loader/Loader';
import { has, isObject, pick } from 'lodash';
const tinycolor = require('tinycolor2');
import SolidIcon from '@/_ui/Icon/SolidIcons';
import './dropdownV2.scss';

const { ValueContainer, SingleValue, Placeholder, DropdownIndicator, ClearIndicator, MenuList, Menu } = components;
const INDICATOR_CONTAINER_WIDTH = 60;
const ICON_WIDTH = 18; // includes flex gap 2px

export const CustomMenuList = ({ optionsLoadingState, darkMode, selectProps, inputRef, ...props }) => {
  const { onInputChange, inputValue, onMenuInputFocus } = selectProps;

  return (
    <div className={cx({ 'dark-theme theme-dark': darkMode })}>
      <div className="dropdown-widget-custom-menu-list" onClick={(e) => e.stopPropagation()}>
        <div className="dropdown-widget-search-box-wrapper">
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
            className="dropdown-widget-search-box"
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
            props.children
          )}
        </MenuList>
      </div>
    </div>
  );
};

const CustomDropdownIndicator = (props) => {
  const {
    selectProps: { menuIsOpen },
  } = props;
  return (
    <DropdownIndicator {...props}>
      {menuIsOpen ? (
        <TriangleDownCenter width={'13.33'} className="cursor-pointer" />
      ) : (
        <TriangleUpCenter width={'13.33'} className="cursor-pointer" />
      )}
    </DropdownIndicator>
  );
};

const CustomClearIndicator = (props) => {
  return (
    <ClearIndicator {...props}>
      <ClearIndicatorIcon width={'13.33'} fill={'var(--borders-strong)'} className="cursor-pointer" />
    </ClearIndicator>
  );
};

const CustomValueContainer = ({ children, ...props }) => {
  const selectProps = props.selectProps;
  // eslint-disable-next-line import/namespace
  const IconElement = Icons[selectProps?.icon] == undefined ? Icons['IconHome2'] : Icons[selectProps?.icon];
  return (
    <ValueContainer {...props}>
      {selectProps?.doShowIcon && (
        <IconElement
          style={{
            width: '16px',
            height: '16px',
            color: selectProps?.iconColor,
          }}
        />
      )}
      <span className="d-flex" {...props}>
        {React.Children.map(children, (child) => {
          return child ? (
            child
          ) : props.hasValue ? (
            <SingleValue {...props} {...selectProps}>
              {selectProps?.getOptionLabel(props?.getValue()[0])}
            </SingleValue>
          ) : (
            <Placeholder {...props} key="placeholder" {...selectProps} data={props.getValue()}>
              {selectProps.placeholder}
            </Placeholder>
          );
        })}
      </span>
    </ValueContainer>
  );
};

const Option = (props) => {
  return (
    <components.Option {...props}>
      <div className="cursor-pointer">
        {props.isSelected && (
          <span style={{ maxHeight: '20px', marginRight: '8px', marginLeft: '-28px' }}>
            <CheckMark width={'20'} fill={'var(--primary-brand)'} />
          </span>
        )}
        <span style={{ color: props.isDisabled ? '#889096' : 'unset', wordBreak: 'break-all' }}>{props.label}</span>
      </div>
    </components.Option>
  );
};

export const DropdownV2 = ({
  height,
  validate,
  properties,
  styles,
  setExposedVariable,
  fireEvent,
  darkMode,
  onComponentClick,
  id,
  component,
  exposedVariables,
  dataCy,
}) => {
  let {
    label,
    value,
    advanced,
    schema,
    placeholder,
    display_values,
    values,
    loadingState: dropdownLoadingState,
    disabledState,
    optionVisibility,
    optionDisable,
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
  const selectref = React.useRef(null);
  const [visibility, setVisibility] = useState(properties.visibility);
  const [isDropdownLoading, setIsDropdownLoading] = useState(dropdownLoadingState);
  const [isDropdownDisabled, setIsDropdownDisabled] = useState(disabledState);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const _height = padding === 'default' ? `${height}px` : `${height + 4}px`;
  const inputRef = React.useRef(null); // Ref for the input search box

  function findDefaultItem(schema) {
    const foundItem = schema?.find((item) => item?.default === true);
    return !hasVisibleFalse(foundItem?.value) ? foundItem?.value : undefined;
  }

  const selectOptions = useMemo(() => {
    let _selectOptions = advanced
      ? [
          ...schema
            .filter((data) => data.visible)
            .map((value) => ({
              ...value,
              isDisabled: value.disable,
            })),
        ]
      : [
          ...values
            .map((value, index) => {
              if (optionVisibility[index] !== false) {
                return { label: display_values[index], value: value, isDisabled: optionDisable[index] };
              }
            })
            .filter((option) => option),
        ];

    return _selectOptions;
  }, [advanced, schema, display_values, values, optionDisable, optionVisibility]);

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
  }, [currentValue, JSON.stringify(display_values), JSON.stringify(values), JSON.stringify(selectOptions)]);

  useEffect(() => {
    setExposedVariable('label', label);
    setExposedVariable('searchText', inputValue);
    setExposedVariable('isValid', isValid);
    setExposedVariable('isVisible', properties.visibility);
    setExposedVariable('isLoading', dropdownLoadingState);
    setExposedVariable('isDisabled', disabledState);
    setExposedVariable('isMandatory', isMandatory);

    setExposedVariable('clear', async function () {
      setCurrentValue(null);
    });
    setExposedVariable('setVisibility', async function (value) {
      setVisibility(value);
    });
    setExposedVariable('setLoading', async function (value) {
      setIsDropdownLoading(value);
    });
    setExposedVariable('setDisable', async function (value) {
      setIsDropdownDisabled(value);
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.visibility, dropdownLoadingState, disabledState, isMandatory, label, inputValue, isValid]);

  const customStyles = {
    container: (base) => ({
      ...base,
      width: '100%',
    }),
    control: (provided, state) => {
      return {
        ...provided,
        minHeight: _height,
        height: _height,
        boxShadow: state.isFocused ? boxShadow : boxShadow,
        borderRadius: Number.parseFloat(fieldBorderRadius),
        borderColor: !isValid
          ? 'var(--status-error-strong)'
          : state.isFocused
          ? accentColor != '#4368E3'
            ? accentColor
            : 'var(--primary-accent-strong)'
          : fieldBorderColor != '#CCD1D5'
          ? fieldBorderColor
          : isDropdownDisabled || isDropdownLoading
          ? '1px solid var(--borders-disabled-on-white)'
          : 'var(--borders-default)',
        '--tblr-input-border-color-darker': tinycolor(fieldBorderColor).darken(24).toString(),
        backgroundColor: !['#ffffff', '#ffffffff', '#fff'].includes(fieldBackgroundColor)
          ? fieldBackgroundColor
          : isDropdownDisabled || isDropdownLoading
          ? darkMode
            ? 'var(--surfaces-app-bg-default)'
            : 'var(--surfaces-surface-03)'
          : 'var(--surfaces-surface-01)',
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
      color: darkMode && selectedTextColor === '#11181C' ? '#ECEDEE' : selectedTextColor,
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
      padding: '0px',
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
      color: darkMode && ['#11181C'].includes(selectedTextColor) ? '#ECEDEE' : selectedTextColor,
      padding: '8px 6px 8px 38px',
      '&:hover': {
        backgroundColor: 'var(--interactive-overlays-fill-hover)',
        borderRadius: '8px',
      },
      display: 'flex',
    }),
    menuList: (provided) => ({
      ...provided,
      padding: '8px',
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
      marginTop: '5px',
    }),
  };

  const labelStyles = {
    [direction === 'alignRight' ? 'marginLeft' : 'marginRight']: label ? '1rem' : '0.001rem',
    color: labelColor !== '#1B1F24' ? labelColor : 'var(--text-primary)',
    justifyContent: direction === 'alignRight' ? 'flex-end' : 'flex-start',
  };

  const _width = (labelWidth / 100) * 70; // Max width which label can go is 70% for better UX calculate width based on this value
  return (
    <>
      <div
        className="dropdown-widget g-0"
        style={{
          // height: _height,
          display: visibility ? 'flex' : 'none',
          flexDirection: alignment === 'top' ? 'column' : direction === 'alignRight' ? 'row-reverse' : 'row',
        }}
        onMouseDown={(event) => {
          onComponentClick(id, component, event);
          // This following line is needed because sometimes after clicking on canvas then also dropdown remains selected
          useEditorStore.getState().actions.setHoveredComponent('');
        }}
        data-cy={dataCy}
      >
        <div
          className={`my-auto text-truncate`}
          style={{
            alignSelf: direction === 'alignRight' ? 'flex-end' : 'flex-start',
            width: alignment === 'top' || labelAutoWidth ? 'auto' : `${_width}%`,
            // maxWidth: alignment === 'top' || labelAutoWidth ? '100%' : `${labelWidth}%`,
            maxWidth: alignment === 'side' ? '70%' : '100%',
          }}
        >
          <label style={labelStyles} className="font-size-12 font-weight-500 py-0 my-0 d-flex">
            <span
              style={{
                overflow: label?.length > 18 && 'hidden', // Hide any content that overflows the box
                textOverflow: 'ellipsis', // Display ellipsis for overflowed content
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {label}
            </span>
            <span style={{ color: '#DB4324', marginLeft: '1px' }}>{isMandatory && '*'}</span>
          </label>
        </div>
        <div className="w-100 px-0 h-100" ref={ref}>
          <Select
            ref={selectref}
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
            components={{
              MenuList: (props) => (
                <CustomMenuList
                  {...props}
                  optionsLoadingState={properties.optionsLoadingState}
                  darkMode={darkMode}
                  inputRef={inputRef}
                />
              ),
              ValueContainer: CustomValueContainer,
              Option,
              LoadingIndicator: () => <Loader style={{ right: '11px', zIndex: 3, position: 'absolute' }} width="16" />,
              DropdownIndicator: isDropdownLoading ? () => null : CustomDropdownIndicator,
              ClearIndicator: CustomClearIndicator,
            }}
            isClearable
            icon={icon}
            doShowIcon={iconVisibility}
            iconColor={iconColor}
            isSearchable={false}
            isDarkMode={darkMode}
            {...{
              menuIsOpen: isFocused || undefined,
              isFocused: isFocused || undefined,
            }}
            inputValue={inputValue}
            setInputValue={setInputValue}
          />
        </div>
      </div>
      <div
        className={`invalid-feedback ${isValid ? '' : visibility ? 'd-flex' : 'none'}`}
        style={{
          color: errTextColor,
          justifyContent: direction === 'alignRight' ? 'flex-start' : 'flex-end',
          marginTop: alignment === 'top' ? '1.25rem' : '0.25rem',
        }}
      >
        {!isValid && validationError}
      </div>
    </>
  );
};
