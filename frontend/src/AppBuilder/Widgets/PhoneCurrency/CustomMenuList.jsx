import React from 'react';
import { components } from 'react-select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import cx from 'classnames';

export const CustomMenuList = (props) => {
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
