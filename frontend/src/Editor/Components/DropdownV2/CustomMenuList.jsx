import React, { useEffect, useRef } from 'react';
import { components } from 'react-select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Loader from '@/ToolJetUI/Loader/Loader';
import './dropdownV2.scss';
// eslint-disable-next-line import/no-unresolved
import { useVirtualizer } from '@tanstack/react-virtual';
import cx from 'classnames';

const { MenuList } = components;

// This Menulist also used in MultiselectV2
const CustomMenuList = ({ selectProps, ...props }) => {
  const { onInputChange, onMenuInputFocus, optionsLoadingState, darkMode, inputValue, menuId, showSearchInput } =
    selectProps;

  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: props?.children?.length || 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 15,
  });

  useEffect(() => {
    const searchInput = document.querySelector('.dropdown-multiselect-widget-search-box');
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  return (
    <div
      id={`dropdown-multiselect-widget-custom-menu-list-${menuId}`}
      className={cx('dropdown-multiselect-widget-custom-menu-list', { 'theme-dark dark-theme': darkMode })}
      onClick={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      {showSearchInput && (
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
      )}
      {!optionsLoadingState && (
        <div
          ref={parentRef}
          className="dropdown-multiselect-widget-custom-menu-list-body"
          style={{
            maxHeight: selectProps.maxMenuHeight || 300,
          }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize() || 38}px`,
              position: 'relative',
              marginTop: '5px',
            }}
          >
            {!virtualizer.getTotalSize() && props.children}
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const option = props.options[virtualItem.index];
              const child = props.children[virtualItem.index];
              const isSelectAll = option?.value === 'multiselect-custom-menulist-select-all';
              return (
                <div
                  key={option.value}
                  style={{
                    position: isSelectAll ? 'sticky' : 'absolute',
                    width: '100%',
                    top: 0,
                    zIndex: isSelectAll && 10,
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
      )}
      {optionsLoadingState && (
        <div className="text-center py-4" style={{ minHeight: '188px' }}>
          <Loader style={{ zIndex: 3, position: 'absolute' }} width="36" />
        </div>
      )}
    </div>
  );
};

export default CustomMenuList;
