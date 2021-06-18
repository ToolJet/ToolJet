import React, { useState } from 'react';
import { DraggableBox } from './DraggableBox';
import Fuse from 'fuse.js';
import { result } from 'lodash';

export const WidgetManager = function WidgetManager({ componentTypes, zoomLevel, currentLayout }) {
  const [filteredComponents, setFilteredComponents] = useState(componentTypes);

  function filterComponents(value) {
    if (value != '') {
      const fuse = new Fuse(filteredComponents, { keys: ['component'] });
      const results = fuse.search(value);
      setFilteredComponents(results.map((result) => result.item));
    } else {
      setFilteredComponents(componentTypes);
    }
  }

  function renderComponentCard(component, index) {
    return (
      <DraggableBox
        key={index}
        index={index}
        component={component}
        zoomLevel={zoomLevel}
        currentLayout={currentLayout}
      />
    );
  }

  return (
    <div className="components-container m-2">
      <div className="input-icon">
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Search…"
          onChange={(e) => filterComponents(e.target.value)}
        />
      </div>
      <div className="col-sm-12 col-lg-12 row">
        {filteredComponents.map((component, i) => renderComponentCard(component, i))}
      </div>
    </div>
  );
};
