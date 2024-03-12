import { getWorkspaceId } from '@/_helpers/utils';
import { ButtonSolid } from '@/_ui/AppButton/AppButton';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select, { components } from 'react-select';

export function UserGroupsSelect(props) {
  const navigate = useNavigate();
  const workspaceId = getWorkspaceId();
  const darkMode = localStorage.getItem('darkMode') === 'true';

  //Will be used when workspace routing settings have been merged
  const Menu = (props) => {
    return (
      <components.Menu {...props}>
        {props.children}
        <div className="add-group-btn">
          <ButtonSolid
            onClick={() => navigate(`/${workspaceId}/workspace-settings`)}
            iconCustomClass="rectangle-add-icon"
            className="create-group"
            fill="var(--indigo9)"
            variant="secondary"
            leftIcon="addrectangle"
          >
            Create new group
          </ButtonSolid>
        </div>
      </components.Menu>
    );
  };

  const InputOption = ({ getStyles, Icon, isDisabled, isFocused, isSelected, children, innerProps, ...rest }) => {
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
          style={{ width: '1.2rem', height: '1.2rem', borderRadius: '6px !important' }}
          type="checkbox"
          className="form-check-input"
          checked={isSelected}
          data-cy="group-check-input"
        />
        <div className="select-option">{children}</div>
      </components.Option>
    );
  };

  const MultiValue = (props) => (
    <components.MultiValue {...props}>
      <div className="selected-value">{props.data.name}</div>
    </components.MultiValue>
  );

  const selectStyles = {
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
      background: 'unset',
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
      components={{ Option: InputOption, MultiValue, IndicatorSeparator: null }}
      {...props}
      styles={selectStyles}
      placeholder="Select groups to add for this user"
      noOptionsMessage={() => 'No groups found'}
    />
  );
}
