import React from 'react';
import { components } from 'react-select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Loader from '@/ToolJetUI/Loader/Loader';
import './dropdownV2.scss';
import { FormCheck } from 'react-bootstrap';
import cx from 'classnames';

const { MenuList } = components;

// This Menulist also used in Multiselect
const CustomMenuList = ({ selectProps, ...props }) => {
  const {
    onInputChange,
    searchInputValue,
    onMenuInputFocus,
    showAllOption,
    isSelectAllSelected,
    optionsLoadingState,
    darkMode,
    setSelected,
    setIsSelectAllSelected,
  } = selectProps;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelected(props.options);
    } else {
      setSelected([]);
    }
    setIsSelectAllSelected(e.target.checked);
  };

  return (
    <div
      className={cx('dropdown-multiselect-widget-custom-menu-list', { 'theme-dark dark-theme': darkMode })}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="dropdown-multiselect-widget-search-box-wrapper">
        {!searchInputValue && (
          <span className="">
            <SolidIcon name="search01" width="14" />
          </span>
        )}
        <input
          autoCorrect="off"
          autoComplete="off"
          spellCheck="false"
          type="text"
          value={searchInputValue}
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
        <div className="multiselect-custom-menulist-select-all">
          <FormCheck checked={isSelectAllSelected} onChange={handleSelectAll} />
          <span style={{ marginLeft: '4px' }}>Select all</span>
        </div>
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
