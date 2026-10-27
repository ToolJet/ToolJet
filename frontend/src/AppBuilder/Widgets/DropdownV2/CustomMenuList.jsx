import React, { useEffect, useRef } from 'react';
import { components } from 'react-select';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import Loader from '@/ToolJetUI/Loader/Loader';
import './dropdownV2.scss';
import cx from 'classnames';
import { WindowedList } from '@/AppBuilder/_engines/rendering/WindowedList';

const { MenuList } = components;

const SELECT_ALL = 'multiselect-custom-menulist-select-all';
const OPTION_HEIGHT = 40;

// This Menulist also used in MultiselectV2
const CustomMenuList = ({ selectProps, ...props }) => {
  const {
    onInputChange,
    onMenuInputFocus,
    optionsLoadingState,
    darkMode,
    inputValue,
    menuId,
    showSearchInput,
    menuBackgroundColor,
    menuWidthStyle,
    placeholderTextColor,
    iconColor,
  } = selectProps;

  const parentRef = useRef(null);
  // The options react-select renders (the ones the search keeps): only those in view are mounted.
  const optionCount = props?.children?.length || 0;

  useEffect(() => {
    const searchInput = document.querySelector('.dropdown-multiselect-widget-search-box');
    if (searchInput) {
      searchInput.focus();
    }
  }, []);

  const firstSelectedIndex = props?.options?.findIndex(
    (opt) => opt.value === (Array.isArray(selectProps?.value) ? selectProps.value[0]?.value : selectProps.value?.value)
  );
  const shouldOverridePlaceholderTextColor =
    typeof placeholderTextColor === 'string' &&
    placeholderTextColor.length > 0 &&
    placeholderTextColor !== 'var(--cc-placeholder-text)';
  const shouldUsePlaceholderTextColorForSearchIcon =
    shouldOverridePlaceholderTextColor &&
    (!iconColor || iconColor === 'var(--cc-default-icon)' || iconColor === '#CFD3D859');
  const searchIconColor = shouldUsePlaceholderTextColorForSearchIcon ? placeholderTextColor : 'var(--cc-default-icon)';

  const focusedIndex = optionCount ? props.children.findIndex((child) => child?.props?.isFocused) : -1;
  // "Select all" stays at the top while the options scroll.
  const selectAllIndex = optionCount && props.children[0]?.props?.data?.value === SELECT_ALL ? 0 : null;

  return (
    <div
      id={`dropdown-multiselect-widget-custom-menu-list-${menuId}`}
      className={cx('dropdown-multiselect-widget-custom-menu-list', { 'theme-dark dark-theme': darkMode })}
      onClick={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      style={{
        ...(/iPad|iPhone|iPod/.test(navigator.userAgent) && { fontSize: '16px' }),
        '--dropdown-menu-bg': menuBackgroundColor || 'var(--cc-surface1-surface)',
        ...(menuWidthStyle || {}),
      }}
    >
      {showSearchInput && (
        <div className="dropdown-multiselect-widget-search-box-wrapper">
          <span>
            <SolidIcon name="search01" width="14" fill={searchIconColor} />
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
            style={shouldOverridePlaceholderTextColor ? { '--cc-placeholder-text': placeholderTextColor } : undefined}
          />
        </div>
      )}
      {!optionsLoadingState && (
        <div
          ref={parentRef}
          className="dropdown-multiselect-widget-custom-menu-list-body"
          style={{
            maxHeight: selectProps.maxMenuHeight || 300,
            ...(menuWidthStyle || {}),
          }}
        >
          {optionCount ? (
            <WindowedList
              count={optionCount}
              scrollRef={parentRef}
              itemHeight={OPTION_HEIGHT}
              overscan={15 * OPTION_HEIGHT}
              measure
              getItemKey={(index) => props.children[index]?.key ?? index}
              stickyIndex={selectAllIndex}
              initialIndex={selectProps?.menuIsOpen ? firstSelectedIndex : -1}
              focusedIndex={focusedIndex}
              style={{ marginTop: '5px' }}
              renderItem={(index) => (
                <MenuList {...props} selectProps={selectProps}>
                  <div>{props.children[index]}</div>
                </MenuList>
              )}
            />
          ) : (
            <div style={{ height: '38px', position: 'relative', marginTop: '5px' }}>{props.children}</div>
          )}
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
