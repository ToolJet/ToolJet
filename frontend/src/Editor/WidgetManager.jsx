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
    const formSection = { title: 'forms', items: [] };
    const integrationSection = { title: 'integrations', items: [] };
    const otherSection = { title: 'others', items: [] };

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
    ];
    const integrationItems = ['Map'];

    filteredComponents.forEach((f) => {
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
    <div className="components-container mx-3 mt-3">
      <div className="input-icon">
        <input
          type="text"
          className="form-control mb-2"
          placeholder="Search…"
          value={searchQuery}
          onChange={(e) => handleSearchQueryChange(e)}
        />
      </div>
      <div className="widgets-list col-sm-12 col-lg-12 row">{segregateSections()}</div>
    </div>
  );
};

//  <Tab.Container id="list-group-tabs-example" defaultActiveKey="#alldatasources">
//         <Row>
//           <Col sm={6} md={4} className="modal-sidebar">
//             <ListGroup className="datasource-lists-modal" variant="flush">
//               {dataSourceList.map((datasource) => (
//                 <ListGroup.Item key={datasource.key} eventKey={datasource.key}>
//                   {datasource.type}
//                 </ListGroup.Item>
//               ))}
//             </ListGroup>
//             <div className="datasource-modal-sidebar-footer">
//               <p className="text-black-50">
//                 Can&apos;t find yours
//                 <br />
//                 <a href="#">Suggest</a>
//               </p>
//             </div>
//           </Col>

//           <Col style={{ left: '25%' }} className="modal-body-content mt-2">
//             <div className="input-icon modal-searchbar mt-3">
//               {/* <input
//                   type="text"
//                   className="form-control mb-2"
//                   placeholder="Search…"
//                   // value={searchQuery}
//                   // onChange={(e) => handleSearchQueryChange(e)}
//                 /> */}
//                 <input className="form-control mr-sm-2" type="search" placeholder="Search" aria-label="Search" />
//                 </div>
//                 <br />
//                 <div className="selected-datasource-list-content">
//                   <Tab.Content>
//                     {dataSourceList.map((datasource) => (
//                       <Tab.Pane eventKey={datasource.key} key={datasource.key}>
//                         {datasource.card()}
//                       </Tab.Pane>
//                     ))}
//                   </Tab.Content>
//                 </div>
//               </Col>
//             </Row>
//           </Tab.Container>
