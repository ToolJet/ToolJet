import React from 'react';
import Select from '@/_ui/Select';
import CheckMark from '@/_ui/Icon/bulkIcons/CheckMark';
import { components } from 'react-select';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';

const ThemeSelect = ({ darkMode }) => {
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      width: '158px',
      height: '32px',
      minHeight: '32px',
    }),
    input: (provided) => ({
      ...provided,
      width: '150px',
      height: 'auto',
      padding: '0px',
    }),
    valueContainer: (provided, _state) => ({
      ...provided,
      fontSize: '12px',
      height: '100%',
    }),
    menu: (provided) => ({
      ...provided,
      width: '220px',
      right: '0',
      left: 'auto',
    }),
    menuList: (provided) => ({
      ...provided,
      width: '220px',
      textAlign: 'left',
      overflowY: 'auto', // Enable scrolling if needed
      scrollbarWidth: 'none', // Hide scrollbar for Firefox
      borderRadius: '8px',
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused
        ? '#f0f0f0' // Hover color
        : state.isSelected
        ? '#e6e6e6' // Selected background color
        : 'white',
      color: state.isSelected ? '#333' : 'black', // Adjust text color for selected state
      padding: '0px',
      paddingLeft: '20px',

      position: 'relative',
    }),
  };

  const CustomOption = (props) => {
    const { data, isSelected } = props;

    return (
      <components.Option {...props}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center', // Ensures vertical alignment
            gap: '10px', // Space between icon and text
            height: '30px',
          }}
        >
          {isSelected && (
            <CheckMark fill="transparent" fillIcon={'var(--primary-brand)'} className="datepicker-select-check" />
          )}
          <div className="color-icon" />
          <span style={{ fontSize: '12px', marginLeft: '5px', color: darkMode ? '#fff' : '#000' }}>{data.label}</span>
        </div>
      </components.Option>
    );
  };

  const CustomMenuList = (props) => {
    return (
      <components.MenuList {...props}>
        <div style={{ marginTop: '14px', marginBottom: '8px' }}>
          <span className="theme-custom-menu-list-header">On your workspace</span>
        </div>
        {props.children}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '8px',
            borderTop: '1px solid #ccc',
            height: '46px',
          }}
        >
          <ButtonSolid
            onClick={() => {}}
            variant="tertiary"
            leftIcon="addrectangle"
            fill="var(--primary-brand)"
            iconWidth="16"
            className="tj-text-xsm theme-create-btn"
          >
            Create a new theme
          </ButtonSolid>
        </div>
      </components.MenuList>
    );
  };

  return (
    <div className="d-flex theme-dropdown-wrapper mb-3">
      <div className="d-flex align-items-center ">
        <p className="tj-text-xsm color-slate12 w-full m-auto">Theme</p>
      </div>
      <Select
        options={[
          { name: 'Authorization code', value: 'authorization_code' },
          { name: 'Client credentials', value: 'client_credentials' },
        ]}
        value={'authorization_code'}
        onChange={(value) => {}}
        width={'100%'}
        useMenuPortal={true}
        styles={customSelectStyles}
        useCustomStyles={true}
        components={{ Option: CustomOption, MenuList: CustomMenuList }}
      />
    </div>
  );
};

export default ThemeSelect;
