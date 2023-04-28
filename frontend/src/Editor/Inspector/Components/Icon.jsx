import React, { useRef, useState } from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../EventManager';
import { renderElement } from '../Utils';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import { SearchBox } from '@/_components/SearchBox';
// eslint-disable-next-line import/no-unresolved
import * as Icons from '@tabler/icons-react';
import { VirtuosoGrid } from 'react-virtuoso';

export function Icon({ componentMeta, darkMode, ...restProps }) {
  const {
    layoutPropertyChanged,
    component,
    dataQueries,
    paramUpdated,
    currentState,
    eventsChanged,
    apps,
    allComponents,
    pages,
  } = restProps;

  const [searchText, setSearchText] = useState('');
  const [showPopOver, setPopOverVisibility] = useState(false);
  const iconList = useRef(Object.keys(Icons));

  const searchIcon = (text) => {
    if (searchText === text) return;
    setSearchText(text);
  };

  const filteredIcons =
    searchText === ''
      ? iconList.current
      : iconList.current.filter((icon) => icon?.toLowerCase().includes(searchText ? searchText.toLowerCase() : ''));

  const onIconSelect = (icon) => {
    paramUpdated({ name: 'icon' }, 'value', icon, 'properties');
  };

  const eventPopover = () => {
    return (
      <Popover
        id="popover-basic"
        style={{ width: '460px', maxWidth: '460px' }}
        className={`${darkMode && 'popover-dark-themed theme-dark'} shadow icon-widget-popover`}
      >
        <Popover.Header>
          <SearchBox onSubmit={searchIcon} width="100%" />
        </Popover.Header>
        <Popover.Body>
          <div className="row">
            {
              <VirtuosoGrid
                style={{ height: 300 }}
                totalCount={filteredIcons.length}
                listClassName="icon-list-wrapper"
                itemClassName="icon-list"
                itemContent={(index) => {
                  if (filteredIcons[index] === undefined || filteredIcons[index] === 'createReactComponent')
                    return null;
                  // eslint-disable-next-line import/namespace
                  const IconElement = Icons[filteredIcons[index]];
                  return (
                    <div
                      className="icon-element p-2"
                      onClick={() => {
                        onIconSelect(filteredIcons[index]);
                        setPopOverVisibility(false);
                      }}
                    >
                      <IconElement
                        color={`${darkMode ? '#fff' : '#000'}`}
                        stroke={1.5}
                        strokeLinejoin="miter"
                        style={{ width: '24px', height: '24px' }}
                      />
                    </div>
                  );
                }}
              />
            }
          </div>
        </Popover.Body>
      </Popover>
    );
  };

  function renderIconPicker() {
    const icon = component.component.definition.properties.icon;
    // eslint-disable-next-line import/namespace
    const IconElement = Icons[icon.value];
    return (
      <>
        <div className="mb-2 field">
          <label className="form-label">Icon</label>
        </div>
        <div className="card mb-3">
          <div className="card-body p-0">
            <div className="field">
              <OverlayTrigger
                trigger="click"
                placement={'left'}
                show={showPopOver}
                onToggle={(showing) => setPopOverVisibility(showing)}
                rootClose={true}
                overlay={eventPopover()}
              >
                <div className="row p-2" role="button">
                  <div className="col-auto">
                    <IconElement
                      color={`${darkMode ? '#fff' : '#000'}`}
                      stroke={1.5}
                      strokeLinejoin="miter"
                      style={{ width: '20px', height: '20px' }}
                    />
                  </div>
                  <div className="col text-truncate">{icon.value}</div>
                </div>
              </OverlayTrigger>
            </div>
          </div>
        </div>
      </>
    );
  }

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
        pages={pages}
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
}
