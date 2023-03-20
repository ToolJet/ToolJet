import React, { useRef, useState, useEffect } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
import { resolveReferences, resolveWidgetFieldValue, isExpectedDataType } from '@/_helpers/utils';

export const Tabs = function Tabs({
  id,
  component,
  width,
  height,
  containerProps,
  currentState,
  removeComponent,
  setExposedVariable,
  fireEvent,
  registerAction,
  styles,
  darkMode,
  dataCy,
}) {
  const { tabWidth } = styles;

  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;
  const defaultTab = component.definition.properties.defaultTab.value;
  // config for tabs. Includes title
  const tabs = isExpectedDataType(resolveReferences(component.definition.properties.tabs.value, currentState), 'array');
  let parsedTabs = tabs;
  parsedTabs = resolveWidgetFieldValue(parsedTabs, currentState);
  const hideTabs = component.definition.properties?.hideTabs?.value ?? false;

  // renderOnlyActiveTab - TRUE (renders only the content of the active tab)
  // renderOnlyActiveTab - FALSE (renders all the content irrespective of the active tab to persist value from other tabs)
  const renderOnlyActiveTab = component.definition.properties?.renderOnlyActiveTab?.value ?? false;

  // set index as id if id is not provided
  parsedTabs = parsedTabs.map((parsedTab, index) => ({ ...parsedTab, id: parsedTab.id ? parsedTab.id : index }));

  // Highlight color - for active tab text and border
  const highlightColor = component.definition.styles?.highlightColor?.value ?? '#f44336';
  let parsedHighlightColor = highlightColor;
  parsedHighlightColor = resolveWidgetFieldValue(highlightColor, currentState);

  // Default tab
  let parsedDefaultTab = defaultTab;
  parsedDefaultTab = resolveWidgetFieldValue(parsedDefaultTab, currentState, 1);

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  const parsedHideTabs = typeof hideTabs !== 'boolean' ? resolveWidgetFieldValue(hideTabs, currentState) : hideTabs;
  const parsedRenderOnlyActiveTab =
    typeof renderOnlyActiveTab !== 'boolean'
      ? resolveWidgetFieldValue(renderOnlyActiveTab, currentState)
      : renderOnlyActiveTab;

  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) {
    console.log(err);
  }

  const parentRef = useRef(null);
  const [currentTab, setCurrentTab] = useState(parsedDefaultTab);
  const [bgColor, setBgColor] = useState('#fff');

  useEffect(() => {
    setCurrentTab(parsedDefaultTab);
  }, [parsedDefaultTab]);

  useEffect(() => {
    setExposedVariable('currentTab', currentTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab]);

  useEffect(() => {
    const currentTabData = parsedTabs.filter((tab) => tab.id === currentTab);
    setBgColor(currentTabData[0]?.backgroundColor ? currentTabData[0]?.backgroundColor : darkMode ? '#324156' : '#fff');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentState, currentTab]);

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

  registerAction(
    'setTab',
    async function (id) {
      if (id) {
        setCurrentTab(id);
        setExposedVariable('currentTab', id).then(() => fireEvent('onTabSwitch'));
      }
    },
    [setCurrentTab]
  );

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
      />
    </div>
  );

  return (
    <div
      data-disabled={parsedDisabledState}
      className="jet-tabs card"
      style={{ height, display: parsedWidgetVisibility ? 'flex' : 'none', backgroundColor: bgColor }}
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
              !tab?.disabled && setCurrentTab(tab.id);
              !tab?.disabled && setExposedVariable('currentTab', tab.id).then(() => fireEvent('onTabSwitch'));
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
          {parsedRenderOnlyActiveTab ? tab.id === currentTab && renderTabContent(id, tab) : renderTabContent(id, tab)}
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
