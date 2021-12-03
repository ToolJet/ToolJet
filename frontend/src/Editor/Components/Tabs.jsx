import React, { useEffect, useRef, useState } from 'react';
import { SubCustomDragLayer } from '../SubCustomDragLayer';
import { SubContainer } from '../SubContainer';

export const Tabs = function Tabs({
  id,
  component,
  width,
  height,
  containerProps,
  removeComponent,
  properties,
  styles,
}) {
  const { visibility, disabledState, highlightColor } = styles;

  // config for tabs. Includes title
  const tabs = properties.tabs ?? [];

  const computedStyles = {
    height,
    display: visibility ? 'flex' : 'none',
  };

  const parentRef = useRef(null);

  const [currentTab, setCurrentTab] = useState(() => properties.defaultTab);

  useEffect(() => {
    if (!currentTab) {
      setCurrentTab(properties.defaultTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties.defaultTab]);

  return (
    <div
      data-disabled={disabledState}
      className="jet-tabs card"
      onClick={() => {
        containerProps.onComponentClick(id, component);
      }}
      style={computedStyles}
    >
      <ul className="nav nav-tabs" data-bs-toggle="tabs">
        {tabs.map((tab) => (
          <li className="nav-item" onClick={() => setCurrentTab(tab.id)} key={tab.id}>
            <a
              className={`nav-link ${currentTab === tab.id ? 'active' : ''}`}
              style={
                currentTab === tab.id ? { color: highlightColor, borderBottom: `1px solid ${highlightColor}` } : {}
              }
            >
              {tab.title}
            </a>
          </li>
        ))}
      </ul>
      <div className="tab-content" ref={parentRef} id={`${id}-${currentTab}`}>
        <div className="tab-pane active show">
          <SubContainer
            parent={`${id}-${currentTab}`}
            {...containerProps}
            parentRef={parentRef}
            removeComponent={removeComponent}
            containerCanvasWidth={width}
          />
          <SubCustomDragLayer
            parent={id}
            parentRef={parentRef}
            currentLayout={containerProps.currentLayout}
            containerCanvasWidth={width}
          />
        </div>
      </div>
    </div>
  );
};
