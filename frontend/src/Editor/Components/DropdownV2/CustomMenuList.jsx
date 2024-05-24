import React from 'react';
import { components } from 'react-select';
import cx from 'classnames';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import './dropdownV2.scss';

const { MenuList } = components;

const CustomMenuList = ({ optionsLoadingState, darkMode, selectProps, inputRef, ...props }) => {
  const { onInputChange, inputValue, onMenuInputFocus } = selectProps;

  return (
    <div className={cx({ 'dark-theme theme-dark': darkMode })}>
      <div className="dropdown-widget-custom-menu-list" onClick={(e) => e.stopPropagation()}>
        <div className="dropdown-widget-search-box-wrapper">
          {!inputValue && (
            <span className="">
              <SolidIcon name="search" width="14" />
            </span>
          )}
          <input
            autoCorrect="off"
            autoComplete="off"
            spellCheck="false"
            type="text"
            value={inputValue}
            onChange={(e) =>
              onInputChange(e.currentTarget.value, {
                action: 'input-change',
              })
            }
            onMouseDown={(e) => {
              e.stopPropagation();
              e.target.focus();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.target.focus();
            }}
            onFocus={onMenuInputFocus}
            placeholder="Search..."
            className="dropdown-widget-search-box"
            ref={inputRef} // Assign the ref to the input search box
          />
        </div>
        <MenuList {...props} selectProps={selectProps}>
          {optionsLoadingState ? (
            <div class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="sr-only"></span>
              </div>
            </div>
          ) : (
            props.children
          )}
        </MenuList>
      </div>
    </div>
  );
};

export default CustomMenuList;
