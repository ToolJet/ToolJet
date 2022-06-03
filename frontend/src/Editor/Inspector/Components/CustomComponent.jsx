import React from 'react';
import { renderElement } from '../Utils';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import Accordion from '@/_ui/Accordion';

export const CustomComponent = function CustomComponent({
  dataQueries,
  component,
  paramUpdated,
  componentMeta,
  components,
  darkMode,
  currentState,
  layoutPropertyChanged,
}) {
  const code = component.component.definition.properties.code;
  const args = component.component.definition.properties.data;

  let items = [];

  items.push({
    title: 'Data',
    children: (
      <CodeHinter
        currentState={currentState}
        initialValue={args.value ?? {}}
        theme={darkMode ? 'monokai' : 'base16-light'}
        onChange={(value) => paramUpdated({ name: 'data' }, 'value', value, 'properties')}
        componentName={`widget/${component.component.name}/data`}
      />
    ),
  });

  items.push({
    title: 'Code',
    children: (
      <CodeHinter
        currentState={currentState}
        initialValue={code.value ?? {}}
        theme={darkMode ? 'monokai' : 'base16-light'}
        mode="jsx"
        lineNumbers
        className="custom-component"
        onChange={(value) => paramUpdated({ name: 'code' }, 'value', value, 'properties')}
        componentName={`widget/${component.component.name}/code`}
        enablePreview={false}
        height={400}
        hideSuggestion
      />
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
