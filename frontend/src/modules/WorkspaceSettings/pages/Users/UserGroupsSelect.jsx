import { getWorkspaceId } from '@/_helpers/utils';
import urlJoin from 'url-join';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import React, { useState, useCallback } from 'react';
import Select, { components } from 'react-select';
import SolidIcon from '@/_ui/Icon/solidIcons/index';

export function UserGroupsSelect(props) {
  const workspaceId = getWorkspaceId();
  const darkMode = localStorage.getItem('darkMode') === 'true';

  //Will be used when workspace routing settings have been merged
  const Menu = useCallback(({ children, ...rest }) => {
    return (
      <components.Menu {...rest}>
        {children}
        <div className="add-group-btn">
          <ButtonSolid
            onClick={() =>
              window.open(
                urlJoin(
                  `${window.public_config?.TOOLJET_HOST}${
                    window.public_config?.SUB_PATH ? window.public_config?.SUB_PATH : ''
                  }`,
                  `/${workspaceId}/workspace-settings/groups`
                )
              )
            }
            iconCustomClass="rectangle-add-icon"
            className="create-group"
            fill="var(--indigo9)"
            variant="secondary"
            leftIcon="addrectangle"
            data-cy="create-new-group-button"
          >
            Create new group
          </ButtonSolid>
        </div>
      </components.Menu>
    );
  }, []);

  const formatGroupLabel = (data) => {
    const type = data.label;
    return (
      <div className="mb-2 d-flex align-items-center">
        <SolidIcon name={type === 'default' ? 'usergear' : 'usergroup'} />
        <span className="ml-1 group-title">{type === 'default' ? 'USER ROLE' : 'Custom groups'}</span>
        {type === 'default' && <span style={{ color: 'red' }}>*</span>}
      </div>
    );
  };

  const InputOption = ({ getStyles, Icon, isDisabled, isFocused, isSelected, children, data, innerProps, ...rest }) => {
    const [isActive, setIsActive] = useState(false);
    const onMouseDown = () => setIsActive(true);
    const onMouseUp = () => setIsActive(false);
    const onMouseLeave = () => setIsActive(false);
    const style = {
      alignItems: 'center',
      backgroundColor: 'transparent',
      color: 'inherit',
      display: 'flex ',
    };

    const props = {
      ...innerProps,
      onMouseDown,
      onMouseUp,
      onMouseLeave,
      style,
    };
    return (
      <components.Option
        {...rest}
        isDisabled={isDisabled}
        isFocused={isFocused}
        isSelected={isSelected}
        getStyles={getStyles}
        innerProps={props}
        className={isDisabled && 'disabled'}
      >
        <input
          style={
            data.groupType === 'default'
              ? { height: '1.3rem' }
              : { width: '1.2rem', height: '1.2rem', borderRadius: '6px !important' }
          }
          type={data.groupType === 'default' ? 'radio' : 'checkbox'}
          className="form-check-input"
          checked={isSelected}
          data-cy="group-check-input"
        />
        <div className="select-option">{children}</div>
      </components.Option>
    );
  };
  const MultiValueRemove = (props) => {
    // Conditionally render the close icon
    if (props.data.groupType === 'default') {
      return null; // Do not render the close icon
    }
    return <components.MultiValueRemove {...props} />;
  };

  const MultiValue = (props) => (
    <components.MultiValue {...props}>
      <div className="selected-value">{props.data.name}</div>
    </components.MultiValue>
  );

  const selectStyles = {
    placeholder: (base) => ({
      ...base,
      fontSize: '12px',
      color: '#A0A0A0',
    }),
    indicatorSeparator: (base) => ({
      ...base,
      display: 'none',
    }),
    option: (base) => ({
      ...base,
      '.select-option': {
        margin: '0px 10px',
      },
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '270px',
    }),
    multiValue: (base) => ({
      ...base,
      borderRadius: '6px',
      backgroundColor: 'var(--slate3)',
      color: 'var(--slate11)',
      '.selected-value': {
        padding: '0px 6px 1px 3px',
        color: 'var(--slate11)',
      },
    }),
    valueContainer: (base) => ({
      ...base,
      display: '-webkit-box !important',
      overflow: 'auto !important',
      flexWrap: 'unset !important',
    }),
    multiValueRemove: (base, state) => ({
      ...base,
      '&:hover': {
        backgroundColor: 'var(--tomato3)',
        color: 'var(--tomato9)',
      },
      paddingLeft: '0px',
      ...(state.data.isFixed && { display: 'none' }),
    }),
    input: (base) => ({
      ...base,
      input: {
        height: '25px !important',
        color: 'var(--slate11) !important',
      },
    }),
    control: (base) => ({
      ...base,
      outline: 'none',
      border: '1px solid var(--slate7)',
      boxShadow: 'none',
      borderRadius: '6px',

      background: 'unset',
      '&:hover': {
        border: '1px solid var(--slate8)',
      },
    }),
    menu: (base) => ({
      ...base,
      background: 'var(--surfaces-app-bg-default)',
      '.add-group-btn': {
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '8px',
        borderTop: '1px solid var(--slate5)',
        '.create-group': {
          background: 'none !important',
          '.rectangle-add-icon': {
            width: '20px',
            height: '20px',
          },
        },
      },
    }),
  };

  return (
    <Select
      isMulti
      width={'100%'}
      isClearable={false}
      hasSearch={true}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      className={darkMode && 'theme-dark dark-theme'}
      formatGroupLabel={formatGroupLabel}
      components={{ Option: InputOption, MultiValue, MultiValueRemove, IndicatorSeparator: null }}
      {...props}
      styles={selectStyles}
      placeholder="Select user groups and role .."
      noOptionsMessage={() => 'No groups found'}
    />
  );
}
