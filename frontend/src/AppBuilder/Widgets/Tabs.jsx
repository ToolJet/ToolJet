import React, { useRef, useState, useEffect, memo } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { resolveWidgetFieldValue, isExpectedDataType } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import Spinner from '@/_ui/Spinner';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import * as Icons from '@tabler/icons-react';
import { set } from 'lodash';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import OverflowTooltip from '@/_components/OverflowTooltip';
import { TAB_CANVAS_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
const tinycolor = require('tinycolor2');

const TabsNavShimmer = ({ divider, headerBackground }) => {
  return (
    <div
      className="d-flex px-3 gap-4"
      style={{
        borderBottom: `0.5px solid ${divider}`,
        height: '60.41px',
        backgroundColor: headerBackground,
        alignItems: 'center',
      }}
    >
      {Array(3)
        .fill(0)
        .map((ind) => (
          <div
            key={ind}
            style={{
              width: '68px',
              height: '20px',
              backgroundColor: '#88909914',
              borderRadius: '6px',
              marginTop: '8px ',
              marginBottom: '8px',
            }}
          ></div>
        ))}
    </div>
  );
};

export const Tabs = function Tabs({
  id,
  component,
  width,
  height,
  containerProps,
  removeComponent,
  setExposedVariable,
  setExposedVariables,
  fireEvent,
  styles,
  darkMode,
  dataCy,
  properties,
}) {
  const { tabWidth, boxShadow } = styles;
  const { isDisabled, isVisible, isLoading } = useExposeState(
    properties.loadingState,
    properties.visibility,
    properties.disabledState,
    setExposedVariables,
    setExposedVariable
  );
  const { defaultTab, hideTabs, renderOnlyActiveTab, useDynamicOptions } = properties;
  const setSelectedComponents = useStore((state) => state.setSelectedComponents);

  const widgetVisibility = styles?.visibility ?? true;
  const disabledState = styles?.disabledState ?? false;
  // config for tabs. Includes title
  const tabs = isExpectedDataType(properties.tabs, 'array');
  let parsedTabs = tabs;
  if (!useDynamicOptions) {
    parsedTabs = properties.tabItems;
  } else {
    parsedTabs = resolveWidgetFieldValue(parsedTabs);
  }

  parsedTabs = parsedTabs
    ?.filter((tab) => tab.visible !== false)
    ?.map((parsedTab, index) => ({
      ...parsedTab,
      id: parsedTab.id ? parsedTab.id : index,
    }));
  const highlightColor = styles?.highlightColor ?? '#f44336';
  let parsedHighlightColor = highlightColor;
  parsedHighlightColor = resolveWidgetFieldValue(highlightColor);

  const headerBackground = styles?.headerBackground ?? '#fff';
  const unselectedText = styles?.unselectedText ?? '#6A727C';
  const selectedText = styles?.selectedText ?? '#fff';
  const hoverBackground = styles?.hoverBackground ?? '#F1F3F4';
  const unselectedIcon = styles?.unselectedIcon ?? '#6A727C';
  const selectedIcon = styles?.selectedIcon ?? '#fff';
  const accent = styles?.accent ?? '#3c92dc';
  const divider = styles?.divider ?? '#CCD1D5';
  const borderRadius = styles?.borderRadius ?? '0px';

  const border = styles?.border === '#CCD1D5' ? false : styles?.border;
  const padding = styles?.padding ?? 'none';
  const transition = styles?.transition ?? 'none';

  // Default tab
  let parsedDefaultTab = defaultTab;

  const defaultTabExists = parsedTabs?.some((tab) => tab.id === parsedDefaultTab);
  if (!defaultTabExists && parsedTabs.length > 0) {
    parsedDefaultTab = parsedTabs[0].id;
  }

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState) : disabledState;

  const parsedHideTabs = typeof hideTabs !== 'boolean' ? resolveWidgetFieldValue(hideTabs) : hideTabs;
  const parsedRenderOnlyActiveTab =
    typeof renderOnlyActiveTab !== 'boolean' ? resolveWidgetFieldValue(renderOnlyActiveTab) : renderOnlyActiveTab;

  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveWidgetFieldValue(parsedWidgetVisibility);
  } catch (err) {
    console.log(err);
  }

  const parentRef = useRef(null);
  const [currentTab, setCurrentTab] = useState(parsedDefaultTab);
  const [tabItems, setTabItems] = useState(parsedTabs);
  const tabItemsRef = useRef(tabItems);
  const [bgColor, setBgColor] = useState('#fff');

  useEffect(() => {
    setCurrentTab(parsedDefaultTab);
  }, [parsedDefaultTab]);

  useEffect(() => {
    if (JSON.stringify(tabItemsRef.current) !== JSON.stringify(parsedTabs)) {
      setTabItems(parsedTabs);
      tabItemsRef.current = parsedTabs;
    }
  }, [parsedTabs]);

  useEffect(() => {
    const currentTabData = parsedTabs.filter((tab) => tab.id == currentTab);
    setBgColor(currentTabData[0]?.backgroundColor ? currentTabData[0]?.backgroundColor : darkMode ? '#324156' : '#fff');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, darkMode]);

  useEffect(() => {
    const exposedVariables = {
      setTab: async function (id) {
        if (currentTab != id) {
          setCurrentTab(id);
          setExposedVariable('currentTab', id);
          fireEvent('onTabSwitch');
          setSelectedComponents([]);
        }
      },
      setTabDisable: async function (id, value) {
        setTabItems((prevTabItems) => {
          return prevTabItems.map((tab) => {
            if (tab.id == id) {
              return { ...tab, disable: value };
            }
            return tab;
          });
        });
        setSelectedComponents([]);
      },
      setTabLoading: async function (id, value) {
        setTabItems((prevTabItems) => {
          return prevTabItems.map((tab) => {
            if (tab.id == id) {
              return { ...tab, loading: value };
            }
            return tab;
          });
        });
      },
      setTabVisibility: async function (id, value) {
        setTabItems((prevTabItems) => {
          return prevTabItems.map((tab) => {
            if (tab.id == id) {
              return { ...tab, visible: value };
            }
            return tab;
          });
        });
      },
      currentTab: currentTab,
    };
    setExposedVariables(exposedVariables);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCurrentTab, currentTab]);

  const containerRef = useRef(null);
  const tabsRef = React.useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScroll, setCanScroll] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredTabId, setHoveredTabId] = useState(null);

  const checkScroll = () => {
    if (tabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
      setCanScroll(scrollLeft > 0 || scrollLeft + clientWidth < scrollWidth);
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth);
    }
  };

  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = tabsRef.current.clientWidth / 2;
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
    checkScroll();
  };

  useEffect(() => {
    checkScroll();
    const onScroll = () => checkScroll();
    const currentTabsRef = tabsRef.current;
    if (currentTabsRef) {
      currentTabsRef.addEventListener('scroll', onScroll);
    }

    return () => {
      if (currentTabsRef) {
        currentTabsRef.removeEventListener('scroll', onScroll);
      }
    };
  }, [tabsRef.current, tabWidth, tabItems]);

  useEffect(() => {
    checkScroll();
    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  function shouldRenderTabContent(tab) {
    if (parsedRenderOnlyActiveTab) {
      return tab.id == currentTab;
    }
    return true;
  }

  const findTabIndex = (tabId) => {
    return tabItems.findIndex((tab) => tab.id === tabId);
  };

  const handleMouseEnter = (id) => {
    setHoveredTabId(id);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  function getTabIcon(tab) {
    const iconName = tab?.icon;
    // eslint-disable-next-line import/namespace
    const IconElement = Icons[iconName] == undefined ? Icons['IconHome2'] : Icons[iconName];

    return tab?.iconVisibility ? (
      <IconElement
        color={`${currentTab == tab?.id ? selectedIcon : unselectedIcon}`}
        style={{
          width: '20px',
          height: '20px',
          marginBottom: '3px',
          ...(currentTab == tab.id ? { color: selectedIcon } : { color: unselectedIcon }),
        }}
        stroke={1.5}
      />
    ) : null;
  }

  const equalSplitWidth = 100 / tabItems?.length || 1;
  const someTabsVisible = tabItems?.filter((tab) => tab?.visible !== false);
  return (
    <div
      data-disabled={isDisabled}
      className="card tabs-component"
      style={{
        height: padding === 'default' ? height : height + 4,
        display: isVisible ? 'flex' : 'none',
        backgroundColor: darkMode ? '#324156' : '#fff',
        boxShadow,
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        ...(border ? { border: `1px solid ${border}` } : { border: 'none' }),
      }}
      data-cy={dataCy}
      ref={containerRef}
    >
      {isLoading ? (
        <TabsNavShimmer divider={divider} headerBackground={headerBackground} />
      ) : (
        <div
          style={{
            borderBottom: someTabsVisible?.length > 0 && `0.5px solid ${divider}`,
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            backgroundColor: headerBackground,
            height: '50px',
          }}
        >
          {canScroll && (
            <div
              className="px-2"
              onClick={() => scrollTabs('left')}
              style={{ cursor: canScrollLeft ? 'pointer' : 'default' }}
            >
              <SolidIcon fill={canScrollLeft ? '#6A727C' : '#C1C8CD'} name={'cheveronleft'} />
            </div>
          )}
          {/* this started change */}
          <ul
            ref={tabsRef}
            className="nav"
            data-bs-toggle="tabs"
            style={{
              zIndex: 1,
              display: parsedHideTabs ? 'none' : 'flex',
              backgroundColor: headerBackground,
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              flexWrap: 'nowrap',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollBehavior: 'smooth',
              flexGrow: 1,
              paddingLeft: '10px',
              paddingRight: '10px',
              height: '100%',
            }}
          >
            {tabItems
              ?.filter((tab) => tab?.visible !== false)
              ?.map((tab) => (
                <li
                  className={`nav-item ${currentTab == tab.id ? 'active' : ''}`}
                  style={{
                    opacity: tab?.disable && '0.5',
                    width: tabWidth == 'split' && equalSplitWidth + '%',
                    borderBottom: currentTab === tab.id && !tab?.disable ? `2px solid ${accent}` : ' #CCD1D5',
                    backgroundColor: headerBackground,
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: 'bold',
                    paddingTop: '.5rem',
                    paddingBottom: '.5rem',
                    cursor: tab?.disable ? 'not-allowed' : 'pointer',
                    ...(tabWidth == 'split' ? { minWidth: 'auto' } : {}), // Remove minWidth for tabWidth != 'split'
                  }}
                  onClick={() => {
                    if (currentTab == tab.id) return;
                    if (tab?.disable) return;

                    !tab?.disabled && setCurrentTab(tab.id);
                    !tab?.disabled && setExposedVariable('currentTab', tab.id);
                    fireEvent('onTabSwitch');
                  }}
                  onMouseEnter={() => handleMouseEnter(tab?.id)}
                  onMouseLeave={handleMouseLeave}
                  ref={(el) => {
                    if (el && currentTab == tab.id) {
                      el.style.setProperty('color', parsedHighlightColor, 'important');
                    }
                  }}
                  key={tab.id}
                >
                  <div
                    data-disabled={tab?.disable}
                    style={{
                      textAlign: 'center',
                      fontWeight: '500',
                      background:
                        isHovered && hoveredTabId == tab.id
                          ? tinycolor(hoverBackground).setAlpha(0.08).toString()
                          : 'transparent',
                      borderRadius: '6px',
                      paddingLeft: '1rem',
                      paddingRight: '1rem',
                      ...(currentTab == tab.id ? { color: selectedText } : { color: unselectedText }),
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      height: '28px',
                      paddingTop: '4px',
                      paddingBottom: '4px',
                    }}
                  >
                    {tabWidth === 'split' ? (
                      <>
                        <a style={{ marginRight: '4px' }}>{getTabIcon(tab)}</a>
                        <OverflowTooltip boxWidth={width}>
                          <>{tab.title}</>
                        </OverflowTooltip>
                      </>
                    ) : (
                      <span>
                        <a style={{ marginRight: '4px' }}>{getTabIcon(tab)}</a>
                        {tab.title}
                      </span>
                    )}
                  </div>
                </li>
              ))}
          </ul>
          {/* this ended change */}
          {canScroll && (
            <div
              className="px-2"
              onClick={() => scrollTabs('right')}
              style={{ cursor: canScrollRight ? 'pointer' : 'default' }}
            >
              <SolidIcon fill={canScrollRight ? '#6A727C' : '#C1C8CD'} name="cheveronright" width="25" height="25" />
            </div>
          )}
        </div>
      )}
      {isLoading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Spinner />
        </div>
      ) : (
        <div
          style={{
            overflow: 'hidden',
            width: '100%',
            height: parsedHideTabs ? height : height - 41,
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: `${tabItems.length * 100}%`,
              transform: `translateX(-${findTabIndex(currentTab) * (100 / tabItems.length)}%)`,
              transition: 'transform 0.3s ease-in-out',
            }}
          >
            {tabItems.map((tab) => (
              <div
                key={tab.id}
                style={{
                  width: `${100 / tabItems.length}%`,
                  flexShrink: 0,
                  height: '100%',
                }}
              >
                <TabContent
                  id={id}
                  tab={tab}
                  height={height}
                  width={width}
                  parsedHideTabs={parsedHideTabs}
                  bgColor={bgColor}
                  darkMode={darkMode}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const areEqual = (prevProps, nextProps) => {
  const allKeys = new Set([...Object.keys(prevProps), ...Object.keys(nextProps)]);
  let hasChanges = false;

  for (let key of allKeys) {
    if (prevProps[key] !== nextProps[key]) {
      console.log(`[TabContent] Prop changed: ${key}`, {
        from: prevProps[key],
        to: nextProps[key],
      });
      hasChanges = true;
    }
  }

  return !hasChanges;
};

const TabContent = memo(function TabContent({ id, tab, height, width, parsedHideTabs, bgColor, darkMode }) {
  const loading = tab?.loading;
  const disable = tab?.disable;
  const visible = tab?.visible;

  const fieldBackgroundColor = tab?.fieldBackgroundColor;
  if (visible === false) return null;

  return (
    <div
      data-disabled={disable}
      className="tab-pane active"
      style={{
        display: disable ? 'none' : 'block',
        height: parsedHideTabs ? height : height - 41,
        position: 'absolute',
        top: '0px',
        width: '100%',
      }}
    >
      {loading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <Spinner />
        </div>
      ) : (
        <SubContainer
          id={`${id}-${tab.id}`}
          canvasHeight={'200'}
          canvasWidth={width}
          allowContainerSelect={true}
          styles={{ backgroundColor: disable ? '#ffffff' : fieldBackgroundColor || bgColor }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}, areEqual);
