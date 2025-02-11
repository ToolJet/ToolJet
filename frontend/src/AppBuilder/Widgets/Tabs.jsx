import React, { useRef, useState, useEffect } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { resolveWidgetFieldValue, isExpectedDataType } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import Spinner from '@/_ui/Spinner';
import { useExposeState } from '@/AppBuilder/_hooks/useExposeVariables';
import SolidIcon from '@/_ui/Icon/SolidIcons';

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
      setTabDisable: async function (id) {
        setTabItems((prevTabItems) => {
          return prevTabItems.map((tab) => {
            if (tab.id == id) {
              return { ...tab, disable: true };
            }
            return tab;
          });
        });
        setSelectedComponents([]);
      },
      setTabLoading: async function (id) {
        setTabItems((prevTabItems) => {
          return prevTabItems.map((tab) => {
            if (tab.id == id) {
              return { ...tab, loading: !tab.loading };
            }
            return tab;
          });
        });
      },
      setTabVisibility: async function (id) {
        setTabItems((prevTabItems) => {
          return prevTabItems.map((tab) => {
            if (tab.id == id) {
              return { ...tab, visible: !tab.visible };
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
    console.log('logging', tab);

    const fieldBackgroundColor = tab?.fieldBackgroundColor;
    if (visible === false) return null;

    return (
      <div
        data-disabled={disable}
        className={`tab-pane active`}
        style={{
          display: computeTabDisplay(id, tab.id),
          height: parsedHideTabs ? height : height - 41,
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
  }, [tabsRef.current]);

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

  const equalSplitWidth = 100 / tabs?.length || 1;
  return (
    <div
      data-disabled={isDisabled}
      className="card tabs-component"
      style={{ height, display: isVisible ? 'flex' : 'none', backgroundColor: bgColor, boxShadow }}
      data-cy={dataCy}
      ref={containerRef}
    >
      {isLoading ? (
        <div></div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            backgroundColor: darkMode ? '#324156' : '#fff',
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
            className="nav nav-tabs"
            data-bs-toggle="tabs"
            style={{
              zIndex: 1,
              display: parsedHideTabs ? 'none' : 'flex',
              backgroundColor: darkMode ? '#324156' : '#fff',
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
                <li
                  className="nav-item"
                  style={{ opacity: tab?.disabled && '0.5', width: tabWidth == 'split' && equalSplitWidth + '%' }}
                  onClick={() => {
                    if (currentTab == tab.id) return;

                    !tab?.disabled && setCurrentTab(tab.id);
                    !tab?.disabled && setExposedVariable('currentTab', tab.id);
                    fireEvent('onTabSwitch');
                  }}
                  key={tab.id}
                >
                  <a
                    className={`nav-link ${currentTab == tab.id ? 'active' : ''}`}
                    style={{
                      color: currentTab == tab.id && parsedHighlightColor,
                      borderBottom: currentTab == tab.id && `1px solid ${parsedHighlightColor}`,
                      overflowWrap: 'anywhere',
                      ...(tabWidth == 'split' ? { minWidth: 'auto' } : { minWidth: '100px' }),
                    }}
                    ref={(el) => {
                      if (el && currentTab == tab.id) {
                        el.style.setProperty('color', parsedHighlightColor, 'important');
                      }
                    }}
                  >
                    {tab.title}
                  </a>
                </li>
              ))}
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
        tabItems?.map((tab) => (
          <div
            className="tab-content"
            ref={(newCurrent) => {
              if (currentTab == tab.id) {
                parentRef.current = newCurrent;
              }
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
