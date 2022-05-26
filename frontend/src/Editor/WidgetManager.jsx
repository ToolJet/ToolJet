import React, { useState } from 'react';
import { DraggableBox } from './DraggableBox';
import Fuse from 'fuse.js';
import { isEmpty } from 'lodash';

export const WidgetManager = function WidgetManager({ componentTypes, zoomLevel, currentLayout, darkMode }) {
  const [filteredComponents, setFilteredComponents] = useState(componentTypes);
  const [searchQuery, setSearchQuery] = useState('');

  function handleSearchQueryChange(e) {
    const { value } = e.target;

    setSearchQuery(value);
    filterComponents(value);
  }

  function filterComponents(value) {
    if (value !== '') {
      const fuse = new Fuse(componentTypes, { keys: ['component'] });
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
        <div className="empty">
          {/* <div class="empty-img">
            <img src="./static/illustrations/undraw_printing_invoices_5r4r.svg" height="128" alt="" />
          </div> */}
          <p className="empty-title">No results found</p>
          <p className={`empty-subtitle ${darkMode ? 'text-white-50' : 'text-secondary'}`}>
            Try adjusting your search or filter to find what you&apos;re looking for.
          </p>
          <button
            className="btn btn-sm btn-outline-azure mt-3"
            onClick={() => {
              setFilteredComponents(componentTypes);
              setSearchQuery('');
            }}
          >
            clear query
          </button>
        </div>
      );
    }
    const commonSection = { title: 'commonly used', items: [] };
    const layoutsSection = { title: 'layouts', items: [] };
    const formSection = { title: 'forms', items: [] };
    const integrationSection = { title: 'integrations', items: [] };
    const otherSection = { title: 'others', items: [] };
    const allWidgets = [];

    const commonItems = ['Table', 'Chart', 'Button', 'Text', 'Datepicker'];
    const formItems = [
      'TextInput',
      'NumberInput',
      'PasswordInput',
      'Textarea',
      'ToggleSwitch',
      'Dropdown',
      'Multiselect',
      'RichTextEditor',
      'Checkbox',
      'Radio-button',
      'Datepicker',
      'DateRangePicker',
      'FilePicker',
      'StarRating',
    ];
    const integrationItems = ['Map'];
    const layoutItems = ['Container', 'Listview', 'Tabs', 'Modal'];

    filteredComponents.forEach((f) => {
      if (searchQuery) allWidgets.push(f);
      if (commonItems.includes(f.name)) commonSection.items.push(f);
      if (formItems.includes(f.name)) formSection.items.push(f);
      else if (integrationItems.includes(f.name)) integrationSection.items.push(f);
      else if (layoutItems.includes(f.name)) layoutsSection.items.push(f);
      else otherSection.items.push(f);
    });

    if (allWidgets.length > 0) {
      return <>{renderList(undefined, allWidgets)}</>;
    } else {
      return (
        <>
          {renderList(commonSection.title, commonSection.items)}
          {renderList(layoutsSection.title, layoutsSection.items)}
          {renderList(formSection.title, formSection.items)}
          {renderList(otherSection.title, otherSection.items)}
          {renderList(integrationSection.title, integrationSection.items)}
        </>
      );
    }
  }

  return (
    <div className="components-container mx-3">
      <div className="input-icon">
        <input
          type="text"
          className="form-control mt-3 mb-2"
          placeholder="Search…"
          value={searchQuery}
          onChange={(e) => handleSearchQueryChange(e)}
          data-cy="widget-search-box"
        />
      </div>
      <div className="widgets-list col-sm-12 col-lg-12 row">{segregateSections()}</div>
    </div>
  );
};
