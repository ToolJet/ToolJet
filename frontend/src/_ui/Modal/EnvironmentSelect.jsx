import React, { useState } from 'react';
import Select, { components } from 'react-select';
import { OverlayTrigger, Tooltip as BSTooltip } from 'react-bootstrap';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { ToolTip } from '@/_components/ToolTip';
import { useLicenseStore } from '@/_stores/licenseStore';
import './appSelect.theme.scss';

const ENVIRONMENT_OPTIONS = [
  { label: 'Development', value: 'canAccessDevelopment', key: 'canAccessDevelopment' },
  { label: 'Staging', value: 'canAccessStaging', key: 'canAccessStaging' },
  { label: 'Production', value: 'canAccessProduction', key: 'canAccessProduction' },
  { label: 'Released app', value: 'canAccessReleased', key: 'canAccessReleased' },
];

const isMultiEnvironmentOnly = (value) => value === 'canAccessStaging' || value === 'canAccessProduction';

export function MultiEnvironmentPaidIcon() {
  const licenseStatus = useLicenseStore((state) => state.featureAccess?.licenseStatus);
  const isLicenseValid = !!licenseStatus?.isLicenseValid && !licenseStatus?.isExpired;
  return (
    <ToolTip
      message={
        isLicenseValid
          ? 'Multi-environments are not included in your current plan'
          : 'Multi-environments are available only in paid plans'
      }
      placement="top"
    >
      <span className="d-inline-flex" data-cy="multi-environment-upgrade-icon">
        <SolidIcon name="premium-plan" width="16" height="16" />
      </span>
    </ToolTip>
  );
}

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
    // Only disable non-released environments for end-users in basic/starter plans (without valid license)
    // In paid plans, end-users can access all environments
    const isPaidEnvironment = props.isMultiEnvironmentRestricted && isMultiEnvironmentOnly(rest.data.value);
    const shouldDisable =
      isDisabled || (isEndUserGroup && isBuilderOnlyEnvironment && props.isBasicPlan) || isPaidEnvironment;

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
        <div className="select-option d-flex align-items-center" style={{ gap: '4px' }}>
          {children}
          {isPaidEnvironment && <MultiEnvironmentPaidIcon />}
        </div>
      </components.Option>
    );
  };

  const MultiValue = (props) => {
    // Always render a MultiValue node. If this is the special "All environments"
    // option (marked by `isAllField`) we style it with the required
    // background and text color.
    const { data } = props;
    if (data?.isAllField) {
      return (
        <components.MultiValue {...props}>
          <div className="selected-value" style={{ color: 'var(--text-default) !important' }}>
            {data.label}
          </div>
        </components.MultiValue>
      );
    }

    return (
      <components.MultiValue {...props}>
        <div className="selected-value">{props.data.label}</div>
      </components.MultiValue>
    );
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
    multiValue: (base, state) => ({
      ...base,
      borderRadius: '6px',
      backgroundColor: 'var(--interactive-default) !important',
      color: state?.data?.isAllField ? 'var(--text-default) !important' : 'var(--slate12)',
      '.selected-value': {
        padding: '0px 6px 1px 3px',
        color: state?.data?.isAllField ? 'var(--text-default) !important' : 'var(--slate12)',
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
      ...((state.data.isFixed || state.selectProps.isDisabled) && { display: 'none' }),
    }),
    input: (base) => ({
      ...base,
      input: {
        height: '25px !important',
        color: 'var(--slate11) !important',
      },
    }),
    control: (base, state) => ({
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
      ...(state.isDisabled && {
        // opacity: 0.3,
        cursor: 'not-allowed',
        pointerEvents: 'all',
        /* Keep the disabled input background as the switch/tag control variable. */
        backgroundColor: 'var(--Controls-switch-tag, #CCD1D54D) !important',
        border: '1px solid var(--slate6)',
      }),
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

        if (props.allowSelectAll && selected.length > 0 && isSelectAllPresentInSelection && !isCurrentSelectAll) {
          if (props.value.find((env) => env?.isAllField)?.isAllField)
            props.onChange(selected.filter((env) => !env?.isAllField));

          // For end-user groups in basic/starter plans, only select released environment when "All environments" is clicked
          // In paid plans, end-users can select all environments
          if (isEndUserGroup && props.isBasicPlan) {
            const releasedEnvironmentOnly = props.options.filter((env) => env.value === 'canAccessReleased');
            return props.onChange([...releasedEnvironmentOnly, props.allOption]);
          }

          // Without multi-environments, "All" must not grant staging/production that weren't already granted
          const selectableOptions = props.isMultiEnvironmentRestricted
            ? props.options.filter(
                (env) => !isMultiEnvironmentOnly(env.value) || props.value.some((v) => v?.value === env.value)
              )
            : props.options;
          return props.onChange([...selectableOptions, props.allOption]);
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
