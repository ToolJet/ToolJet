import React, { useState } from 'react';
import Accordion from '@/_ui/Accordion';
import { EventManager } from '../../EventManager';
import { renderElement } from '../../Utils';
// eslint-disable-next-line import/no-unresolved
import i18next from 'i18next';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { Button } from '@/components/ui/Button/Button';
import LabeledDivider from './LabeledDivider';
import ColumnMappingComponent from './ColumnMappingComponent';
import { FormFieldsList } from './FormFieldsList';
import './styles.scss';

export const Form = ({
  componentMeta,
  darkMode,
  layoutPropertyChanged,
  component,
  paramUpdated,
  dataQueries,
  currentState,
  eventsChanged,
  apps,
  allComponents,
  pages,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  // const [fields, setFields] = useState([]);
  const [fields, setFields] = useState([
    {
      name: 'lastNamelastNamelastNamelastNamelastName',
      dataType: 'varchar',
      inputType: 'text',
      mandatory: false,
      label: 'Input value',
      selected: true,
    },
    {
      name: 'dateOfBirth',
      dataType: 'date',
      inputType: 'text',
      mandatory: false,
      label: 'Input value',
      selected: true,
    },
    {
      name: 'hireDate',
      dataType: 'datetime',
      inputType: 'text',
      mandatory: false,
      label: 'Input value',
      selected: true,
    },
    {
      name: 'jobTitle',
      dataType: 'varchar',
      inputType: 'text',
      mandatory: false,
      label: 'Input value',
      selected: true,
    },
    { name: 'email', dataType: 'varchar', inputType: 'text', mandatory: false, label: 'Input value', selected: true },
    {
      name: 'phoneNumber',
      dataType: 'varchar',
      inputType: 'text',
      mandatory: false,
      label: 'Input value',
      selected: true,
    },
    {
      name: 'department',
      dataType: 'varchar',
      inputType: 'text',
      mandatory: false,
      label: 'Input value',
      selected: true,
    },
    { name: 'salary', dataType: 'number', inputType: 'text', mandatory: false, label: 'Input value', selected: true },
  ]);
  const tempComponentMeta = deepClone(componentMeta);

  let properties = [];
  let additionalActions = [];
  let dataProperties = [];

  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});

  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (componentMeta?.properties[key]?.section === 'data') {
      dataProperties.push(key);
    } else {
      properties.push(key);
    }
  }

  const { id } = component;
  const newOptions = [{ name: 'None', value: 'none' }];

  Object.entries(allComponents).forEach(([componentId, _component]) => {
    const validParent =
      _component.component.parent === id ||
      _component.component.parent === `${id}-footer` ||
      _component.component.parent === `${id}-header`;
    if (validParent && _component?.component?.component === 'Button') {
      newOptions.push({ name: _component.component.name, value: componentId });
    }
  });

  tempComponentMeta.properties.buttonToSubmit.options = newOptions;

  // Hide header footer if custom schema is turned on

  if (component.component.definition.properties.advanced.value === '{{true}}') {
    component.component.properties.showHeader = {
      ...component.component.properties.headerHeight,
      isHidden: true,
    };
    component.component.properties.showFooter = {
      ...component.component.properties.headerHeight,
      isHidden: true,
    };
  }

  const sampleColumns = [
    { name: 'lastName', dataType: 'varchar' },
    { name: 'dateOfBirth', dataType: 'date' },
    { name: 'hireDate', dataType: 'datetime' },
    { name: 'jobTitle', dataType: 'varchar' },
    { name: 'email', dataType: 'varchar' },
    { name: 'phoneNumber', dataType: 'varchar' },
    { name: 'department', dataType: 'varchar' },
    { name: 'salary', dataType: 'number' },
  ];

  const handleDeleteField = (index) => {
    setFields((prevFields) => prevFields.filter((_, i) => i !== index));
  };

  const renderDataElement = () => {
    return (
      <>
        {dataProperties?.map((property) =>
          renderElement(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            property,
            'properties',
            currentState,
            allComponents,
            darkMode
          )
        )}
        <div className="tw-flex tw-justify-center tw-items-center">
          <Button fill="#4368E3" leadingIcon="plus" variant="secondary" onClick={() => setIsModalOpen(true)}>
            Generate form
          </Button>
        </div>
        <div className="tw-flex tw-justify-between tw-items-center tw-gap-1.5">
          <div className="tw-flex-1">
            <LabeledDivider label="Fields" />
          </div>
          <Button iconOnly leadingIcon="plus" variant="ghost" size="small" />
        </div>

        <FormFieldsList fields={fields} onDeleteField={handleDeleteField} />

        <div className="tw-flex tw-justify-center tw-items-center tw-mt-3">
          <Button fill="#ACB2B9" leadingIcon="sliders" variant="outline" onClick={() => setIsModalOpen(true)}>
            Manage fields
          </Button>
        </div>

        <ColumnMappingComponent
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          darkMode={darkMode}
          columns={sampleColumns}
          mode="mapping"
          title="Map columns"
          onSubmit={(selectedFields) => {
            setFields(selectedFields);
            setIsModalOpen(false);
          }}
        />
      </>
    );
  };

  const accordionItems = baseComponentProperties(
    properties,
    events,
    component,
    tempComponentMeta,
    layoutPropertyChanged,
    paramUpdated,
    dataQueries,
    currentState,
    eventsChanged,
    apps,
    allComponents,
    validations,
    darkMode,
    pages,
    additionalActions,
    dataProperties,
    renderDataElement
  );

  return (
    <>
      <Accordion items={accordionItems} />
    </>
  );
};

export const baseComponentProperties = (
  properties,
  events,
  component,
  componentMeta,
  layoutPropertyChanged,
  paramUpdated,
  dataQueries,
  currentState,
  eventsChanged,
  apps,
  allComponents,
  validations,
  darkMode,
  pages,
  additionalActions,
  dataProperties,
  renderDataElement
) => {
  let items = [];

  if (properties.length > 0) {
    items.push({
      title: `${i18next.t('widget.common.properties', 'Properties')}`,
      children: properties.map((property) =>
        renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          property,
          'properties',
          currentState,
          allComponents,
          darkMode
        )
      ),
    });
  }

  items.push({
    title: 'Data',
    isOpen: true,
    children: renderDataElement(),
  });

  if (events.length > 0) {
    items.push({
      title: `${i18next.t('widget.common.events', 'Events')}`,
      isOpen: true,
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
  }

  items.push({
    title: 'Additional actions',
    isOpen: true,
    children: additionalActions?.map((property) =>
      renderElement(
        component,
        componentMeta,
        paramUpdated,
        dataQueries,
        property,
        'properties',
        currentState,
        allComponents,
        darkMode
      )
    ),
  });

  if (validations.length > 0) {
    items.push({
      title: `${i18next.t('widget.common.validation', 'Validation')}`,
      children: validations.map((property) =>
        renderElement(
          component,
          componentMeta,
          paramUpdated,
          dataQueries,
          property,
          'validation',
          currentState,
          allComponents,
          darkMode
        )
      ),
    });
  }

  items.push({
    title: `${i18next.t('widget.common.devices', 'Devices')}`,
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

  return items;
};
