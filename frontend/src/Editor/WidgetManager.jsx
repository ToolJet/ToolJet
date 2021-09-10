import React, { useState } from 'react';
import { DraggableBox } from './DraggableBox';
import Fuse from 'fuse.js';
import { isEmpty } from 'lodash';

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

  function renderList(header, items) {
    if (isEmpty(items)) return null;
    return (
      <>
        <span className="m-1 widget-header">{header}</span>
        {items.map((component, i) => renderComponentCard(component, i))}
      </>
    );
  }

  function segregateSections() {
    if (filteredComponents.length === 0) {
      return (
        <div class="empty">
          {/* <div class="empty-img">
            <img src="./static/illustrations/undraw_printing_invoices_5r4r.svg" height="128" alt="" />
          </div> */}
          <p class="empty-title">No results found</p>
          <p class="empty-subtitle text-muted">Try adjusting your search or filter to find what you're looking for.</p>
        </div>
      );
    }
    const commonSection = { title: 'commonly used', items: [] };
    const formSection = { title: 'forms', items: [] };
    const integrationSection = { title: 'integrations', items: [] };
    const otherSection = { title: 'others', items: [] };

    const commonItems = ['Table', 'Chart', 'Button', 'Text', 'Datepicker'];
    const formItems = ['TextInput', 'NumberInput', 'Textarea', 'Dropdown', 'Multiselect', 'RichTextEditor', 'Checkbox', 'Radio-button', 'Datepicker'];
    const integrationItems = ['Map'];

    filteredComponents.map((f) => {
      if (commonItems.includes(f.name)) commonSection.items.push(f);
      if (formItems.includes(f.name)) formSection.items.push(f);
      else if (integrationItems.includes(f.name)) integrationSection.items.push(f);
      else otherSection.items.push(f);
    });

    return (
      <>
        {renderList(commonSection.title, commonSection.items)}
        {renderList(formSection.title, formSection.items)}
        {renderList(otherSection.title, otherSection.items)}
        {renderList(integrationSection.title, integrationSection.items)}
      </>
    );
  }

  return (
    <div className="components-container m-1">
      <div className="input-icon">
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Search…"
          onChange={(e) => filterComponents(e.target.value)}
        />
      </div>
      <div className="widgets-list col-sm-12 col-lg-12 row">{segregateSections()}</div>
    </div>
  );
};
