import React, { useEffect, useLayoutEffect, useState, useMemo, useRef } from 'react';
import cx from 'classnames';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { useCalculateOverflow } from './hooks/useCalculateOverflow';
import { findItemById, findParentGroup } from './utils';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import './navigation.scss';

// Render individual nav item - uses tj-list-item class like page navigation
const RenderNavItem = ({
  item,
  isSelected,
  onItemClick,
  displayStyle,
}) => {
  const isVisible = typeof item.visible === 'object' ? item.visible.value !== '{{true}}' : item.visible !== true;
  const isDisabled = typeof item.disable === 'object'
    ? item.disable.value === '{{true}}' || item.disable.value === true
    : item.disable === true;

  if (!isVisible) return null;

  const showIcon = displayStyle !== 'textOnly' && item.iconVisibility !== false;
  const showLabel = displayStyle !== 'iconOnly';

  const iconColor = isSelected ? 'var(--selected-nav-item-icon-color)' : 'var(--nav-item-icon-color)';

  return (
    <button
      className={cx('tj-list-item', {
        'tj-list-item-selected': isSelected,
        'tj-list-item-disabled': isDisabled,
      })}
      onClick={() => !isDisabled && onItemClick(item)}
      disabled={isDisabled}
      aria-label={item.label}
      data-cy={`nav-item-${item.id}`}
    >
      {showIcon && (
        <div className="custom-icon" data-cy={`nav-icon-${item.id}`}>
          <TablerIcon
            iconName={item.icon?.value || item.icon}
            fallbackIcon="IconFile"
            color={iconColor}
            style={{
              width: '16px',
              height: '16px',
              color: iconColor,
              stroke: iconColor,
            }}
          />
        </div>
      )}
      {showLabel && (
        <div className="page-name" data-cy={`nav-label-${item.id}`}>
          {item.label}
        </div>
      )}
    </button>
  );
};

// Render nav group (collapsible) - uses page-group-wrapper class like page navigation
const RenderNavGroup = ({
  group,
  selectedItemId,
  onItemClick,
  styles,
  displayStyle,
  orientation,
  darkMode,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isVisible = typeof group.visible === 'object' ? group.visible.value !== '{{true}}' : group.visible !== true;
  const isDisabled = typeof group.disable === 'object'
    ? group.disable.value === '{{true}}' || group.disable.value === true
    : group.disable === true;

  if (!isVisible) return null;

  const showIcon = displayStyle !== 'textOnly' && group.iconVisibility !== false;
  const showLabel = displayStyle !== 'iconOnly';

  // Deduplicate children by ID
  const deduplicatedChildren = useMemo(() => {
    if (!group.children) return [];
    const seenIds = new Set();
    return group.children.filter((child) => {
      if (seenIds.has(child.id)) return false;
      seenIds.add(child.id);
      return true;
    });
  }, [group.children]);

  // Check if any child is selected
  const hasSelectedChild = deduplicatedChildren.some((child) => child.id === selectedItemId);

  const TriggerBody = () => (
    <div className="group-info">
      {showIcon && (
        <div className="custom-icon">
          <TablerIcon
            iconName={group.icon?.value || group.icon}
            fallbackIcon="IconFolder"
            style={{
              width: '16px',
              height: '16px',
            }}
          />
        </div>
      )}
      {showLabel && (
        <div className="page-name">
          {group.label}
        </div>
      )}
    </div>
  );

  // For horizontal orientation, use NavigationMenu dropdown
  if (orientation === 'horizontal') {
    return (
      <NavigationMenuItem key={group.id}>
        <NavigationMenuTrigger
          indicator={false}
          className={cx('page-group-wrapper', {
            'page-group-selected': hasSelectedChild,
          })}
          disabled={isDisabled}
          aria-label={group.label}
          data-cy={`nav-group-${group.id}`}
        >
          <TriggerBody />
          <TablerIcon
            iconName="IconChevronUp"
            size={16}
            className="nav-chevron cursor-pointer tw-flex-shrink-0 tw-transition tw-duration-200 group-data-[state=closed]:tw-rotate-180"
          />
        </NavigationMenuTrigger>
        <NavigationMenuContent className={cx('!tw-min-w-full page-menu-popup', { 'dark-theme': darkMode })}>
          {deduplicatedChildren.map((child) => (
            <RenderNavItem
              key={child.id}
              item={child}
              isSelected={child.id === selectedItemId}
              onItemClick={onItemClick}
              styles={styles}
              displayStyle={displayStyle}
              orientation={orientation}
              isNested={true}
            />
          ))}
        </NavigationMenuContent>
      </NavigationMenuItem>
    );
  }

  // For vertical orientation, use accordion-style expansion
  return (
    <div
      key={group.id}
      className={cx('accordion-item', { 'dark-theme': darkMode })}
      data-cy={`nav-group-${group.id}`}
    >
      <button
        className={cx('tw-group page-group-wrapper', {
          'page-group-selected': hasSelectedChild,
        })}
        onClick={(e) => {
          e.stopPropagation();
          if (!isDisabled) setIsExpanded(!isExpanded);
        }}
        disabled={isDisabled}
        data-state={isExpanded ? 'open' : 'closed'}
        aria-label={group.label}
        aria-expanded={isExpanded}
      >
        <TriggerBody />
        <TablerIcon
          iconName="IconChevronUp"
          size={16}
          className="nav-chevron cursor-pointer tw-flex-shrink-0 tw-transition tw-duration-200 group-data-[state=closed]:tw-rotate-180"
        />
      </button>
      <div className={cx('accordion-body', { expanded: isExpanded, collapsed: !isExpanded })}>
        <div className="accordion-content">
          {deduplicatedChildren.map((child) => (
            <RenderNavItem
              key={child.id}
              item={child}
              isSelected={child.id === selectedItemId}
              onItemClick={onItemClick}
              styles={styles}
              displayStyle={displayStyle}
              orientation={orientation}
              isNested={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export const Navigation = function Navigation(props) {
  const {
    id,
    width,
    properties,
    styles,
    fireEvent,
    dataCy,
    setExposedVariable,
    setExposedVariables,
    darkMode,
    currentMode,
  } = props;

  const {
    orientation,
    displayStyle,
    loadingState,
    disabledState,
    visibility,
    horizontalAlignment = 'left',
    verticalAlignment = 'top',
  } = properties;

  const {
    backgroundColor = 'var(--cc-surface1-surface)',
    borderColor = 'var(--cc-weak-border)',
    borderRadius = 8,
    padding = 8,
    unselectedTextColor,
    hoverPillBackgroundColor,
    pillBorderRadius = 6,
  } = styles || {};

  // Get menu items from component definition
  const menuItems = properties.menuItems || [];

  // Refs for overflow calculation
  const containerRef = useRef(null);
  const measurementContainerRef = useRef(null);

  // State
  const [selectedItemId, setSelectedItemId] = useState(null);
  const selectedItemRef = useRef(null);
  const selectItemRef = useRef(null);

  // Local state bridge for exposed variables — allows both prop changes (sidebar)
  // and action calls (setVisibility/setLoading) to drive rendering
  const [exposedVariablesTemporaryState, setExposedVariablesTemporaryState] = useState({
    isLoading: loadingState,
    isVisible: visibility,
  });

  const updateExposedVariablesState = (key, value) => {
    setExposedVariablesTemporaryState((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  // Deduplicate and filter visible menu items
  const visibleMenuItems = useMemo(() => {
    const seenIds = new Set();
    const deduplicatedItems = [];

    // First deduplicate by ID
    for (const item of menuItems) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        deduplicatedItems.push(item);
      }
    }

    // Then filter by visibility
    return deduplicatedItems.filter((item) => {
      const isVisible = typeof item.visible === 'object' ? item.visible.value !== '{{true}}' : item.visible !== true;
      return isVisible;
    });
  }, [menuItems]);

  // Overflow calculation for horizontal orientation
  const links = useCalculateOverflow({
    containerRef,
    measurementContainerRef,
    visibleMenuItems,
    orientation,
    padding,
    width,
  });

  // Shared selection logic — updates exposed variables and ref
  const applySelection = (item) => {
    const parentGroup = findParentGroup(menuItems, item.id);
    const index = menuItems.findIndex((mi) => mi.id === item.id);

    const clickData = {
      id: item.id,
      label: item.label,
      index: index !== -1 ? index : null,
      groupId: parentGroup?.id || null,
      groupLabel: parentGroup?.label || null,
    };

    const previousSelected = selectedItemRef.current;
    selectedItemRef.current = clickData;

    setSelectedItemId(item.id);
    setExposedVariable('selectedItem', clickData);
    setExposedVariable('previousSelectedItem', previousSelected);
  };

  // Handle item click
  const handleItemClick = (item) => {
    if (disabledState) return;
    applySelection(item);
    fireEvent('onClick');
  };

  // Actions
  const selectItem = (itemId) => {
    const item = findItemById(menuItems, itemId);
    if (item && !item.isGroup) {
      applySelection(item);
    }
  };

  // Keep ref in sync so the mount-time useEffect closure always calls the latest version
  selectItemRef.current = selectItem;

  // Effects for syncing exposed variables
  useBatchedUpdateEffectArray([
    {
      dep: loadingState,
      sideEffect: () => {
        setExposedVariable('isLoading', loadingState);
        updateExposedVariablesState('isLoading', loadingState);
      },
    },
    {
      dep: visibility,
      sideEffect: () => {
        setExposedVariable('isVisible', visibility);
        updateExposedVariablesState('isVisible', visibility);
      },
    },
    {
      dep: disabledState,
      sideEffect: () => {
        setExposedVariable('isDisabled', disabledState);
      },
    },
  ]);

  // Initialize exposed variables
  useEffect(() => {
    const exposedVariables = {
      selectedItem: null,
      previousSelectedItem: null,
      isDisabled: disabledState,
      isVisible: visibility,
      isLoading: loadingState,
      setDisable: async function (value) {
        setExposedVariable('isDisabled', !!value);
      },
      setVisibility: async function (value) {
        setExposedVariable('isVisible', !!value);
        updateExposedVariablesState('isVisible', !!value);
      },
      setLoading: async function (value) {
        setExposedVariable('isLoading', !!value);
        updateExposedVariablesState('isLoading', !!value);
      },
      selectItem: async function (itemId) {
        selectItemRef.current(itemId);
      },
    };

    setExposedVariables(exposedVariables);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nav item styles (CSS custom properties) - matches page navigation computedStyles
  const navItemStyles = useMemo(() => ({
    '--nav-item-label-color': unselectedTextColor || 'var(--text-placeholder, #6A727C)',
    '--nav-item-icon-color': styles.unselectedIconColor || 'var(--cc-default-icon, #6A727C)',
    '--selected-nav-item-label-color': styles.selectedTextColor || 'var(--cc-primary-text, #1B1F24)',
    '--selected-nav-item-icon-color': styles.selectedIconColor || 'var(--cc-default-icon, #6A727C)',
    '--hovered-nav-item-pill-bg': hoverPillBackgroundColor || 'var(--cc-surface2-surface, #F6F8FA)',
    '--selected-nav-item-pill-bg': styles.selectedPillBackgroundColor || 'var(--cc-appBackground-surface, #F6F6F6)',
    '--nav-item-pill-radius': `${pillBorderRadius}px`,
  }), [unselectedTextColor, styles, hoverPillBackgroundColor, pillBorderRadius]);

  // Map alignment values to CSS flex values
  const mapAlignment = (value) => {
    const map = { left: 'flex-start', center: 'center', right: 'flex-end', top: 'flex-start', bottom: 'flex-end' };
    return map[value] || 'flex-start';
  };

  // Map alignment values to Tailwind justify/align classes (needed because radix NavigationMenuList
  // uses tw-justify-center internally, and tailwind-merge in cn() resolves class conflicts)
  const justifyTwClass = {
    left: 'tw-justify-start',
    center: 'tw-justify-center',
    right: 'tw-justify-end',
  }[horizontalAlignment] || 'tw-justify-start';

  // In viewer mode, the canvasWidth state can be inflated beyond the actual #real-canvas width
  // (by the sidebar effect in AppCanvas), causing gridWidth and widget widths to be too large.
  // Fix: read real-canvas.clientWidth directly — HotkeyProvider constrains it with maxWidth,
  // so clientWidth reflects the true canvas width. Then cap the widget accordingly.
  const gridColumns = useStore(
    (state) => state.getComponentDefinition(id, 'canvas')?.layouts?.[state.currentLayout]?.width,
    shallow
  );

  const [viewerMaxWidth, setViewerMaxWidth] = useState(undefined);
  useLayoutEffect(() => {
    if (currentMode !== 'view' || orientation !== 'horizontal') {
      setViewerMaxWidth(undefined);
      return;
    }
    if (!gridColumns) return;

    const realCanvas = document.getElementById('real-canvas');
    if (!realCanvas || realCanvas.clientWidth <= 0) return;

    const expectedWidth = (realCanvas.clientWidth / NO_OF_GRIDS) * gridColumns;
    if (width > expectedWidth) {
      setViewerMaxWidth(Math.round(expectedWidth));
    } else {
      setViewerMaxWidth(undefined);
    }
  }, [currentMode, orientation, width, gridColumns]);

  // Container styles
  const containerStyle = useMemo(() => {
    const parsedPadding = parseInt(padding, 10) || 2;
    const parsedBorderRadius = parseInt(borderRadius, 10) || 8;
    const bgColor = backgroundColor || 'var(--cc-surface1-surface)';
    const bdrColor = borderColor || 'var(--cc-weak-border)';

    // For horizontal (flex-direction: row): alignItems = vertical positioning
    // For vertical (flex-direction: column): justifyContent = vertical positioning, alignItems = horizontal positioning
    const isHorizontal = orientation === 'horizontal';

    return {
      display: exposedVariablesTemporaryState.isVisible ? 'flex' : 'none',
      flexDirection: isHorizontal ? 'row' : 'column',
      // Horizontal (row): alignItems = vertical position within the bar; justifyContent handled by inner list via Tailwind class
      // Vertical (column): justifyContent = vertical position; alignItems = horizontal position
      alignItems: isHorizontal
        ? mapAlignment(verticalAlignment)
        : mapAlignment(horizontalAlignment),
      justifyContent: isHorizontal
        ? undefined
        : mapAlignment(verticalAlignment),
      width: '100%',
      height: '100%',
      maxWidth: viewerMaxWidth ? `${viewerMaxWidth}px` : undefined,
      backgroundColor: bgColor,
      border: `1px solid ${bdrColor}`,
      borderRadius: `${parsedBorderRadius}px`,
      padding: `${parsedPadding}px`,
      boxSizing: 'border-box',
      overflow: orientation === 'horizontal' ? 'visible' : 'auto',
      '--nav-container-bg': bgColor,
      '--nav-container-border': bdrColor,
    };
  }, [exposedVariablesTemporaryState.isVisible, orientation, backgroundColor, borderColor, borderRadius, padding, horizontalAlignment, verticalAlignment, viewerMaxWidth]);

  // Loading state
  if (exposedVariablesTemporaryState.isLoading) {
    return (
      <div
        className={cx('navigation-widget navigation-loading', { 'dark-theme': darkMode })}
        style={containerStyle}
        data-cy={dataCy}
      >
        <div className="navigation-spinner">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render content based on orientation
  const renderContent = () => {
    if (orientation === 'horizontal') {
      return (
        <NavigationMenu viewport={false} className={`navigation-horizontal-menu ${justifyTwClass}`} style={{ flex: 'none' }}>
          <NavigationMenuList className={`navigation-horizontal-list ${justifyTwClass}`} style={{ ...navItemStyles, flex: 'none' }}>
            {links.visible.map((item) => {
              if (item.isGroup) {
                return (
                  <RenderNavGroup
                    key={item.id}
                    group={item}
                    selectedItemId={selectedItemId}
                    onItemClick={handleItemClick}
                    styles={styles}
                    displayStyle={displayStyle}
                    orientation={orientation}
                    darkMode={darkMode}
                  />
                );
              }
              return (
                <NavigationMenuItem key={item.id}>
                  <RenderNavItem
                    item={item}
                    isSelected={item.id === selectedItemId}
                    onItemClick={handleItemClick}
                    styles={styles}
                    displayStyle={displayStyle}
                    orientation={orientation}
                  />
                </NavigationMenuItem>
              );
            })}
            {/* More button for overflow items - uses NavigationMenu like page navigation */}
            {links.overflow.length > 0 && (
              <NavigationMenuItem>
                <NavigationMenuTrigger indicator={false} className="more-pages-btn">
                  <TablerIcon iconName="IconDotsVertical" size={16} color="var(--nav-item-icon-color)" />
                  More
                </NavigationMenuTrigger>
                <NavigationMenuContent className={cx('!tw-min-w-full page-menu-popup', { 'dark-theme': darkMode })}>
                  {links.overflow.map((item) => {
                    if (item.isGroup) {
                      return (
                        <RenderNavGroup
                          key={item.id}
                          group={item}
                          selectedItemId={selectedItemId}
                          onItemClick={handleItemClick}
                          styles={styles}
                          displayStyle={displayStyle}
                          orientation="vertical"
                          darkMode={darkMode}
                          isInOverflow={true}
                        />
                      );
                    }
                    return (
                      <RenderNavItem
                        key={item.id}
                        item={item}
                        isSelected={item.id === selectedItemId}
                        onItemClick={handleItemClick}
                        styles={styles}
                        displayStyle={displayStyle}
                        orientation="vertical"
                        isInOverflow={true}
                      />
                    );
                  })}
                </NavigationMenuContent>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      );
    }

    // Vertical orientation - use visibleMenuItems (deduplicated and filtered)
    return (
      <div className="navigation-vertical-menu" style={navItemStyles}>
        {visibleMenuItems.map((item) => {
          if (item.isGroup) {
            return (
              <RenderNavGroup
                key={item.id}
                group={item}
                selectedItemId={selectedItemId}
                onItemClick={handleItemClick}
                styles={styles}
                displayStyle={displayStyle}
                orientation={orientation}
                darkMode={darkMode}
              />
            );
          }
          return (
            <RenderNavItem
              key={item.id}
              item={item}
              isSelected={item.id === selectedItemId}
              onItemClick={handleItemClick}
              styles={styles}
              displayStyle={displayStyle}
              orientation={orientation}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cx('navigation-widget', {
        'dark-theme': darkMode,
        'navigation-disabled': disabledState,
        'navigation-horizontal': orientation === 'horizontal',
        'navigation-vertical': orientation === 'vertical',
      })}
      style={containerStyle}
      data-cy={dataCy}
      role="navigation"
      aria-label="Navigation menu"
    >
      {/* Hidden measurement container for calculating item widths */}
      {orientation === 'horizontal' && (
        <div
          ref={measurementContainerRef}
          style={{
            position: 'absolute',
            top: '-9999px',
            left: '-9999px',
            visibility: 'hidden',
            whiteSpace: 'nowrap',
            display: 'flex',
            padding: '0px',
            fontSize: '14px',
          }}
        >
          {visibleMenuItems.map((item) => (
            <div
              key={`measure-${item.id}`}
              data-id={item.id}
              style={{
                padding: `0px ${item.isGroup ? '30px' : '10px'} 0px ${displayStyle === 'textAndIcon' ? '32px' : '10px'}`,
                fontWeight: 500,
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
      {renderContent()}
    </div>
  );
};
