import React, { useRef } from 'react';
import { components } from 'react-select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Loader from '@/ToolJetUI/Loader/Loader';
import './dropdownV2.scss';
import { FormCheck } from 'react-bootstrap';
// eslint-disable-next-line import/no-unresolved
import { useVirtualizer } from '@tanstack/react-virtual';
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

  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: props?.children?.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 15,
  });

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
      <div
        ref={parentRef}
        style={{
          maxHeight: selectProps.maxMenuHeight || 300,
          overflowY: 'auto',
          position: 'relative',
          marginTop: '5px',
          marginBottom: '5px',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize() || 38}px`,
            position: 'relative',
          }}
        >
          {!virtualizer.getTotalSize() && props.children}
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const option = props.options[virtualItem.index];
            const child = props.children[virtualItem.index];
            return (
              <div
                key={option.value}
                style={{
                  position: 'absolute',
                  width: '100%',
                  top: 0,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                data-index={virtualItem.index}
                ref={virtualizer.measureElement}
              >
                <MenuList {...props} selectProps={selectProps}>
                  <div>{child}</div>
                </MenuList>
              </div>
            );
          })}
        </div>
      </div>
      {optionsLoadingState && (
        <div className="text-center py-4" style={{ minHeight: '188px' }}>
          <Loader style={{ zIndex: 3, position: 'absolute' }} width="36" />
        </div>
      )}
    </div>
  );
};

export default CustomMenuList;
