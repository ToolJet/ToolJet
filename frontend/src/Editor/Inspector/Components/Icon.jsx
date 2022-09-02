import React, { useRef, useEffect, useState } from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../EventManager';
import { renderElement } from '../Utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { SearchBox } from '@/_components/SearchBox';
// eslint-disable-next-line import/no-unresolved
import * as Icons from '@tabler/icons';

export const Icon = ({ componentMeta, darkMode, ...restProps }) => {
  const { layoutPropertyChanged, component, dataQueries, currentState, eventsChanged, apps, allComponents } = restProps;

  const [filteredIcons, setIcons] = useState([]);
  const iconList = useRef([]);
  let IconElemet;

  useEffect(() => {
    iconList.current = Object.keys(Icons);
    setIcons(iconList.current);
  }, []);

  const eventPopover = () => {
    return (
      <Popover
        id="popover-basic"
        style={{ width: '450px', maxWidth: '450px' }}
        className={`${darkMode && 'popover-dark-themed theme-dark'} shadow icon-widget-popover`}
      >
        <Popover.Title>
          <SearchBox
            onSubmit={(searchText) => {
              console.log('searchText--- ', searchText);
              // setIcons(
              //   iconList.current.filter((icon) =>
              //     icon?.toLowerCase().includes(searchText ? searchText.toLowerCase() : '')
              //   )
              // );
            }}
            width="100%"
          />
        </Popover.Title>
        <Popover.Content>
          <div className="row">
            {filteredIcons.map((icon) => {
              IconElemet = Icons[icon];
              return (
                <div className="icon-element p-2" key={icon}>
                  <IconElemet
                    color="black"
                    stroke={3}
                    strokeLinejoin="miter"
                    style={{ width: '24px', height: '24px' }}
                  />
                </div>
              );
            })}
          </div>
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
