import React, { useEffect, useState } from 'react';
import Select from '@/_ui/Select';
import CheckMark from '@/_ui/Icon/bulkIcons/CheckMark';
import { components } from 'react-select';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
import { useNavigate } from 'react-router-dom';
import { getWorkspaceId } from '@/_helpers/utils';
import { appThemesService } from '../../../../ee/modules/WorkspaceSettings/pages/ManageThemes/service/app_themes.service';

const ThemeSelect = ({ darkMode }) => {
  const [themesList, setThemesList] = useState([]);
  const selectedTheme = useStore((state) => state.globalSettings.theme, shallow);
  const featureAccess = useStore((state) => state?.license?.featureAccess, shallow);
  const licenseValid = !featureAccess?.licenseStatus?.isExpired && featureAccess?.licenseStatus?.isLicenseValid;
  const globalSettingsChanged = useStore((state) => state.globalSettingsChanged, shallow);
  const workspaceId = getWorkspaceId();
  const appId = useStore((state) => state.app.appId, shallow);
  const versionId = useStore((state) => state.currentVersionId, shallow);
  const navigate = useNavigate();

  const fetchAllThemes = async () => {
    const themes = await appThemesService.fetchAllThemes();

    const options = themes.map((theme) => ({
      value: theme.id,
      name: theme.name,
      label: theme.name,
      color: theme?.definition?.brand?.colors?.primary,
      isDefault: theme?.isDefault,
      theme: theme,
    }));

    setThemesList(options);
  };

  const setTheme = async (themeId) => {
    await appThemesService.updateAppTheme(appId, versionId, themeId);
  };

  useEffect(() => {
    fetchAllThemes();
  }, []);

  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      width: '158px',
      height: '32px',
      minHeight: '32px',
      flexWrap: 'nowrap',
      overflow: 'hidden',
    }),
    input: (provided) => ({
      ...provided,
      width: '150px',
      height: 'auto',
      padding: '0px',
      color: darkMode ? '#fff' : '#000',
    }),
    singleValue: (provided) => ({
      ...provided,
      color: darkMode ? '#fff' : '#000', // Set selected value color based on darkMode
    }),
    valueContainer: (provided, _state) => ({
      ...provided,
      fontSize: '12px',
      height: '100%',
      color: darkMode ? '#fff' : '#000',
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
    menuPortal: (base) => ({
      ...base,
      top: base.top + 2, // Adjust the top position
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
            alignItems: 'center',
            justifyContent: 'flex-start',
            gap: '2px',
            height: '30px',
          }}
        >
          {isSelected && (
            <CheckMark width="20px" fill="transparent" fillIcon={'#3e63dd'} className="datepicker-select-check" />
          )}
          <div
            className="color-icon"
            style={{
              backgroundColor: data?.color?.[darkMode ? 'dark' : 'light'],
              marginLeft: isSelected ? '0px' : '22px',
            }}
          />
          <span style={{ fontSize: '12px', marginLeft: '2px', color: darkMode ? '#fff' : '#000' }}>{data.label}</span>
          {data?.isDefault && (
            <span
              style={{
                marginLeft: 'auto',
                marginRight: '10px',
                display: 'inline-flex', // Enables flexbox on the span
                alignItems: 'center', // Vertically centers the text
                justifyContent: 'center',
                color: darkMode ? '#fff' : '#000',
              }}
              className="theme-default-pill"
            >
              Default
            </span>
          )}
        </div>
      </components.Option>
    );
  };

  const CustomValueContainer = ({ children, ...props }) => {
    return (
      <components.ValueContainer {...props}>
        <div className="d-flex align-items-center">
          <div
            className="color-icon"
            style={{
              backgroundColor: selectedTheme?.definition?.brand?.colors?.primary?.[darkMode ? 'dark' : 'light'],
              marginRight: '5px',
            }}
          />
          {children}
        </div>
      </components.ValueContainer>
    );
  };

  const CustomMenuList = (props) => {
    return (
      <components.MenuList {...props}>
        <div style={{ marginTop: '14px', marginBottom: '8px' }}>
          <span className="theme-custom-menu-list-header" style={{ color: darkMode ? '#fff' : '#000' }}>
            On your workspace
          </span>
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
            onClick={() => {
              navigate(`/${workspaceId}/workspace-settings/themes`);
            }}
            variant="tertiary"
            leftIcon="addrectangle"
            fill="#3e63dd"
            iconWidth="16"
            className="tj-text-xsm theme-create-btn"
          >
            <span style={{ color: darkMode ? '#fff' : '#000' }}>Create a new theme</span>
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
        options={themesList}
        value={selectedTheme?.id}
        onChange={(themeId) => {
          setTheme(themeId);
          globalSettingsChanged({ theme: themesList.find((theme) => theme.value === themeId)?.theme });
        }}
        width={'100%'}
        isDisabled={!licenseValid || !featureAccess?.customThemes}
        useMenuPortal={true}
        styles={customSelectStyles}
        useCustomStyles={true}
        components={{ Option: CustomOption, MenuList: CustomMenuList, ValueContainer: CustomValueContainer }}
      />
    </div>
  );
};

export default ThemeSelect;
