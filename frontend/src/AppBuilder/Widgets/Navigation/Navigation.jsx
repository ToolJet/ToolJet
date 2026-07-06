import React, { useEffect, useLayoutEffect, useState, useMemo, useRef } from 'react';
import cx from 'classnames';
import TablerIcon from '@/_ui/Icon/TablerIcon';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from '@/components/ui/navigation-menu';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useCalculateOverflow } from './hooks/useCalculateOverflow';
import { findItemById, findParentGroup } from './utils';
import { shallow } from 'zustand/shallow';
import useStore from '@/AppBuilder/_stores/store';
import { NO_OF_GRIDS } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import './navigation.scss';
import { useComponentCommands } from '@/AppBuilder/_hooks/useComponentCommands';
import { useExposedVariable } from '@/AppBuilder/_hooks/useExposedVariable';
import '@/AppBuilder/_engine/contractGroups/selectionB';

// Render individual nav item - uses tj-list-item class like page navigation
const RenderNavItem = ({ item, isSelected, onItemClick, displayStyle }) => {
  const isVisible = typeof item.visible === 'object' ? item.visible.value !== '{{true}}' : item.visible !== true;
  const isDisabled =
    typeof item.disable === 'object'
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
const RenderNavGroup = ({ group, selectedItemId, onItemClick, styles, displayStyle, orientation, darkMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const isVisible = typeof group.visible === 'object' ? group.visible.value !== '{{true}}' : group.visible !== true;
  const isDisabled =
    typeof group.disable === 'object'
      ? group.disable.value === '{{true}}' || group.disable.value === true
      : group.disable === true;

  if (!isVisible) return null;

  const showIcon = displayStyle !== 'textOnly' && group.iconVisibility !== false;
  const showLabel = displayStyle !== 'iconOnly';

  // Deduplicate children by ID
  // eslint-disable-next-line react-hooks/rules-of-hooks
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
      {showLabel && <div className="page-name">{group.label}</div>}
    </div>
  );

  // For horizontal orientation, use Radix DropdownMenu — native collision
  // detection flips the dropdown above the trigger when there isn't enough
  // space below. We skip Portal so the content stays inside .navigation-widget
  // (keeps existing SCSS nesting working). `asChild` lets us keep our custom
  // button styles and the group-[data-state] chevron rotation — Radix
  // propagates data-state onto the delegated child element.
  if (orientation === 'horizontal') {
    return (
      <NavigationMenuItem key={group.id}>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className={cx('tw-group page-group-wrapper', {
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
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            className={cx('page-menu-popup', { 'dark-theme': darkMode })}
            sideOffset={6}
            align="start"
            collisionPadding={8}
          >
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
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </NavigationMenuItem>
    );
  }

  // For vertical orientation, use accordion-style expansion
  return (
    <div key={group.id} className={cx('accordion-item', { 'dark-theme': darkMode })} data-cy={`nav-group-${group.id}`}>
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
    componentType,
    moduleId,
    resolveIndex,
  } = props;

  const {
    orientation,
    displayStyle,
    navItemSize = 'equalWidth',
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
  const isInitialRender = useRef(true);

  const exposedOpts = { resolveIndex, moduleId };
  const { dispatch, csaShims } = useComponentCommands({
    id,
    componentType,
    moduleId,
    resolveIndex,
    setExposedVariables,
    fireEvent,
  });

  // Store is the source of truth for isVisible/isLoading/selectedItem.
  // isDisabled is exposed but (matching old) never fed back into this
  // widget's own rendering/click-guard — those still read `disabledState`.
  const isVisible = useExposedVariable(id, 'isVisible', exposedOpts, visibility);
  const isLoading = useExposedVariable(id, 'isLoading', exposedOpts, loadingState);
  const storeSelectedItem = useExposedVariable(id, 'selectedItem', exposedOpts, null);
  const selectedItemId = storeSelectedItem?.id ?? null;

  // Latest-ref: the selectItem CSA (registered once at mount) must never
  // close over a stale menuItems from the mount-time render.
  const menuItemsRef = useRef(menuItems);
  menuItemsRef.current = menuItems;

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

  const clickDataFor = (item) => {
    const parentGroup = findParentGroup(menuItemsRef.current, item.id);
    return {
      id: item.id,
      label: item.label,
      groupId: parentGroup?.id || null,
      groupLabel: parentGroup?.label || null,
    };
  };

  // Handle item click — dispatches the same command the CSA uses; the
  // reducer reads `previousSelectedItem` from the CURRENT store value.
  const handleItemClick = (item) => {
    if (disabledState) return;
    dispatch([
      { kind: 'INVOKE_CSA', componentId: id, action: 'selectItem', args: [clickDataFor(item)] },
      { kind: 'FIRE_EVENT', componentId: id, event: 'onClick' },
    ]);
  };

  // CSA path (RunJS / other components) — old guard: groups aren't selectable.
  const selectItem = async (itemId) => {
    const item = findItemById(menuItemsRef.current, itemId);
    if (item && !item.isGroup) {
      dispatch([{ kind: 'INVOKE_CSA', componentId: id, action: 'selectItem', args: [clickDataFor(item)] }]);
    }
  };

  // Property-sync write-throughs (skip-initial).
  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isLoading', loadingState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingState]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isVisible', visibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibility]);

  useEffect(() => {
    if (isInitialRender.current) return;
    setExposedVariable('isDisabled', disabledState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabledState]);

  // Mount: initial exposed snapshot + contract-generated CSA dispatchers.
  useEffect(() => {
    setExposedVariables({
      selectedItem: null,
      previousSelectedItem: null,
      isDisabled: disabledState,
      isVisible: visibility,
      isLoading: loadingState,
      ...csaShims(),
      selectItem,
    });
    isInitialRender.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Nav item styles (CSS custom properties) - matches page navigation computedStyles
  const navItemStyles = useMemo(
    () => ({
      '--nav-item-label-color': unselectedTextColor || 'var(--text-placeholder, #6A727C)',
      '--nav-item-icon-color': styles.unselectedIconColor || 'var(--cc-default-icon, #6A727C)',
      '--selected-nav-item-label-color': styles.selectedTextColor || 'var(--cc-primary-text, #1B1F24)',
      '--selected-nav-item-icon-color': styles.selectedIconColor || 'var(--cc-default-icon, #6A727C)',
      '--hovered-nav-item-pill-bg': hoverPillBackgroundColor || 'var(--cc-surface2-surface, #F6F8FA)',
      '--selected-nav-item-pill-bg': styles.selectedPillBackgroundColor || 'var(--cc-appBackground-surface, #F6F6F6)',
      '--nav-item-pill-radius': `${pillBorderRadius}px`,
    }),
    [unselectedTextColor, styles, hoverPillBackgroundColor, pillBorderRadius]
  );

  // Map alignment values to CSS flex values
  const mapAlignment = (value) => {
    const map = { left: 'flex-start', center: 'center', right: 'flex-end', top: 'flex-start', bottom: 'flex-end' };
    return map[value] || 'flex-start';
  };

  // Map alignment values to Tailwind justify/align classes (needed because radix NavigationMenuList
  // uses tw-justify-center internally, and tailwind-merge in cn() resolves class conflicts)
  const justifyTwClass =
    {
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

    const isHorizontal = orientation === 'horizontal';

    return {
      display: isVisible ? 'flex' : 'none',
      flexDirection: isHorizontal ? 'row' : 'column',
      alignItems: isHorizontal ? mapAlignment(verticalAlignment) : undefined,
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
  }, [isVisible, orientation, backgroundColor, borderColor, borderRadius, padding, verticalAlignment, viewerMaxWidth]);

  // Loading state
  if (isLoading) {
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
        <NavigationMenu
          viewport={false}
          className={`navigation-horizontal-menu ${justifyTwClass}`}
          style={{ flex: navItemSize === 'equalWidth' ? '1' : 'none' }}
        >
          <NavigationMenuList
            className={`navigation-horizontal-list ${justifyTwClass} ${
              navItemSize === 'equalWidth' ? `nav-equal-width nav-align-${horizontalAlignment}` : ''
            }`}
            style={{ ...navItemStyles, flex: navItemSize === 'equalWidth' ? '1' : 'none' }}
          >
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
            {/* More button for overflow items — Radix DropdownMenu provides
                auto-positioning (flips above when no space below). align="end"
                keeps the dropdown's right edge aligned with the button, since
                the More button sits at the end of the nav bar. Portal is
                skipped so content renders inside .navigation-widget (existing
                SCSS nesting stays intact). */}
            {links.overflow.length > 0 && (
              <NavigationMenuItem>
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button type="button" className="more-pages-btn">
                      <TablerIcon iconName="IconDotsVertical" size={16} color="var(--nav-item-icon-color)" />
                      More
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content
                    className={cx('page-menu-popup', { 'dark-theme': darkMode })}
                    sideOffset={6}
                    align="end"
                    collisionPadding={8}
                  >
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
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      );
    }

    // Vertical orientation - use visibleMenuItems (deduplicated and filtered)
    // Auto-margins handle alignment without clipping scrollable content:
    // center → auto margins on both sides; end → auto margin on start side only
    const verticalMenuStyle = {
      ...navItemStyles,
      marginTop: verticalAlignment === 'center' ? 'auto' : verticalAlignment === 'bottom' ? 'auto' : undefined,
      marginBottom: verticalAlignment === 'center' ? 'auto' : undefined,
      marginLeft: horizontalAlignment === 'center' ? 'auto' : horizontalAlignment === 'right' ? 'auto' : undefined,
      marginRight: horizontalAlignment === 'center' ? 'auto' : undefined,
    };

    return (
      <div
        className={`navigation-vertical-menu ${
          navItemSize === 'equalWidth' ? `nav-equal-width nav-align-${horizontalAlignment}` : ''
        }`}
        style={verticalMenuStyle}
      >
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
                padding: `0px ${item.isGroup ? '30px' : '10px'} 0px ${
                  displayStyle === 'textAndIcon' ? '32px' : '10px'
                }`,
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
