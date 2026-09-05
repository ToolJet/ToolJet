import React from 'react';
import { renderElement } from '../Utils';
import Accordion from '@/AppBuilder/RightSideBar/Inspector/InspectorAccordion';
import CodeHinter from '@/AppBuilder/CodeEditor';
import i18next from 'i18next';
import { ADDITIONAL_ACTIONS_ACCORDION_ID } from '../inspectorConstants';

export const CustomComponent = function CustomComponent({
  dataQueries,
  component,
  paramUpdated,
  componentMeta,
  components,
  darkMode,
  layoutPropertyChanged,
  currentState,
}) {
  const code = component.component.definition.properties.code;
  const args = component.component.definition.properties.data;
  let items = [];

  items.push({
    title: 'Data',
    children: (
      <CodeHinter
        type="basic"
        initialValue={args.value ?? {}}
        onChange={(value) => paramUpdated({ name: 'data' }, 'value', value, 'properties')}
        componentName={`component/${component.component.name}/data`}
        canRefresh={true}
      />
    ),
  });

  items.push({
    title: 'Code',
    children: (
      <CodeHinter
        type="multiline"
        initialValue={code.value ?? {}}
        theme={darkMode ? 'monokai' : 'base16-light'}
        lang="jsx"
        lineNumbers={true}
        className="custom-component custom-component-inspector-multiline"
        onChange={(value) => paramUpdated({ name: 'code' }, 'value', value, 'properties')}
        componentName={`component/${component.component.name}/code`}
        height={400}
        hideSuggestion={true}
        canRefresh={true}
      />
    ),
  });

  const additionalActions = Object.keys(componentMeta?.properties ?? {}).filter(
    (key) => componentMeta.properties[key]?.section === 'additionalActions'
  );

  if (additionalActions.length > 0) {
    items.push({
      id: ADDITIONAL_ACTIONS_ACCORDION_ID,
      title: `${i18next.t('widget.common.additionalActions', 'Additional Actions')}`,
      isOpen: true,
      children: additionalActions.map((property) =>
        renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          property,
          'properties',
          currentState,
          components,
          darkMode,
          componentMeta.properties?.[property]?.placeholder
        )
      ),
    });
  }

  items.push({
    title: 'Devices',
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
