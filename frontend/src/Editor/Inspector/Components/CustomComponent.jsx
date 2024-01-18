import React from 'react';
import { renderElement } from '../Utils';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import Accordion from '@/_ui/Accordion';
import NewCodeHinter from '@/Editor/CodeEditor';

export const CustomComponent = function CustomComponent({
  dataQueries,
  component,
  paramUpdated,
  componentMeta,
  components,
  darkMode,
  layoutPropertyChanged,
}) {
  const code = component.component.definition.properties.code;
  const args = component.component.definition.properties.data;
  let items = [];

  items.push({
    title: 'Data',
    children: (
      <NewCodeHinter
        type="basic"
        initialValue={args.value ?? {}}
        onChange={(value) => paramUpdated({ name: 'data' }, 'value', value, 'properties')}
        componentName={`component/${component.component.name}/data`}
      />
    ),
  });

  items.push({
    title: 'Code',
    children: (
      <NewCodeHinter
        type="multiLine"
        initialValue={code.value ?? {}}
        theme={darkMode ? 'monokai' : 'base16-light'}
        lang="jsx"
        lineNumbers={true}
        className="custom-component"
        onChange={(value) => paramUpdated({ name: 'code' }, 'value', value, 'properties')}
        componentName={`component/${component.component.name}/code`}
        height={400}
        hideSuggestion={true}
      />
    ),
  });

  items.push({
    title: 'Layout',
    isOpen: true,
    children: (
      <>
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'showOnDesktop',
          'others',
          components
        )}
        {renderElement(
          component,
          componentMeta,
          layoutPropertyChanged,
          dataQueries,
          'showOnMobile',
          'others',
          components
        )}
      </>
    ),
  });
  return <Accordion items={items} />;
};
