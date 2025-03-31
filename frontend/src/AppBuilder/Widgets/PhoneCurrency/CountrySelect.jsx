import React, { useEffect, useRef, useState } from 'react';
import Select from 'react-select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { CustomMenuList } from './CustomMenuList';
import { CustomOption } from './CustomOption';
import { CustomValueContainer } from './CustomValueContainer';

export const CountrySelect = ({ value, onChange, options, ...rest }) => {
  const {
    isCountryChangeEnabled,
    isCurrencyInput = false,
    disabledState,
    borderRadius,
    isValid,
    showValidationError,
    computedStyles,
    darkMode,
  } = rest;
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuIsOpen(false);
      }
    };

    if (menuIsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuIsOpen]);

  const customStyles = {
    container: (provided) => ({
      ...provided,
      minWidth: isCurrencyInput ? '55px' : !isCountryChangeEnabled || disabledState ? '77px' : '87px',
      width: isCurrencyInput ? '55px' : !isCountryChangeEnabled || disabledState ? '77px' : '87px',
      height: '100%',
    }),
    control: (provided) => ({
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
    <div
      onClick={() => {
        if (disabledState || !isCountryChangeEnabled) return;
        setMenuIsOpen((prev) => !prev);
      }}
      ref={dropdownRef}
    >
      <Select
        options={options}
        value={value}
        styles={customStyles}
        onChange={onChange}
        hasSearch={false}
        useCustomStyles={true}
        menuPortalTarget={document.body}
        isCurrencyInput={isCurrencyInput}
        components={{
          MenuList: CustomMenuList,
          Option: (props) => <CustomOption {...props} />,
          ValueContainer: (props) => <CustomValueContainer {...props} />, // Add this line
          IndicatorSeparator: () => null,
          DropdownIndicator:
            !isCountryChangeEnabled || disabledState
              ? () => null
              : () => (
                  <div style={{ position: 'relative', display: 'flex', left: '-2px' }}>
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
        onMenuOpen={() => setMenuIsOpen(true)}
        onMenuClose={() => setMenuIsOpen(false)}
      />
    </div>
  );
};
