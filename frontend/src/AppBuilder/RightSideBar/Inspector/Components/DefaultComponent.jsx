import React from 'react';
import Accordion from '@/AppBuilder/RightSideBar/Inspector/InspectorAccordion';
import { ADDITIONAL_ACTIONS_ACCORDION_ID } from '../inspectorConstants';
import { EventManager } from '../EventManager';
import { renderElement } from '../Utils';
// eslint-disable-next-line import/no-unresolved
import i18next from 'i18next';
import { resolveReferences } from '@/_helpers/utils';
// import { AllComponents } from '@/Editor/Box';
import { AllComponents } from '@/AppBuilder/_helpers/editorHelpers';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';
const SHOW_ADDITIONAL_ACTIONS = [
  'Text',
  'Pagination',
  'Container',
  'TextInput',
  'TextArea',
  'NumberInput',
  'PasswordInput',
  'EmailInput',
  'PhoneInput',
  'CurrencyInput',
  'ToggleSwitchV2',
  'Checkbox',
  'DropdownV2',
  'MultiselectV2',
  'Button',
  'AudioRecorder',
  'Camera',
  'RichTextEditor',
  'Image',
  'CodeEditor',
  'TextArea',
  'Container',
  'Form',
  'Divider',
  'VerticalDivider',
  'ModalV2',
  'Tabs',
  'RangeSliderV2',
  'Link',
  'FilePicker',
  'FileInput',
  'Listview',
  'Statistics',
  'StarRating',
  'CircularProgressBar',
  'Kanban',
  'Html',
  'TagsInput',
  'JSONExplorer',
  'JSONEditor',
  'ProgressBar',
  'IFrame',
  'Accordion',
  'ReorderableList',
  'ColorPicker',
  'FileButton',
  'FlexContainer',
];
const PROPERTIES_VS_ACCORDION_TITLE = {
  Text: 'Data',
  TextInput: 'Data',
  PasswordInput: 'Data',
  NumberInput: 'Data',
  ToggleSwitchV2: 'Data',
  Checkbox: 'Data',
  TextArea: 'Data',
  Button: 'Data',
  Image: 'Data',
  Container: 'Data',
  Divider: 'Data',
  VerticalDivider: 'Data',
  ModalV2: 'Data',
  Tabs: 'Data',
  RangeSlider: 'Data',
  Link: 'Data',
  PopoverMenu: 'Data',
  Statistics: 'Data',
  StarRating: 'Data',
  CircularProgressBar: 'Data',
  Kanban: 'Board configuration',
  ProgressBar: 'Data',
  AudioRecorder: 'Content',
  Camera: 'Content',
  Accordion: 'Data',
  JSONExplorer: 'Data',
  JSONEditor: 'Data',
  ColorPicker: 'Data',
  FileButton: 'Data',
  FlexContainer: 'Layout',
};

// Widgets whose tooltip lives in `properties` (additionalActions section) AND
// whose tooltip we explicitly moved out of `general` in this PR. Suppressing
// the legacy General-section Tooltip field for these prevents the duplicate
// Tooltip UX (one in General, one in Additional Actions). For other widgets
// in SHOULD_ADD_BOX_SHADOW_AND_VISIBILITY (Button et al.), the pre-existing
// duplicate is left as-is — a broader cleanup is tracked for phase 2 alongside
// the migration of the remaining 13 widgets out of the General-section path.
const SUPPRESS_GENERAL_TOOLTIP_FOR = ['ModalV2', 'Container'];

export const DefaultComponent = ({ componentMeta, darkMode, ...restProps }) => {
  const {
    layoutPropertyChanged,
    component,
    paramUpdated,
    dataQueries,
    currentState,
    eventsChanged,
    apps,
    components,
    pages,
    selectedComponentId,
  } = restProps;

  const setSelectedComponents = useStore((state) => state.setSelectedComponents, shallow);

  if (componentMeta?.definition === undefined) {
    setSelectedComponents([]);
    return null;
  }

  const events = Object.keys(componentMeta.events);
  const validations = Object.keys(componentMeta.validation || {});
  let properties = [];
  let additionalActions = [];
  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else {
      properties.push(key);
    }
  }

  const accordionItems = baseComponentProperties(
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
    components,
    validations,
    darkMode,
    pages,
    additionalActions,
    selectedComponentId
  );

  return <Accordion items={accordionItems} />;
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
  selectedComponentId
) => {
  // Add widget title to section key to filter that property section from specified widgets' settings
  const accordionFilters = {
    Properties: [],
    Events: [],
    Validation: [],
    'Additional Actions': Object.keys(AllComponents).filter(
      (component) => !SHOW_ADDITIONAL_ACTIONS.includes(component)
    ),
    General: [
      'Modal',
      'Pagination',
      'TextInput',
      'PasswordInput',
      'TextArea',
      'EmailInput',
      'PhoneInput',
      'CurrencyInput',
      'NumberInput',
      'Text',
      'Table',
      'Button',
      'ToggleSwitchV2',
      'Checkbox',
      'DropdownV2',
      'MultiselectV2',
      'Image',
      'RangeSliderV2',
      'Divider',
      'VerticalDivider',
      'Link',
      'FilePicker',
      'FileInput',
      'Tabs',
      'Statistics',
      'StarRating',
      'CircularProgressBar',
      'Kanban',
      'ProgressBar',
      'AudioRecorder',
      'Camera',
      'JSONExplorer',
      'JSONEditor',
      'IFrame',
      'Accordion',
      'ColorPicker',
      'FileButton',
      'Listview',
      'FlexContainer',
    ],
    Layout: [],
  };
  if (component.component.component === 'Listview') {
    if (!resolveReferences(component.component.definition.properties?.enablePagination?.value)) {
      properties = properties.filter((property) => property !== 'rowsPerPage');
    }
  }
  let items = [];
  if (properties.length > 0) {
    items.push({
      title:
        PROPERTIES_VS_ACCORDION_TITLE[component?.component?.component] ??
        `${i18next.t('widget.common.properties', 'Properties')}`,
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
          darkMode,
          ''
        )
      ),
    });
  }

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
          component={component}
        />
      ),
    });
  }
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
          darkMode,
          componentMeta.validation?.[property]?.placeholder
        )
      ),
    });
  }

  items.push({
    title: `${i18next.t('widget.common.general', 'General')}`,
    isOpen: true,
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
  // Skip the legacy General-section Tooltip field for widgets whose tooltip
  // we moved into `properties` (additionalActions). Without this, ModalV2
  // and Container would render two "Tooltip" fields in the inspector: a stale
  // one in General (no longer read by the renderer) and the working one in
  // Additional Actions. See SUPPRESS_GENERAL_TOOLTIP_FOR at the top of the file.
  if (!SUPPRESS_GENERAL_TOOLTIP_FOR.includes(component?.component?.component)) {
    items.push({
      title: `${i18next.t('widget.common.general', 'General')}`,
      isOpen: true,
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
  }

  items.push({
    id: ADDITIONAL_ACTIONS_ACCORDION_ID,
    title: `${i18next.t('widget.common.additionalActions', 'Additional Actions')}`,
    isOpen: true,
    children: additionalActions?.map((property) => {
      const paramType = property === 'Tooltip' ? 'general' : 'properties';
      return renderElement(
        component,
        componentMeta,
        paramUpdated,
        dataQueries,
        property,
        paramType,
        currentState,
        allComponents,
        darkMode,
        componentMeta.properties?.[property]?.placeholder
      );
    }),
  });

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

  return items.filter(
    (item) => !(item.title in accordionFilters && accordionFilters[item.title].includes(componentMeta.component))
  );
};
