import React, { useRef, useState, useEffect, createRef } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

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
}) {
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;
  const defaultTab = component.definition.properties.defaultTab.value;

  // config for tabs. Includes title
  const tabs = component.definition.properties?.tabs?.value ?? [];
  let parsedTabs = tabs;
  parsedTabs = resolveWidgetFieldValue(parsedTabs, currentState);
  const hideTabs = component.definition.properties?.hideTabs?.value ?? false;

  // set index as id if id is not provided
  parsedTabs = parsedTabs.map((parsedTab, index) => ({ ...parsedTab, id: parsedTab.id ? parsedTab.id : index }));

  // Highlight color - for active tab text and border
  const highlightColor = component.definition.styles?.highlightColor?.value ?? '';
  let parsedHighlightColor = highlightColor;
  parsedHighlightColor = resolveWidgetFieldValue(highlightColor, currentState);

  // Default tab
  let parsedDefaultTab = defaultTab;
  parsedDefaultTab = resolveWidgetFieldValue(parsedDefaultTab, currentState, 1);

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

  const parsedHideTabs = typeof hideTabs !== 'boolean' ? resolveWidgetFieldValue(hideTabs, currentState) : hideTabs;

  let parsedWidgetVisibility = widgetVisibility;

  try {
    parsedWidgetVisibility = resolveReferences(parsedWidgetVisibility, currentState, []);
  } catch (err) {
    console.log(err);
  }

  const computedStyles = {
    height,
    display: parsedWidgetVisibility ? 'flex' : 'none',
  };

  const parentRef = useRef(null);
  const [currentTab, setCurrentTab] = useState(parsedDefaultTab);

  useEffect(() => {
    setCurrentTab(parsedDefaultTab);
  }, [parsedDefaultTab]);

  return (
    <div data-disabled={parsedDisabledState} className="jet-tabs card" style={computedStyles}>
      <ul className="nav nav-tabs" data-bs-toggle="tabs" style={{ display: parsedHideTabs && 'none' }}>
        {parsedTabs.map((tab) => (
          <li
            className="nav-item"
            onClick={() => {
              setCurrentTab(tab.id);
              setExposedVariable('currentTab', tab.id).then(() => fireEvent('onTabSwitch'));
            }}
            key={tab.id}
          >
            <a
              className={`nav-link ${currentTab == tab.id ? 'active' : ''}`}
              style={
                currentTab == tab.id
                  ? { color: parsedHighlightColor, borderBottom: `1px solid ${parsedHighlightColor}` }
                  : {}
              }
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
          <div
            className={`tab-pane active`}
            style={{
              opacity: tab.id === currentTab ? 1 : 0,
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
              containerCanvasWidth={width}
              parentComponent={component}
            />
          </div>
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
