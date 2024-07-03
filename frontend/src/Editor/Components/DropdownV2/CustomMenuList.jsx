import React from 'react';
import { components } from 'react-select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Loader from '@/ToolJetUI/Loader/Loader';
import './dropdownV2.scss';
import { FormCheck } from 'react-bootstrap';
import cx from 'classnames';

const { MenuList } = components;

// This Menulist also used in MultiselectV2
const CustomMenuList = ({ selectProps, ...props }) => {
  const {
    onInputChange,
    onMenuInputFocus,
    showAllOption,
    isSelectAllSelected,
    optionsLoadingState,
    darkMode,
    setSelected,
    setIsSelectAllSelected,
    fireEvent,
    inputValue,
    menuId,
  } = selectProps;

  const handleSelectAll = (e) => {
    e.target.checked && fireEvent();
    if (e.target.checked) {
      setSelected(props.options);
    } else {
      setSelected([]);
    }
    setIsSelectAllSelected(e.target.checked);
  };
  return (
    <div
      id={`dropdown-multiselect-widget-custom-menu-list-${menuId}`}
      className={cx('dropdown-multiselect-widget-custom-menu-list', { 'theme-dark dark-theme': darkMode })}
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
          placeholder="Search"
          className="dropdown-multiselect-widget-search-box"
        />
      </div>
      {showAllOption && !optionsLoadingState && (
        <label htmlFor="select-all-checkbox" className="multiselect-custom-menulist-select-all">
          <FormCheck id="select-all-checkbox" checked={isSelectAllSelected} onChange={handleSelectAll} />
          <span style={{ marginLeft: '4px' }}>Select all</span>
        </label>
      )}
      <MenuList {...props} selectProps={selectProps}>
        {optionsLoadingState ? (
          <div class="text-center py-4" style={{ minHeight: '188px' }}>
            <Loader style={{ zIndex: 3, position: 'absolute' }} width="36" />
          </div>
        ) : (
          props.children
        )}
      </MenuList>
    </div>
  );
};

export default CustomMenuList;
