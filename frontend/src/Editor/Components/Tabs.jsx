import React, { useRef, useState, useEffect } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
import { resolveWidgetFieldValue, isExpectedDataType } from '@/_helpers/utils';
import { handleLowPriorityWork } from '@/_helpers/editorHelpers';

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
}) {
  const { tabWidth, boxShadow } = styles;

  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;
  const defaultTab = component.definition.properties.defaultTab.value;
  // config for tabs. Includes title
  const tabs = isExpectedDataType(resolveWidgetFieldValue(component.definition.properties?.tabs?.value), 'array');
  let parsedTabs = tabs;
  parsedTabs = resolveWidgetFieldValue(parsedTabs);
  const hideTabs = component.definition.properties?.hideTabs?.value ?? false;

  //* renderOnlyActiveTab - TRUE (renders only the content of the active tab)
  //* renderOnlyActiveTab - FALSE (renders all the content irrespective of the active tab to persist value from other tabs)
  const renderOnlyActiveTab = component.definition.properties?.renderOnlyActiveTab?.value ?? false;

  // set index as id if id is not provided
  parsedTabs = parsedTabs.map((parsedTab, index) => ({ ...parsedTab, id: parsedTab.id ? parsedTab.id : index }));

  // Highlight color - for active tab text and border
  const highlightColor = component.definition.styles?.highlightColor?.value ?? '#f44336';
  let parsedHighlightColor = highlightColor;
  parsedHighlightColor = resolveWidgetFieldValue(highlightColor);

  // Default tab
  let parsedDefaultTab = defaultTab;
  parsedDefaultTab = resolveWidgetFieldValue(parsedDefaultTab, 1);

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
  const [bgColor, setBgColor] = useState('#fff');

  const [tabSwitchingOnProgress, setTabSwitchingOnProgress] = useState(false);

  useEffect(() => {
    setCurrentTab(parsedDefaultTab);
  }, [parsedDefaultTab]);

  useEffect(() => {
    const currentTabData = parsedTabs.filter((tab) => tab.id === currentTab);
    setBgColor(currentTabData[0]?.backgroundColor ? currentTabData[0]?.backgroundColor : darkMode ? '#324156' : '#fff');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, darkMode]);

  function computeTabVisibility(componentId, id) {
    let tabVisibility = 'hidden';
    if (id !== currentTab) {
      return tabVisibility;
    }

    const tabElement = document.getElementById(`${componentId}-${id}`);
    if (tabElement) {
      if (window.getComputedStyle(tabElement).visibility === 'hidden') {
        return 'hidden';
      }
    }

    return id === currentTab ? 'visible' : 'hidden';
  }

  useEffect(() => {
    const exposedVariables = {
      setTab: async function (id) {
        if (id !== undefined) { 
          const tabId = Number(id); 
          setCurrentTab(tabId);
          setExposedVariable('currentTab', tabId);
          fireEvent('onTabSwitch')        
        }
      },
      currentTab: currentTab,
    };
    setExposedVariables(exposedVariables);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCurrentTab, currentTab]);

  const renderTabContent = (id, tab) => (
    <div
      className={`tab-pane active`}
      style={{
        visibility: computeTabVisibility(id, tab.id),
        height: parsedHideTabs ? height : height - 41,
        position: 'absolute',
        top: parsedHideTabs ? '0px' : '41px',
        width: '100%',
      }}
    >
      <SubContainer
        parent={`${id}-${tab.id}`}
        {...containerProps}
        parentRef={parentRef}
        removeComponent={removeComponent}
        containerCanvasWidth={width - 4}
        parentComponent={component}
        readOnly={tab.id !== currentTab}
      />
    </div>
  );

  function shouldRenderTabContent(tab) {
    if (tabSwitchingOnProgress || parsedRenderOnlyActiveTab) {
      return tab.id === currentTab;
    }
    return true; // Render by default if no specific conditions are met
  }

  return (
    <div
      data-disabled={parsedDisabledState}
      className="jet-tabs card"
      style={{ height, display: parsedWidgetVisibility ? 'flex' : 'none', backgroundColor: bgColor, boxShadow }}
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
            style={{ opacity: tab?.disabled && '0.5', width: tabWidth == 'split' && '33.3%' }}
            onClick={() => {
              setTabSwitchingOnProgress(true);

              !tab?.disabled && setCurrentTab(tab.id);
              !tab?.disabled && setExposedVariable('currentTab', tab.id);

              handleLowPriorityWork(() => {
                fireEvent('onTabSwitch');
                setTabSwitchingOnProgress(false);
              });
            }}
            key={tab.id}
          >
            <a
              className={`nav-link ${currentTab == tab.id ? 'active' : ''}`}
              style={{
                color: currentTab == tab.id && parsedHighlightColor,
                borderBottom: currentTab == tab.id && `1px solid ${parsedHighlightColor}`,
                overflowWrap: 'anywhere',
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
            if (currentTab === tab.id) {
              parentRef.current = newCurrent;
            }
          }}
          id={`${id}-${tab.id}`}
          key={tab.id}
        >
          {shouldRenderTabContent(tab) && renderTabContent(id, tab)}

          {tab.id === currentTab && (
            <SubCustomDragLayer
              parent={`${id}-${tab.id}`}
              parentRef={parentRef}
              currentLayout={containerProps.currentLayout}
              containerCanvasWidth={width}
            />
          )}
        </div>
      ))}
    </div>
  );
};
