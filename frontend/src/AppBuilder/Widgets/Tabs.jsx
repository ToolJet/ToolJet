import React, { useRef, useState, useEffect } from 'react';
import { Container as SubContainer } from '@/AppBuilder/AppCanvas/Container';
import { resolveWidgetFieldValue, isExpectedDataType } from '@/_helpers/utils';
import useStore from '@/AppBuilder/_stores/store';
import { TAB_CANVAS_PADDING } from '@/AppBuilder/AppCanvas/appCanvasConstants';
import { useDynamicHeight } from '@/_hooks/useDynamicHeight';
import { shallow } from 'zustand/shallow';

export const Tabs = function Tabs({
  id,
  component,
  width,
  height,
  containerProps,
  removeComponent,
  setExposedVariable,
  setExposedVariables,
  adjustComponentPositions,
  currentLayout,
  fireEvent,
  styles,
  darkMode,
  dataCy,
  properties,
}) {
  const { tabWidth, boxShadow } = styles;
  const { defaultTab, hideTabs, renderOnlyActiveTab, dynamicHeight } = properties;
  const setSelectedComponents = useStore((state) => state.setSelectedComponents);

  const widgetVisibility = styles?.visibility ?? true;
  const disabledState = styles?.disabledState ?? false;
  // config for tabs. Includes title
  const tabs = isExpectedDataType(properties.tabs, 'array');
  let parsedTabs = tabs;
  parsedTabs = resolveWidgetFieldValue(parsedTabs);
  // const hideTabs = component.definition.properties?.hideTabs?.value ?? false;

  //* renderOnlyActiveTab - TRUE (renders only the content of the active tab)
  //* renderOnlyActiveTab - FALSE (renders all the content irrespective of the active tab to persist value from other tabs)
  // const renderOnlyActiveTab = component.definition.properties?.renderOnlyActiveTab?.value ?? false;

  // set index as id if id is not provided
  parsedTabs = parsedTabs.map((parsedTab, index) => ({ ...parsedTab, id: parsedTab.id ? parsedTab.id : index }));

  // Highlight color - for active tab text and border
  const highlightColor = styles?.highlightColor ?? '#f44336';
  let parsedHighlightColor = highlightColor;
  parsedHighlightColor = resolveWidgetFieldValue(highlightColor);

  // Default tab
  let parsedDefaultTab = defaultTab;

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
  const componentCount = useStore(
    (state) => state.getContainerChildrenMapping(`${id}-${currentTab}`)?.length || 0,
    shallow
  );
  const [bgColor, setBgColor] = useState('#fff');

  useDynamicHeight({
    dynamicHeight,
    id,
    height,
    adjustComponentPositions,
    currentLayout,
    isContainer: true,
    value: currentTab,
    componentCount,
  });

  useEffect(() => {
    setCurrentTab(parsedDefaultTab);
  }, [parsedDefaultTab]);

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
      currentTab: currentTab,
    };
    setExposedVariables(exposedVariables);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCurrentTab, currentTab]);

  const renderTabContent = (id, tab) => {
    return (
      <div
        className={`tab-pane active ${properties.dynamicHeight && currentTab === tab.id && `dynamic-${id}`}`}
        activetab={currentTab}
        style={{
          display: computeTabDisplay(id, tab.id),
          height: dynamicHeight ? '100%' : parsedHideTabs ? height : height - 41,
          position: 'relative',
          top: parsedHideTabs ? '0px' : '41px',
          width: '100%',
          padding: TAB_CANVAS_PADDING,
        }}
      >
        <SubContainer
          id={`${id}-${tab.id}`}
          canvasHeight={dynamicHeight ? '100%' : '200'}
          canvasWidth={width}
          allowContainerSelect={true}
          styles={{ backgroundColor: bgColor, overflow: 'hidden auto' }}
          darkMode={darkMode}
          componentType="Tabs"
        />
      </div>
    );
  };

  function shouldRenderTabContent(tab) {
    if (parsedRenderOnlyActiveTab) {
      return tab.id == currentTab;
    }
    return true; // Render by default if no specific conditions are met
  }

  const equalSplitWidth = 100 / tabs?.length || 1;
  return (
    <div
      data-disabled={parsedDisabledState}
      className={`card tabs-component `}
      style={{
        height: dynamicHeight ? '100%' : height,
        display: parsedWidgetVisibility ? 'flex' : 'none',
        backgroundColor: bgColor,
        boxShadow,
      }}
      data-cy={dataCy}
    >
      <ul
        className="nav nav-tabs"
        data-bs-toggle="tabs"
        style={{
          zIndex: 1,
          display: parsedHideTabs && 'none',
          backgroundColor: darkMode ? '#324156' : '#fff',
          margin: '-1px',
        }}
      >
        {parsedTabs.map((tab) => (
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
      {parsedTabs.map((tab) => (
        <div
          className="tab-content"
          ref={(newCurrent) => {
            if (currentTab == tab.id) {
              parentRef.current = newCurrent;
            }
          }}
          id={`${id}-${tab.id}`}
          style={{
            ...(dynamicHeight && currentTab === tab.id && { height: '100%' }),
          }}
          key={tab.id}
        >
          {shouldRenderTabContent(tab) && renderTabContent(id, tab)}

          {/* {tab.id == currentTab && <SubContainer id={`${id}-${tab.id}`} canvasHeight={'200'} canvasWidth={width} />} */}
        </div>
      ))}
    </div>
  );
};
