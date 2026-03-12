import React, { useState } from 'react';
import Select, { components } from 'react-select';
import { OverlayTrigger, Tooltip as BSTooltip } from 'react-bootstrap';
import './appSelect.theme.scss';

const ENVIRONMENT_OPTIONS = [
  { label: 'Development', value: 'canAccessDevelopment', key: 'canAccessDevelopment' },
  { label: 'Staging', value: 'canAccessStaging', key: 'canAccessStaging' },
  { label: 'Production', value: 'canAccessProduction', key: 'canAccessProduction' },
  { label: 'Released app', value: 'canAccessReleased', key: 'canAccessReleased' },
];

export function EnvironmentSelect(props) {
  const darkMode = localStorage.getItem('darkMode') === 'true';

  const InputOption = ({ getStyles, Icon, isDisabled, isFocused, isSelected, children, innerProps, ...rest }) => {
    const [isActive, setIsActive] = useState(false);
    const onMouseDown = () => setIsActive(true);
    const onMouseUp = () => setIsActive(false);
    const onMouseLeave = () => setIsActive(false);

    // Check if this is an end-user group (either default end-user or custom group with isBuilderLevel=false)
    // For custom groups, also check if the group contains any end-user role users
    const isEndUserGroup =
      props.groupName?.toLowerCase() === 'end-user' || props.isBuilderLevel === false || props.hasEndUsers === true;
    const isBuilderOnlyEnvironment =
      rest.data.value === 'canAccessProduction' ||
      rest.data.value === 'canAccessDevelopment' ||
      rest.data.value === 'canAccessStaging';
    const shouldDisable = isDisabled || (isEndUserGroup && isBuilderOnlyEnvironment);

    const style = {
      alignItems: 'center',
      backgroundColor: 'transparent',
      color: 'inherit',
      display: 'flex ',
    };

    const innerPropsWithHandlers = {
      ...innerProps,
      onMouseDown,
      onMouseUp,
      onMouseLeave,
      style,
    };

    if (isEndUserGroup && isBuilderOnlyEnvironment) {
      return (
        <OverlayTrigger
          placement="left"
          overlay={
            <BSTooltip id={`tooltip-builder-env-${rest.data.value}`}>End-users can only access released apps</BSTooltip>
          }
        >
          <div style={{ width: '100%' }}>
            <components.Option
              {...rest}
              isDisabled={shouldDisable}
              isFocused={isFocused}
              isSelected={isSelected}
              getStyles={getStyles}
              innerProps={innerPropsWithHandlers}
              className={shouldDisable && 'disabled'}
            >
              <input
                style={{ width: '1.2rem', height: '1.2rem', borderRadius: '6px !important' }}
                type="checkbox"
                className="form-check-input"
                checked={isSelected}
                disabled={shouldDisable}
                data-cy={`environment-check-${rest.data.value}`}
              />
              <div className="select-option">{children}</div>
            </components.Option>
          </div>
        </OverlayTrigger>
      );
    }

    return (
      <components.Option
        {...rest}
        isDisabled={shouldDisable}
        isFocused={isFocused}
        isSelected={isSelected}
        getStyles={getStyles}
        innerProps={innerPropsWithHandlers}
        className={shouldDisable && 'disabled'}
      >
        <input
          style={{ width: '1.2rem', height: '1.2rem', borderRadius: '6px !important' }}
          type="checkbox"
          className="form-check-input"
          checked={isSelected}
          disabled={shouldDisable}
          data-cy={`environment-check-${rest.data.value}`}
        />
        <div className="select-option">{children}</div>
      </components.Option>
    );
  };

  const MultiValue = (props) => {
    if (!props.data?.isAllField) {
      return (
        <components.MultiValue {...props}>
          <div className="selected-value">{props.data.label}</div>
        </components.MultiValue>
      );
    }
  };

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
      backgroundColor: 'var(--interactive-default)',
      color: 'var(--slate12)',
      '.selected-value': {
        padding: '0px 6px 1px 3px',
        color: 'var(--slate12)',
        fontSize: '12px',
        fontWeight: 500,
      },
    }),
    multiValueRemove: (base, state) => ({
      ...base,
      color: 'var(--icon-strong)',
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
      minHeight: '32px',
      '&:hover': {
        border: '1px solid var(--slate8)',
      },
    }),
    menuList: (base) => ({
      ...base,
      maxHeight: '200px',
    }),
    menu: (base) => ({
      ...base,
      background: 'var(--slate1)',
    }),
  };

  return (
    <Select
      isDisabled={props.disabled}
      isMulti
      width={'100%'}
      isClearable={false}
      hasSearch={true}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      className={darkMode && 'theme-dark dark-theme'}
      components={{ Option: InputOption, MultiValue, IndicatorSeparator: null }}
      {...props}
      onChange={(selected) => {
        const isCurrentSelectAll = props.value.find((env) => env?.isAllField)?.isAllField;
        const isSelectAllPresentInSelection = selected.find((env) => env?.isAllField)?.isAllField;
        // Check if this is an end-user group (matches the same logic used for disabling options)
        const isEndUserGroup =
          props.groupName?.toLowerCase() === 'end-user' || props.isBuilderLevel === false || props.hasEndUsers === true;

        if (
          props.allowSelectAll &&
          selected !== null &&
          selected.length > 0 &&
          isSelectAllPresentInSelection &&
          !isCurrentSelectAll
        ) {
          if (props.value.find((env) => env?.isAllField)?.isAllField)
            props.onChange(selected.filter((env) => !env?.isAllField));

          // For end-user groups, only select released environment when "All environments" is clicked
          if (isEndUserGroup) {
            const releasedEnvironmentOnly = props.options.filter((env) => env.value === 'canAccessReleased');
            return props.onChange([...releasedEnvironmentOnly, props.allOption]);
          }

          return props.onChange([...props.options, props.allOption]);
        }
        if (isCurrentSelectAll && !isSelectAllPresentInSelection) return props.onChange([]);
        return props.onChange(selected.filter((env) => !env?.isAllField));
      }}
      options={[props.allowSelectAll ? props.allOption : null, ...props.options]}
      styles={selectStyles}
      placeholder="Select environments..."
      noOptionsMessage={() => 'No environments found'}
    />
  );
}

EnvironmentSelect.defaultProps = {
  allOption: {
    label: 'All environments',
    value: '*',
    isAllField: true,
  },
  options: ENVIRONMENT_OPTIONS,
};

export { ENVIRONMENT_OPTIONS };
