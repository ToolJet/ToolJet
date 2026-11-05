import React from 'react';
import Accordion from '@/AppBuilder/RightSideBar/Inspector/InspectorAccordion';
import { ADDITIONAL_ACTIONS_ACCORDION_ID } from '../inspectorConstants';
import { EventManager } from '../EventManager';
import { renderElement } from '../Utils';
// eslint-disable-next-line import/no-unresolved
import i18next from 'i18next';
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
  'Timeline',
  'Timer',
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
import { getListviewMode } from '@/AppBuilder/Widgets/Listview/listStyleLayout';

const LISTVIEW_DATA_PROPERTIES = ['dataSourceSelector', 'data'];
// Record height is one field: in grid layout `rowHeight` is swapped for `gridRecordHeight` below.
const LISTVIEW_CONFIGURE_ORDER = [
  'mode',
  'rowHeight',
  'columns',
  'disableRecords',
  'enablePagination',
  'serverSidePagination',
  'rowsPerPage',
  'totalRecords',
];

const buildListviewPropertyItems = (
  properties,
  component,
  componentMeta,
  paramUpdated,
  dataQueries,
  currentState,
  allComponents,
  darkMode
) => {
  const savedProperties = component.component.definition.properties ?? {};
  const savedMode = savedProperties.mode;
  // A hand-written "List" is shown as List; only the display changes, the saved value stays until edited.
  const isPlainString = typeof savedMode?.value === 'string' && !savedMode.value.includes('{{');
  // An expression is resolved against the live store, as the widget does.
  const resolvedMode = isPlainString ? savedMode.value : useStore.getState().getResolvedValue(savedMode?.value);
  const mode = getListviewMode(resolvedMode);
  const isGrid = mode === 'grid';

  let viewComponent = component;
  let viewMeta = componentMeta;
  if (isPlainString && savedMode.value !== mode) {
    viewComponent = withProperty(viewComponent, 'mode', { ...savedMode, value: mode });
  }
  // The grid reads `gridRecordHeight ?? rowHeight`, so a grid without its own height shows `rowHeight`.
  if (isGrid) {
    viewComponent = withProperty(
      viewComponent,
      'gridRecordHeight',
      savedProperties.gridRecordHeight ?? savedProperties.rowHeight
    );
    viewMeta = {
      ...componentMeta,
      properties: { ...componentMeta.properties, gridRecordHeight: componentMeta.properties.rowHeight },
    };
  }

  const render = (property) =>
    renderElement(
      viewComponent,
      viewMeta,
      paramUpdated,
      dataQueries,
      property,
      'properties',
      currentState,
      allComponents,
      darkMode,
      ''
    );

  const present = (names) => names.filter((name) => properties.includes(name));
  const known = [...LISTVIEW_DATA_PROPERTIES, ...LISTVIEW_CONFIGURE_ORDER];
  const configure = [
    ...present(LISTVIEW_CONFIGURE_ORDER),
    // Shown in the Styles tab, Records group: it only acts on a Legacy list.
    ...properties.filter((property) => !known.includes(property) && property !== 'showBorder'),
  ].map((property) => (property === 'rowHeight' && isGrid ? 'gridRecordHeight' : property));

  const items = [];
  const dataFields = present(LISTVIEW_DATA_PROPERTIES);
  if (dataFields.length > 0) {
    items.push({ title: 'Data', isOpen: true, children: dataFields.map(render) });
  }
  if (configure.length > 0) {
    items.push({ title: 'Configure list item', isOpen: true, children: configure.map(render) });
  }
  return items;
};

const withProperty = (component, name, value) => ({
  ...component,
  component: {
    ...component.component,
    definition: {
      ...component.component.definition,
      properties: { ...component.component.definition.properties, [name]: value },
    },
  },
});

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
  const headerProperties = [];
  for (const [key] of Object.entries(componentMeta?.properties)) {
    if (componentMeta?.properties[key]?.section === 'additionalActions') {
      additionalActions.push(key);
    } else if (componentMeta?.properties[key]?.section === 'header') {
      headerProperties.push(key);
    } else if (componentMeta?.properties[key]?.section !== 'deprecatedStyles') {
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

  if (headerProperties.length > 0) {
    accordionItems.unshift({
      title: 'Header',
      isOpen: true,
      children: headerProperties.map((property) =>
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
          ''
        )
      ),
    });
  }

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
      'Html',
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
      'ModalV2',
      'Container',
      'Timeline',
      'Timer',
    ],
    Layout: [],
  };
  if (component.component.component === 'Listview') {
    // Resolved against the live store, so a binding to another component is read rather than dropped.
    const { getResolvedValue } = useStore.getState();
    const listviewProperties = component.component.definition.properties;
    if (!getResolvedValue(listviewProperties?.enablePagination?.value)) {
      properties = properties.filter(
        (property) => !['rowsPerPage', 'serverSidePagination', 'totalRecords'].includes(property)
      );
    } else if (!getResolvedValue(listviewProperties?.serverSidePagination?.value)) {
      properties = properties.filter((property) => property !== 'totalRecords');
    }
  }
  let items = [];
  if (component.component.component === 'Listview') {
    items.push(
      ...buildListviewPropertyItems(
        properties,
        component,
        componentMeta,
        paramUpdated,
        dataQueries,
        currentState,
        allComponents,
        darkMode
      )
    );
  } else if (properties.length > 0) {
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
