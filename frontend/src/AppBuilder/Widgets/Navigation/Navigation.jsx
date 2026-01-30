import React, { useEffect, useState, useMemo, useRef, useCallback, useLayoutEffect } from 'react';
import cx from 'classnames';
// eslint-disable-next-line import/no-unresolved
import * as Icons from '@tabler/icons-react';
import { useBatchedUpdateEffectArray } from '@/_hooks/useBatchedUpdateEffectArray';
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import './navigation.scss';

// Render individual nav item - uses tj-list-item class like page navigation
const RenderNavItem = ({
  item,
  isSelected,
  onItemClick,
  styles,
  displayStyle,
  orientation,
  isNested = false,
  isInOverflow = false,
}) => {
  const isVisible = typeof item.visible === 'object' ? item.visible.value !== '{{true}}' : item.visible !== true;
  const isDisabled = typeof item.disable === 'object'
    ? item.disable.value === '{{true}}' || item.disable.value === true
    : item.disable === true;

  if (!isVisible) return null;

  const IconElement = Icons[item.icon?.value || item.icon] || Icons.IconFile;
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
          <IconElement
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
  isInOverflow = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isVisible = typeof group.visible === 'object' ? group.visible.value !== '{{true}}' : group.visible !== true;
  const isDisabled = typeof group.disable === 'object'
    ? group.disable.value === '{{true}}' || group.disable.value === true
    : group.disable === true;

  if (!isVisible) return null;

  const IconElement = Icons[group.icon?.value || group.icon] || Icons.IconFolder;
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
          <IconElement
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
          <Icons.IconChevronUp
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
        <Icons.IconChevronUp
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
    height,
    width,
    properties,
    styles,
    fireEvent,
    id,
    dataCy,
    setExposedVariable,
    setExposedVariables,
    darkMode,
  } = props;

  const {
    orientation,
    displayStyle,
    loadingState,
    disabledState,
    visibility,
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
  const [exposedState, setExposedState] = useState({
    isLoading: loadingState,
    isVisible: visibility,
    isDisabled: disabledState,
    lastClicked: null,
  });

  // State for visible/overflow items (horizontal mode)
  const [links, setLinks] = useState({
    visible: menuItems,
    overflow: [],
  });


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

  // Calculate overflow for horizontal orientation
  const calculateOverflow = useCallback(() => {
    if (!containerRef.current || visibleMenuItems.length === 0) {
      setLinks({ visible: [], overflow: [] });
      return;
    }

    if (orientation !== 'horizontal') {
      setLinks({ visible: visibleMenuItems, overflow: [] });
      return;
    }

    const containerWidth = containerRef.current.offsetWidth;
    const measuredItems = measurementContainerRef.current?.children
      ? Array.from(measurementContainerRef.current.children)
      : [];

    if (measuredItems.length === 0) {
      setLinks({ visible: visibleMenuItems, overflow: [] });
      return;
    }

    const FLEX_GAP = 4;
    const MORE_BUTTON_WIDTH = 80; // Width reserved for "More" button
    const CONTAINER_PADDING = parseInt(padding) || 8;

    let currentWidth = CONTAINER_PADDING;
    const finalVisible = [];
    const finalOverflow = [];

    for (let i = 0; i < visibleMenuItems.length; i++) {
      const item = visibleMenuItems[i];
      const measuredElement = measuredItems.find((el) => el.dataset.id === item.id);

      if (!measuredElement) {
        finalOverflow.push(item);
        continue;
      }

      const itemWidth = measuredElement.offsetWidth;
      const widthNeeded = itemWidth + (finalVisible.length > 0 ? FLEX_GAP : 0);

      // Calculate if we need space for "More" button
      const remainingItems = visibleMenuItems.length - (i + 1);
      const needsMoreButton = remainingItems > 0 || finalOverflow.length > 0;
      const moreButtonSpace = needsMoreButton ? MORE_BUTTON_WIDTH + FLEX_GAP : 0;

      if (currentWidth + widthNeeded + moreButtonSpace <= containerWidth) {
        finalVisible.push(item);
        currentWidth += widthNeeded;
      } else {
        finalOverflow.push(item);
      }
    }

    // Final check: ensure we have space for More button if there are overflow items
    while (
      finalOverflow.length > 0 &&
      finalVisible.length > 0 &&
      currentWidth + MORE_BUTTON_WIDTH + FLEX_GAP > containerWidth
    ) {
      const lastVisible = finalVisible.pop();
      const lastMeasured = measuredItems.find((el) => el.dataset.id === lastVisible.id);
      if (lastMeasured) {
        currentWidth -= lastMeasured.offsetWidth + (finalVisible.length > 0 ? FLEX_GAP : 0);
      }
      finalOverflow.unshift(lastVisible);
    }

    setLinks({ visible: finalVisible, overflow: finalOverflow });
  }, [visibleMenuItems, orientation, padding]);

  // Recalculate on resize
  useLayoutEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(calculateOverflow);
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateOverflow]);

  // Recalculate when width changes
  useEffect(() => {
    calculateOverflow();
  }, [width, calculateOverflow]);

  // Helper to find item by ID (including nested items)
  const findItemById = (items, targetId) => {
    for (const item of items) {
      if (item.id === targetId) return item;
      if (item.isGroup && item.children) {
        const found = findItemById(item.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Helper to find parent group of an item
  const findParentGroup = (items, targetId) => {
    for (const item of items) {
      if (item.isGroup && item.children) {
        if (item.children.some((child) => child.id === targetId)) {
          return item;
        }
        const found = findParentGroup(item.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Handle item click
  const handleItemClick = (item) => {
    if (disabledState) return;

    const parentGroup = findParentGroup(menuItems, item.id);
    const index = menuItems.findIndex((mi) => mi.id === item.id);

    const clickData = {
      id: item.id,
      label: item.label,
      index: index !== -1 ? index : null,
      groupId: parentGroup?.id || null,
      groupLabel: parentGroup?.label || null,
    };

    setSelectedItemId(item.id);
    setExposedVariable('lastClicked', clickData);
    setExposedState((prev) => ({ ...prev, lastClicked: clickData }));
    fireEvent('onClick');
  };

  // Actions
  const selectItem = (itemId) => {
    const item = findItemById(menuItems, itemId);
    if (item && !item.isGroup) {
      setSelectedItemId(itemId);
    }
  };

  // Effects for syncing exposed variables
  useBatchedUpdateEffectArray([
    {
      dep: loadingState,
      sideEffect: () => {
        setExposedState((prev) => ({ ...prev, isLoading: loadingState }));
        setExposedVariable('isLoading', loadingState);
      },
    },
    {
      dep: visibility,
      sideEffect: () => {
        setExposedState((prev) => ({ ...prev, isVisible: visibility }));
        setExposedVariable('isVisible', visibility);
      },
    },
    {
      dep: disabledState,
      sideEffect: () => {
        setExposedState((prev) => ({ ...prev, isDisabled: disabledState }));
        setExposedVariable('isDisabled', disabledState);
      },
    },
  ]);

  // Initialize exposed variables
  useEffect(() => {
    const exposedVariables = {
      lastClicked: null,
      isDisabled: disabledState,
      isVisible: visibility,
      isLoading: loadingState,
      setDisable: async function (value) {
        setExposedState((prev) => ({ ...prev, isDisabled: !!value }));
        setExposedVariable('isDisabled', !!value);
      },
      setVisibility: async function (value) {
        setExposedState((prev) => ({ ...prev, isVisible: !!value }));
        setExposedVariable('isVisible', !!value);
      },
      setLoading: async function (value) {
        setExposedState((prev) => ({ ...prev, isLoading: !!value }));
        setExposedVariable('isLoading', !!value);
      },
      selectItem: async function (itemId) {
        selectItem(itemId);
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

  // Container styles
  const containerStyle = useMemo(() => {
    const parsedPadding = parseInt(padding, 10) || 8;
    const parsedBorderRadius = parseInt(borderRadius, 10) || 8;
    const bgColor = backgroundColor || 'var(--cc-surface1-surface)';
    const bdrColor = borderColor || 'var(--cc-weak-border)';

    return {
      display: visibility ? 'flex' : 'none',
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      alignItems: orientation === 'horizontal' ? 'center' : 'stretch',
      width: '100%',
      height: '100%',
      backgroundColor: bgColor,
      border: `1px solid ${bdrColor}`,
      borderRadius: `${parsedBorderRadius}px`,
      padding: `${parsedPadding}px`,
      boxSizing: 'border-box',
      overflow: orientation === 'horizontal' ? 'visible' : 'auto',
      '--nav-container-bg': bgColor,
      '--nav-container-border': bdrColor,
    };
  }, [visibility, orientation, backgroundColor, borderColor, borderRadius, padding]);

  // Loading state
  if (loadingState) {
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
        <NavigationMenu viewport={false} className="navigation-horizontal-menu" style={{ flex: 'none' }}>
          <NavigationMenuList className="navigation-horizontal-list" style={{ ...navItemStyles, flex: 'none' }}>
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
                  <Icons.IconDotsVertical size={16} color="var(--nav-item-icon-color)" />
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
