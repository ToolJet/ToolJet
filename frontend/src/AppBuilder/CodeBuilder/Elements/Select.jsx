import React from 'react';
import SelectComponent from '@/_ui/Select';
import { components } from 'react-select';
import Check from '@/_ui/Icon/solidIcons/Check';
import Icon from '@/_ui/Icon/solidIcons/index';
import { DeprecatedColumnTooltip } from '@/AppBuilder/RightSideBar/Inspector/Components/Table/ColumnManager/DeprecatedColumnTypeMsg';
import { checkIfInputWidgetTypeIsDeprecated } from '@/AppBuilder/Widgets/BaseComponents/hooks/useInput';
import { checkIfStarRatingLabelTypeIsDeprecated } from '@/AppBuilder/Widgets/Rating/Rating';

// An option of a generic inspector select is marked only for the deprecated styles below. A Table column type's
// deprecation is marked by the Table's own column-type field (ColumnTypeOption): read from any option's raw value here,
// it marked a UI 2.0 Button's Variant "Default" (value 'default') as a "Deprecating column type".
export const Option = (props) => {
  const isDeprecatedStyle =
    checkIfInputWidgetTypeIsDeprecated(props.value) || checkIfStarRatingLabelTypeIsDeprecated(props.value);

  // A theme menu (some options carry a hint): every row, Custom included, gets the check slot so names line up.
  const hinted = props.selectProps?.options?.some((option) => option.hint);

  return (
    <components.Option {...props}>
      <DeprecatedColumnTooltip isDeprecatedStyle={isDeprecatedStyle}>
        {/* Full width only in theme menus, so other selects (Font Weight, ...) look as before. */}
        <div
          className="d-flex justify-content-between align-items-center"
          style={hinted ? { width: '100%', gap: 16 } : undefined}
        >
          {hinted ? (
            // A check slot every row keeps before the name, so names (and the muted detail, e.g. a theme radius'
            // "4px", on the right) line up whether or not the row is selected.
            <>
              <span className="d-flex align-items-center" style={{ gap: 8, whiteSpace: 'nowrap' }}>
                <span className="d-flex" style={{ width: 20, flexShrink: 0 }}>
                  {/* The icon's path is drawn on a 20 x 20 grid; its default 8 x 8 viewBox leaves it blank. */}
                  {props.isSelected && <Check width={'20'} viewBox="0 0 20 20" fill={'#3E63DD'} />}
                </span>
                {props.label}
              </span>
              {props.data?.hint && (
                <span style={{ whiteSpace: 'nowrap', color: 'var(--text-placeholder)' }}>{props.data.hint}</span>
              )}
            </>
          ) : (
            <>
              <span>{props.label}</span>
              {props.isSelected && (
                <span>
                  <Check width={'20'} fill={'#3E63DD'} />
                </span>
              )}
            </>
          )}
          {isDeprecatedStyle && (
            <span>
              <Icon name={'warning'} height={16} width={16} fill="#DB4324" />
            </span>
          )}
        </div>
      </DeprecatedColumnTooltip>
    </components.Option>
  );
};

// `wideMenu`: options carry a hint (a theme radius / shadow value): the menu fits its content instead of the field's
// 144px, anchored to the field's right edge so it opens over the inspector rather than off-screen.
const selectCustomStyles = (width, wideMenu = false) => {
  return {
    ...(wideMenu && {
      menu: (base) => ({ ...base, width: 'max-content', minWidth: '100%', right: 0, left: 'auto' }),
    }),
    control: (base, state) => {
      return {
        ...base,
        border: state.isFocused ? '1px solid #3E63DD' : '1px solid #cccccc',
        boxShadow: state.isFocused ? '0px 0px 6px #3E63DD' : 'none',
        backgroundColor: state.isFocused ? 'var(--indigo2)' : 'var(--base)',
        '&:hover': {
          border: '1px solid #3E63DD !important',
          boxShadow: '0px 0px 6px #3E63DD',
        },
        borderRadius: '6px',
        width: width,
        minHeight: '32px',
        color: 'var(--slate12)',
      };
    },

    dropdownIndicator: (base) => ({
      ...base,
      padding: '4px',
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? '#F0F4FF !important' : 'white',
      color: '#11181C',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
    }),
    singleValue: (provided) => ({
      ...provided,
      paddingLeft: '0px',
      color: 'var(--slate12)',
    }),
    // The menu is portaled to <body>; above a popover (1060) so a select opened inside one is not hidden behind it.
    menuPortal: (base) => ({ ...base, zIndex: 2000, pointerEvents: 'auto' }),
  };
};

// An optional leading icon in the closed field (meta.leadingIcon), e.g. the theme radius / shadow fields.
const withLeadingIcon = (icon) => (props) => (
  <components.SingleValue {...props}>
    <span className="d-flex align-items-center gap-1">
      {icon}
      {props.children}
    </span>
  </components.SingleValue>
);

// Theme selects (options with a hint) are taller than the room below a field near the inspector's foot. Measured
// against the window (fixed) and needing the full menu below, react-select opens them upwards when they do not fit
// instead of running off-screen.
const HINTED_MENU_HEIGHT = 250;

export const Select = ({ value, onChange, meta, width = '144px' }) => {
  const hinted = meta?.options?.some((option) => option.hint);
  return (
    <div
      className="row fx-container"
      data-cy={`dropdown-${
        meta?.displayName ? String(meta?.displayName).toLowerCase().replace(/\s+/g, '-') : 'common'
      }`}
    >
      <div className="field" onClick={(e) => e.stopPropagation()}>
        <SelectComponent
          options={meta.options}
          value={value}
          hasSearch={true}
          onChange={onChange}
          width={224}
          height={32}
          styles={selectCustomStyles(width, hinted)}
          {...(hinted && {
            menuPosition: 'fixed',
            minMenuHeight: HINTED_MENU_HEIGHT,
            maxMenuHeight: HINTED_MENU_HEIGHT,
          })}
          useCustomStyles={true}
          customClassPrefix="inspector-select"
          aria-label={meta?.displayName}
          components={{
            IndicatorSeparator: () => null,
            Option,
            ...(meta?.leadingIcon && { SingleValue: withLeadingIcon(meta.leadingIcon) }),
          }}
        />
      </div>
    </div>
  );
};
