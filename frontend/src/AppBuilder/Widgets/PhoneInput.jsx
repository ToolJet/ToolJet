import React, { useEffect, useMemo, useRef, useState } from 'react';
import Input, { getCountries, getCountryCallingCode } from 'react-phone-number-input/input';
import en from 'react-phone-number-input/locale/en';
import flags from 'react-phone-number-input/flags';
import 'react-phone-number-input/style.css';
import Select, { components } from 'react-select';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { useInput } from './BaseComponents/hooks/useInput';
import Loader from '@/ToolJetUI/Loader/Loader';
import Label from '@/_ui/Label';
import TickV3 from '@/_ui/Icon/solidIcons/TickV3';
import Planet from '@/_ui/Icon/bulkIcons/Planet';
const tinycolor = require('tinycolor2');

export const PhoneInput = (props) => {
  const { properties, styles, componentName, darkMode, height, setExposedVariable, setExposedVariables, fireEvent } =
    props;
  const transformedProps = {
    ...props,
    inputType: 'phone',
  };
  const inputLogic = useInput(transformedProps);
  const {
    inputRef,
    labelRef,
    visibility,
    loading,
    disable,
    validationStatus,
    showValidationError,
    isFocused,
    labelWidth,
    isValid,
    validationError,
    isMandatory,
    handleBlur,
    handleFocus,
    value,
    handlePhoneInputChange,
    country,
    setCountry,
  } = inputLogic;
  const { label, placeholder, isCountryChangeEnabled, defaultCountry = 'US' } = properties;

  const {
    padding,
    textColor,
    backgroundColor,
    alignment,
    width,
    direction,
    auto,
    color,
    borderColor,
    accentColor,
    errTextColor,
    boxShadow,
    borderRadius,
  } = styles;
  const _width = (width / 100) * 70;
  const defaultAlignment = alignment === 'side' || alignment === 'top' ? alignment : 'side';
  const isInitialRender = useRef(true);

  const getCountryCallingCodeSafe = (country) => {
    try {
      return getCountryCallingCode(country);
    } catch (error) {
      return '';
    }
  };

  const options = useMemo(
    () =>
      getCountries().map((country) => ({
        label: `${en[country]} +${getCountryCallingCodeSafe(country)}`,
        value: country,
      })),
    []
  );

  const onInputValueChange = (value) => {
    setExposedVariables({
      country: country,
      countryCode: getCountryCallingCodeSafe(country),
      formattedValue: `+${getCountryCallingCodeSafe(country)} ${inputRef.current?.value}`,
    });
    handlePhoneInputChange(value);
  };

  const handleKeyUp = (e) => {
    if (e.key === 'Enter') {
      onInputValueChange(value);
      fireEvent('onEnterPressed');
    }
  };

  useEffect(() => {
    if (isInitialRender.current) {
      setExposedVariables({
        country: country,
        countryCode: getCountryCallingCodeSafe(country),
        formattedValue: `+${getCountryCallingCodeSafe(country)} ${inputRef.current?.value}`,
        value: value,
        setCountryCode: (code) => {
          let value = getCountryCallingCodeSafe(code);
          if (value) {
            setCountry(code);
          } else {
            value = getCountries().find((country) => `+${getCountryCallingCode(country)}` === code);
            setCountry(value ? value : '');
          }
        },
      });
      isInitialRender.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isInitialRender.current) {
      setCountry(defaultCountry);
    }
  }, [defaultCountry]);

  const disabledState = disable || loading;

  const loaderStyle = {
    right:
      direction === 'right' &&
      defaultAlignment === 'side' &&
      ((label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0))
        ? `${labelWidth + 11}px`
        : '11px',
    top:
      defaultAlignment === 'top'
        ? ((label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0)) &&
          'calc(50% + 10px)'
        : '',
    transform:
      defaultAlignment === 'top' &&
      ((label?.length > 0 && width > 0) || (auto && width == 0 && label && label?.length != 0)) &&
      ' translateY(-50%)',
    zIndex: 3,
  };

  const computedStyles = {
    height: height == 36 ? (padding == 'default' ? '36px' : '40px') : padding == 'default' ? height : height + 4,
    borderRadius: `${borderRadius}px`,
    color: !['#1B1F24', '#000', '#000000ff'].includes(textColor)
      ? textColor
      : disabledState
      ? 'var(--text-disabled)'
      : 'var(--text-primary)',
    borderColor: isFocused
      ? accentColor != '4368E3'
        ? accentColor
        : 'var(--primary-accent-strong)'
      : borderColor != '#CCD1D5'
      ? borderColor
      : disabledState
      ? '1px solid var(--borders-disabled-on-white)'
      : 'var(--borders-default)',
    '--tblr-input-border-color-darker': tinycolor(borderColor).darken(24).toString(),
    backgroundColor:
      backgroundColor != '#fff'
        ? backgroundColor
        : disabledState
        ? darkMode
          ? 'var(--surfaces-app-bg-default)'
          : 'var(--surfaces-surface-03)'
        : 'var(--surfaces-surface-01)',
    padding: '8px 10px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    borderBottomLeftRadius: '0px',
    borderTopLeftRadius: '0px',
    borderLeft: 'none',
  };

  const CustomValueContainer = ({ getValue, ...props }) => {
    const selectedValue = getValue()[0];
    const FlagIcon = selectedValue ? flags[selectedValue.value] : null;
    const countryCode = getCountryCallingCodeSafe(selectedValue.value);

    return (
      <components.ValueContainer {...props}>
        {FlagIcon ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <>
              <FlagIcon style={{ height: '16px' }} /> <span style={{ marginLeft: '2px' }}>{` +${countryCode}`}</span>
            </>
          </div>
        ) : (
          <div style={{ display: 'flex', marginLeft: '17px', marginTop: '4px', justifyContent: 'center' }}>
            <Planet width={24} height={24} />
          </div>
        )}
      </components.ValueContainer>
    );
  };

  const CustomOption = (props) => {
    const { label, value: optionValue, isSelected } = props;
    const optionStyle = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'start',
      minHeight: '32px',
      gap: '6px',
      cursor: 'pointer',
      fontFamily: 'IBM Plex Sans',
      fontSize: '12px',
      lineHeight: '18px',
      fontWeight: '400',
      color: darkMode ? '#fff' : '#1B1F24',
      width: '100%',
    };
    console.log('darkMode', darkMode);
    const FlagIcon = flags[optionValue];

    return (
      <components.Option {...props}>
        <div style={optionStyle}>
          <div>{FlagIcon ? <FlagIcon style={{ width: '22px', height: '16px' }} /> : null}</div>
          {label}
          <div style={{ marginLeft: 'auto', display: isSelected ? 'block' : 'none' }}>
            <TickV3 width="13.33px" height="11.27px" />
          </div>
        </div>
      </components.Option>
    );
  };

  const CustomMenuList = (props) => {
    const { children, selectProps } = props;
    const { onInputChange, inputValue } = selectProps;

    return (
      <div
        className={cx('dropdown-multiselect-widget-custom-menu-list', {
          'theme-dark dark-theme': selectProps?.darkMode,
        })}
        style={{ height: '236px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="dropdown-multiselect-widget-search-box-wrapper">
          <span>
            <SolidIcon name="search01" width="14" />
          </span>
          <input
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            type="text"
            placeholder="Search"
            className="dropdown-multiselect-widget-search-box"
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
          />
        </div>

        <components.MenuList {...props}>
          {children?.length > 0 ? children : <div style={{ padding: '8px', textAlign: 'center' }}>No options</div>}
        </components.MenuList>
      </div>
    );
  };

  const CountrySelect = ({ value, onChange, options, ...rest }) => {
    const [menuIsOpen, setMenuIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setMenuIsOpen(false);
        }
      };

      // Add event listener when dropdown is open
      if (menuIsOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      // Clean up the event listener
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [menuIsOpen]);

    const customStyles = {
      container: (provided) => ({
        ...provided,
        minWidth: !isCountryChangeEnabled || disabledState ? '77px' : '87px',
        width: !isCountryChangeEnabled || disabledState ? '77px' : '87px',
        height: '100%',
      }),
      control: (provided, state) => ({
        ...provided,
        minHeight: '0px',
        height: '100%',
        borderTopLeftRadius: `${borderRadius}px`,
        borderBottomLeftRadius: `${borderRadius}px`,
        borderTopRightRadius: '0px',
        borderBottomRightRadius: '0px',
        borderColor: `${
          !isValid && showValidationError ? 'var(--status-error-strong)' : computedStyles?.borderColor
        } !important`,
        backgroundColor: `${
          isCountryChangeEnabled
            ? computedStyles?.backgroundColor
            : darkMode
            ? 'var(--surfaces-app-bg-default)'
            : 'var(--surfaces-surface-03)'
        } !important`,
      }),
      menu: (provided) => ({
        ...provided,
        width: '208px',
        height: '236px',
        borderRadius: '8px',
        marginTop: '2px',
      }),
      menuList: (provided) => ({
        ...provided,
        maxHeight: '196px',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        gap: '1px',
        padding: '8px',
        borderRadius: '0px 0px 8px 8px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--surfaces-surface-01)',
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#4368E31A' : 'var(--surfaces-surface-01)',
        ...(state.isSelected && { borderRadius: '8px' }),
        '&:hover': {
          backgroundColor: 'var(--interactive-overlays-fill-hover)',
          borderRadius: '8px',
        },
        display: 'flex',
        cursor: 'pointer',
        padding: '1px 14px',
      }),
    };

    return (
      <div style={{ height: '100%' }} onClick={() => setMenuIsOpen((prev) => !prev)} ref={dropdownRef}>
        <Select
          options={options}
          value={value}
          styles={customStyles}
          onChange={onChange}
          hasSearch={false}
          useCustomStyles={true}
          menuPortalTarget={document.body}
          components={{
            MenuList: CustomMenuList,
            Option: CustomOption,
            ValueContainer: CustomValueContainer, // Add this line
            IndicatorSeparator: () => null,
            DropdownIndicator:
              !isCountryChangeEnabled || disabledState
                ? () => null
                : () => (
                    <div style={{ position: 'relative', display: 'flex', left: '-1px' }}>
                      {menuIsOpen ? (
                        <SolidIcon name="TriangleDownCenter" width="16" height="16" />
                      ) : (
                        <SolidIcon name="TriangleUpCenter" width="16" height="16" />
                      )}
                    </div>
                  ),
          }}
          darkMode={darkMode}
          isDisabled={disabledState}
          menuIsOpen={menuIsOpen}
        />
      </div>
    );
  };

  return (
    <>
      <div
        data-cy={`label-${String(componentName).toLowerCase()}`}
        className={`text-input d-flex phone-input-widget ${
          defaultAlignment === 'top' &&
          ((width != 0 && label?.length != 0) || (auto && width == 0 && label && label?.length != 0))
            ? 'flex-column'
            : 'align-items-center'
        } ${direction === 'right' && defaultAlignment === 'side' ? 'flex-row-reverse' : ''}
        ${direction === 'right' && defaultAlignment === 'top' ? 'text-right' : ''}
        ${visibility || 'invisible'}`}
        style={{
          position: 'relative',
          whiteSpace: 'nowrap',
          width: '100%',
          height: '100%',
        }}
      >
        <Label
          label={label}
          width={width}
          labelRef={labelRef}
          darkMode={darkMode}
          color={color}
          defaultAlignment={defaultAlignment}
          direction={direction}
          auto={auto}
          isMandatory={isMandatory}
          _width={_width}
          labelWidth={labelWidth}
        />
        <div className="d-flex h-100 w-100" style={{ boxShadow, borderRadius: `${borderRadius}px` }}>
          <CountrySelect
            value={{ label: `${en[country]} +${getCountryCallingCodeSafe(country)}`, value: country }}
            options={options}
            onChange={(selectedOption) => {
              if (selectedOption) {
                setCountry(selectedOption.value);
              }
            }}
          />
          <Input
            ref={inputRef}
            country={country}
            international={false}
            value={value}
            onChange={onInputValueChange}
            placeholder={placeholder}
            style={computedStyles}
            className={`tj-text-input-widget ${
              !isValid && showValidationError ? 'is-invalid' : ''
            } validation-without-icon`}
            disabled={disabledState}
            data-ignore-hover={true}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onKeyUp={handleKeyUp}
          />
        </div>
        {loading && <Loader style={loaderStyle} width="16" />}
      </div>
      {showValidationError && visibility && (
        <div
          data-cy={`${String(componentName).toLowerCase()}-invalid-feedback`}
          style={{
            color: errTextColor !== '#D72D39' ? errTextColor : 'var(--status-error-strong)',
            textAlign: direction == 'left' && 'end',
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
