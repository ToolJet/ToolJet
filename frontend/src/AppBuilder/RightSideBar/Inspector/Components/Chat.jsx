import React from 'react';
import { renderElement } from '../Utils';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../EventManager';

export const Chat = ({
  dataQueries,
  component,
  paramUpdated,
  componentMeta,
  components,
  currentState,
  allComponents,
  apps,
  eventsChanged,
  darkMode,
  pages,
  layoutPropertyChanged,
}) => {
  let items = [];

  // Data accordion
  items.push({
    title: 'Data',
    children: (
      <>
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'chatTitle',
          'properties',
          currentState,
          components,
          darkMode
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'initialChat',
          'properties',
          currentState,
          components,
          darkMode
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'placeholder',
          'properties',
          currentState,
          components,
          darkMode
        )}
      </>
    ),
  });

  // User Settings accordion
  items.push({
    title: 'Settings',
    children: (
      <>
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'userName',
          'properties',
          currentState,
          components,
          darkMode
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'userAvatar',
          'properties',
          currentState,
          components,
          darkMode
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'respondentName',
          'properties',
          currentState,
          components,
          darkMode
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'respondentAvatar',
          'properties',
          currentState,
          components,
          darkMode
        )}
      </>
    ),
  });

  // Events accordion
  items.push({
    title: 'Events',
    children: (
      <EventManager
        sourceId={component?.id}
        eventSourceType="component"
        eventMetaDefinition={componentMeta}
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

  // Additional Actions accordion
  items.push({
    title: 'Additional Actions',
    children: (
      <>
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'visibility',
          'properties',
          currentState,
          components,
          darkMode
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'disableInput',
          'properties',
          currentState,
          components,
          darkMode
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'loadingHistory',
          'properties',
          currentState,
          components,
          darkMode
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'loadingResponse',
          'properties',
          currentState,
          components,
          darkMode
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'enableClearHistoryButton',
          'properties',
          currentState,
          components,
          darkMode
        )}
        {renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          'enableDownloadHistoryButton',
          'properties',
          currentState,
          components,
          darkMode
        )}
      </>
    ),
  });

  // Devices accordion
  items.push({
    title: 'Devices',
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
          components
        )}
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'showOnMobile',
          'others',
          currentState,
          components
        )}
      </>
    ),
  });

  return <Accordion items={items} />;
};
