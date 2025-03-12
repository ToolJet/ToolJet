import React, { useRef, useState, useEffect } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { resolveWidgetFieldValue, isExpectedDataType } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import Spinner from '@/_ui/Spinner';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import * as Icons from '@tabler/icons-react';
import { set } from 'lodash';

const TabsNavShimmer = ({ divider }) => {
  return (
    <div className="d-flex gap-4 px-1.5 px-2" style={{ borderBottom: `0.5px solid ${divider}` }}>
      {Array(3)
        .fill(0)
        .map((ind) => (
          <div
            key={ind}
            style={{
              width: '70px',
              height: '24px',
              backgroundColor: '#88909914',
              borderRadius: '16px',
              margin: '8px 0px',
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
  // const hideTabs = component.definition.properties?.hideTabs?.value ?? false;

  //* renderOnlyActiveTab - TRUE (renders only the content of the active tab)
  //* renderOnlyActiveTab - FALSE (renders all the content irrespective of the active tab to persist value from other tabs)
  // const renderOnlyActiveTab = component.definition.properties?.renderOnlyActiveTab?.value ?? false;

  // set index as id if id is not provided
  parsedTabs = parsedTabs
    ?.filter((tab) => tab.visible !== false)
    ?.map((parsedTab, index) => ({ ...parsedTab, id: parsedTab.id ? parsedTab.id : index }));
  // Highlight color - for active tab text and border
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
  const border = styles?.border ?? '#CCD1D5';
  const padding = styles?.padding ?? 'none';
  const transition = styles?.transition ?? 'none';
  const background = styles?.background ?? '#FFFFFF';
  // options: [
  //   { name: 'Slide', value: 'slide' },
  //   { name: 'None', value: 'none' },
  // ],

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

  function computeTabDisplay(componentId, id) {
    let tabVisibility = 'none';
    if (id != currentTab) {
      return tabVisibility;
    }

    const tabElement = document.getElementById(`${componentId}-${id}`);
    if (tabElement) {
      if (window.getComputedStyle(tabElement).visibility === 'none') {
        return 'none';
      }
    }

    return id == currentTab ? 'block' : 'none';
  }

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

  const renderTabContent = (id, tab) => {
    const loading = tab?.loading;
    const disable = tab?.disable;
    const visible = tab?.visible;

    const fieldBackgroundColor = tab?.fieldBackgroundColor || background;
    if (visible === false) return null;

    return (
      <div
        data-disabled={disable}
        className={`tab-pane active`}
        style={{
          display: computeTabDisplay(id, tab.id),
          height: parsedHideTabs ? height + 4 : height + 4 - 41,
          position: 'absolute',
          top: parsedHideTabs ? '0px' : '41px',
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
            styles={{ backgroundColor: fieldBackgroundColor || bgColor }}
            darkMode={darkMode}
          />
        )}
      </div>
    );
  };

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
      tabsRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
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
    return true; // Render by default if no specific conditions are met
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
        size={16}
        style={{
          marginRight: '4px',
          marginBottom: '2px',
          ...(currentTab == tab.id ? { color: selectedIcon } : { color: unselectedIcon }),
        }}
        stroke={1.5}
      />
    ) : null;
  }

  const equalSplitWidth = 100 / tabItems?.length || 1;
  return (
    <div
      data-disabled={isDisabled}
      className="card tabs-component"
      style={{
        height: height + 4,
        display: isVisible ? 'flex' : 'none',
        backgroundColor: darkMode ? '#324156' : '#fff',
        boxShadow,
        borderRadius: `${borderRadius}px`,
        overflow: 'hidden',
        ...(padding === 'default' ? { padding: '1px', height: height } : { padding: '0px' }),
        ...(border ? { border: `1px solid ${border}` } : { border: 'none' }),
      }}
      data-cy={dataCy}
      ref={containerRef}
    >
      {isLoading ? (
        <TabsNavShimmer divider={divider} />
      ) : (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              marginLeft: '4px',
              marginRight: '4px',
              backgroundColor: headerBackground,
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

            <ul
              ref={tabsRef}
              className="nav"
              data-bs-toggle="tabs"
              style={{
                position: 'relative',
                zIndex: 2,
                display: parsedHideTabs ? 'none' : 'flex',
                backgroundColor: headerBackground,
                overflowX: 'auto',
                whiteSpace: 'nowrap',
                flexWrap: 'nowrap',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                scrollBehavior: 'smooth',
                flexGrow: 1,
              }}
            >
              {tabItems
                ?.filter((tab) => tab?.visible !== false)
                ?.map((tab) => (
                  <div
                    key={tab.id}
                    style={{ zIndex: 3, ...(tabWidth == 'split' ? { minWidth: 'auto' } : { minWidth: '91px' }) }}
                  >
                    <li
                      className={`nav-item ${currentTab == tab.id ? 'active' : ''}`}
                      style={{
                        opacity: tab?.disabled && '0.5',
                        width: tabWidth == 'split' && equalSplitWidth + '%',
                        overflow: 'hidden',
                        backgroundColor: headerBackground,
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 'bold',
                        padding: '0.2rem 0rem',
                        marginBottom: '4px',
                        marginTop: '4px',
                        cursor: 'pointer',
                        ...(tabWidth == 'split' ? { minWidth: 'auto' } : { minWidth: '56px' }),
                      }}
                      onClick={() => {
                        if (currentTab == tab.id) return;

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
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          textAlign: 'center',
                          fontWeight: '500',
                          background: isHovered && hoveredTabId === tab.id ? hoverBackground : 'transparent',
                          borderRadius: '6px',
                          width: '100%',
                          padding: '.25rem 1rem',
                          ...(currentTab == tab.id ? { color: selectedText } : { color: unselectedText }),
                        }}
                      >
                        <span>{getTabIcon(tab)}</span>
                        {tab.title}
                      </div>
                    </li>
                    <div
                      style={{
                        position: 'relative',
                      }}
                    >
                      {currentTab === tab.id ? (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '0px',
                            height: '0.25rem',
                            width: '100%',
                            background: accent,
                            zIndex: 2,
                          }}
                        ></div>
                      ) : (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '0px',
                            height: '0.1rem',
                            width: '100%',
                            background: divider,
                            zIndex: 2,
                          }}
                        ></div>
                      )}
                    </div>
                  </div>
                ))}
              <div
                style={{
                  position: 'absolute',
                  bottom: '0px',
                  height: '0.1rem',
                  width: '100%',
                  background: divider,
                  zIndex: 2,
                }}
              ></div>
            </ul>
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
          <div
            style={{
              position: 'absolute',
              height: '0.1rem',
              bottom: '0px',
              width: '100%',
              opacity: 1,
              zIndex: 1,
              background: divider,
            }}
          ></div>
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
        tabItems?.map((tab, index) => (
          <div
            className={`tab-content ${
              transition == 'slide' && currentTab === tab.id ? 'tab-slide-in' : 'tab-slide-out'
            }`}
            ref={(newCurrent) => {
              if (currentTab == tab.id) {
                parentRef.current = newCurrent;
              }
            }}
            style={{
              ...(transition == 'slide'
                ? {
                    transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
                    transform:
                      currentTab === tab.id
                        ? 'translateX(0%)'
                        : findTabIndex(currentTab) > index
                        ? 'translateX(-100%)'
                        : 'translateX(100%)',
                  }
                : {}),
            }}
            id={`${id}-${tab.id}`}
            key={tab.id}
          >
            {shouldRenderTabContent(tab) && renderTabContent(id, tab)}

            {/* {tab.id == currentTab && <SubContainer id={`${id}-${tab.id}`} canvasHeight={'200'} canvasWidth={width} />} */}
          </div>
        ))
      )}
    </div>
  );
};
