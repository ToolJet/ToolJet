import React, { useEffect, useRef, useState } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';
import { resolveReferences, resolveWidgetFieldValue } from '@/_helpers/utils';

export const Tabs = function Tabs({ id, component, height, containerProps, currentState, removeComponent }) {
  const widgetVisibility = component.definition.styles?.visibility?.value ?? true;
  const disabledState = component.definition.styles?.disabledState?.value ?? false;
  const defaultTab = component.definition.properties.defaultTab.value;

  // config for tabs. Includes title
  const tabs = component.definition.properties?.tabs?.value ?? [];
  let parsedTabs = tabs;
  parsedTabs = resolveWidgetFieldValue(parsedTabs, currentState);

  // Highlight color - for active tab text and border
  const highlightColor = component.definition.styles?.highlightColor?.value ?? '';
  let parsedHighlightColor = highlightColor;
  parsedHighlightColor = resolveWidgetFieldValue(highlightColor, currentState);

  // Default tab
  let parsedDefaultTab = defaultTab;
  parsedDefaultTab = resolveWidgetFieldValue(parsedDefaultTab, currentState, 1);

  const parsedDisabledState =
    typeof disabledState !== 'boolean' ? resolveWidgetFieldValue(disabledState, currentState) : disabledState;

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

  return (
    <div
      data-disabled={parsedDisabledState}
      className="jet-tabs card"
      onClick={(e) => { containerProps.onComponentClick(id, component) }}
      style={computedStyles}
    >
      <ul class="nav nav-tabs" data-bs-toggle="tabs">

        {parsedTabs.map((tab, index) =>
          <li class="nav-item" onClick={() => setCurrentTab(index + 1)}>
            <a class={`nav-link ${currentTab === index + 1 ? 'active' : ''}`} style={currentTab === index + 1 ? { color: parsedHighlightColor, borderBottom: `1px solid ${parsedHighlightColor}` } : {}}>{tab.title}</a>
          </li>
        )}

      </ul>
      <div class="tab-content" ref={parentRef} id={`${id}-${currentTab}`}>
        <div class="tab-pane active show">
          <SubContainer parent={`${id}-${currentTab}`} {...containerProps} parentRef={parentRef} removeComponent={removeComponent} />
          <SubCustomDragLayer parent={id} parentRef={parentRef} currentLayout={containerProps.currentLayout} />
        </div>
      </div>

    </div>
  );
};
