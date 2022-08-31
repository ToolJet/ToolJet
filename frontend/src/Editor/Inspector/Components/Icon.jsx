import React from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../EventManager';
import { renderElement } from '../Utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { SearchBox } from '@/_components/SearchBox';

export const Icon = ({ componentMeta, darkMode, ...restProps }) => {
  const {
    layoutPropertyChanged,
    component,
    paramUpdated,
    dataQueries,
    currentState,
    eventsChanged,
    apps,
    allComponents,
  } = restProps;

  const eventPopover = () => {
    return (
      <Popover
        id="popover-basic"
        style={{ width: '350px', maxWidth: '350px' }}
        className={`${darkMode && 'popover-dark-themed theme-dark'} shadow`}
      >
        <Popover.Content>
          <SearchBox
            onSubmit={(text) => {
              console.log(text);
            }}
            width="100%"
          />
        </Popover.Content>
      </Popover>
    );
  };

  const renderIconPicker = () => {
    return (
      <div className="row fx-container">
        <div className="col">
          <div className="field mb-2">
            <OverlayTrigger trigger="click" placement={'left'} rootClose={true} overlay={eventPopover()}>
              <div className="row mx-0 form-control color-picker-input">
                <div
                  className="col-auto"
                  style={{
                    float: 'right',
                    width: '20px',
                    height: '20px',
                  }}
                ></div>
                <small className="col p-0">123</small>
              </div>
            </OverlayTrigger>
          </div>
        </div>
      </div>
    );
  };

  let items = [];

  items.push({
    title: 'Properties',
    children: renderIconPicker(),
  });

  items.push({
    title: 'Events',
    isOpen: false,
    children: (
      <EventManager
        component={component}
        componentMeta={componentMeta}
        currentState={currentState}
        dataQueries={dataQueries}
        components={allComponents}
        eventsChanged={eventsChanged}
        apps={apps}
        darkMode={darkMode}
      />
    ),
  });

  items.push({
    title: 'General',
    isOpen: false,
    children: (
      <>
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'tooltip',
          'general',
          currentState,
          allComponents
        )}
      </>
    ),
  });

  items.push({
    title: 'Layout',
    isOpen: false,
    children: (
      <>
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'showOnDesktop',
          'others',
          currentState,
          allComponents
        )}
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'showOnMobile',
          'others',
          currentState,
          allComponents
        )}
      </>
    ),
  });

  return <Accordion items={items} />;
};
