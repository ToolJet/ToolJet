// Same Code stub as pdfAdditionalActions.spec.jsx: the CodeMirror tree cannot run in jsdom.
jest.mock('../Elements/Code', () => {
  const React = require('react');
  return { Code: () => React.createElement('div') };
});
// react-beautiful-dnd needs real layout to drag; capture the drop handler and drive it directly.
let capturedOnDragEnd;
jest.mock('react-beautiful-dnd', () => {
  const React = require('react');
  const provided = {
    innerRef: () => {},
    draggableProps: {},
    dragHandleProps: {},
    droppableProps: {},
    placeholder: null,
  };
  return {
    DragDropContext: ({ onDragEnd, children }) => {
      capturedOnDragEnd = onDragEnd;
      return React.createElement(React.Fragment, null, children);
    },
    Droppable: ({ children }) => children(provided, {}),
    Draggable: ({ children }) => children(provided, {}),
  };
});

import React from 'react';
import { render } from '@testing-library/react';
import { seedApp, componentDefinition } from '@/test/app-builder';
import { Tags } from '../Components/Tags';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager/componentTypes';

const option = (title) => ({ title, visible: { value: true } });

test('[Tags-INSP-001] dragging an option to a new place saves the options in the new order', () => {
  // Break this catches: the reorder handler calling paramUpdated with the wrong argument shape,
  // so the new order is never saved and the canvas keeps the old order.
  seedApp({ tags1: componentDefinition('tags1', 'tags1', 'Tags') });
  const paramUpdated = jest.fn();
  const options = ['success', 'info', 'warning', 'danger'].map(option);
  render(
    <Tags
      component={{
        id: 'tags1',
        component: {
          component: 'Tags',
          properties: componentTypeDefinitionMap.Tags.properties,
          definition: { properties: { advanced: { value: '{{false}}' }, options: { value: options } } },
        },
      }}
      componentMeta={componentTypeDefinitionMap.Tags}
      paramUpdated={paramUpdated}
      dataQueries={[]}
      eventsChanged={() => {}}
      allComponents={{}}
      currentState={{}}
      pages={[]}
    />
  );

  capturedOnDragEnd({ source: { index: 0 }, destination: { index: 1 } });

  expect(paramUpdated).toHaveBeenCalledTimes(1);
  const [param, attr, value, paramType] = paramUpdated.mock.calls[0];
  expect(param).toEqual({ name: 'options' });
  expect(attr).toBe('value');
  expect(paramType).toBe('properties');
  expect(value.map((o) => o.title)).toEqual(['info', 'success', 'warning', 'danger']);
});
