import React, { useState, useEffect } from 'react';
import { Table } from './Components/Table/Table.jsx';
import { Chart } from './Components/Chart';
import { Form } from './Components/Form';
import { renderElement, renderCustomStyles } from './Utils';
import { toast } from 'react-hot-toast';
import { validateQueryName, convertToKebabCase, resolveReferences } from '@/_helpers/utils';
import { ConfirmDialog } from '@/_components';
import { useHotkeys } from 'react-hotkeys-hook';
import { DefaultComponent } from './Components/DefaultComponent';
import { FilePicker } from './Components/FilePicker';
import { Modal } from './Components/Modal';
import { CustomComponent } from './Components/CustomComponent';
import { Icon } from './Components/Icon';
import useFocus from '@/_hooks/use-focus';
import Accordion from '@/_ui/Accordion';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { useMounted } from '@/_hooks/use-mount';
import { useCurrentState } from '@/_stores/currentStateStore';
import { useDataQueries } from '@/_stores/dataQueriesStore';
import { useAppVersionStore } from '@/_stores/appVersionStore';
import { shallow } from 'zustand/shallow';
import Tabs from '@/ToolJetUI/Tabs/Tabs';
import Tab from '@/ToolJetUI/Tabs/Tab';
import Student from '@/_ui/Icon/solidIcons/Student';
import ArrowRight from '@/_ui/Icon/solidIcons/ArrowRight';
import ArrowLeft from '@/_ui/Icon/solidIcons/ArrowLeft';
import SolidIcon from '@/_ui/Icon/SolidIcons';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import Edit from '@/_ui/Icon/bulkIcons/Edit';
import Copy from '@/_ui/Icon/solidIcons/Copy';
import Trash from '@/_ui/Icon/solidIcons/Trash';
import classNames from 'classnames';
import { useEditorStore, EMPTY_ARRAY } from '@/_stores/editorStore';
import { Select } from './Components/Select';
import { deepClone } from '@/_helpers/utilities/utils.helpers';
import { removeSuggestions } from '@/_helpers/appUtils.js';

const INSPECTOR_HEADER_OPTIONS = [
  {
    label: 'Rename',
    value: 'rename',
    icon: <Edit width={16} />,
  },
  {
    label: 'Duplicate',
    value: 'duplicate',
    icon: <Copy width={16} />,
  },
  {
    label: 'Delete',
    value: 'delete',
    icon: <Trash width={16} fill={'#E54D2E'} />,
  },
];

const NEW_REVAMPED_COMPONENTS = [
  'Text',
  'TextInput',
  'PasswordInput',
  'NumberInput',
  'Table',
  'ToggleSwitchV2',
  'Checkbox',
  'DropdownV2',
  'MultiselectV2',
  'Button',
];

export const Inspector = ({
  componentDefinitionChanged,
  allComponents,
  darkMode,
  removeComponent,
  pages,
  cloneComponents,
}) => {
  const dataQueries = useDataQueries();

  const currentState = useCurrentState();
  const { selectedComponentId, setSelectedComponents } = useEditorStore(
    (state) => ({
      selectedComponentId: state.selectedComponents[0]?.id,
      setSelectedComponents: state.actions.setSelectedComponents,
    }),
    shallow
  );
  const component = {
    id: selectedComponentId,
    component: JSON.parse(JSON.stringify(allComponents?.[selectedComponentId]?.component)),
    layouts: allComponents[selectedComponentId].layouts,
    parent: allComponents[selectedComponentId].parent,
  };

  const [showWidgetDeleteConfirmation, setWidgetDeleteConfirmation] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [newComponentName, setNewComponentName] = useState('');
  const [inputRef, setInputFocus] = useFocus();

  const [showHeaderActionsMenu, setShowHeaderActionsMenu] = useState(false);
  const isRevampedComponent = NEW_REVAMPED_COMPONENTS.includes(component.component.component);

  const { isVersionReleased, isEditorFreezed } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
      isEditorFreezed: state.isEditorFreezed,
    }),
    shallow
  );
  const { t } = useTranslation();
  useHotkeys(
    'backspace',
    () => {
      if (isVersionReleased || isEditorFreezed) return;
      setWidgetDeleteConfirmation(true);
    },
    { scopes: 'editor' }
  );
  useHotkeys('escape', () => setSelectedComponents(EMPTY_ARRAY), {
    scopes: 'editor',
  });

  const componentMeta = JSON.parse(JSON.stringify(allComponents?.[selectedComponentId]?.component));

  const isMounted = useMounted();

  //
  useEffect(() => {
    setNewComponentName(allComponents[selectedComponentId]?.component?.name);
  }, [selectedComponentId, allComponents]);

  const validateComponentName = (name) => {
    const isValid = !Object.values(allComponents)
      .map((component) => component?.component?.name)
      .includes(name);

    if (component?.component.name === name) {
      return true;
    }
    return isValid;
  };

  function handleComponentNameChange(newName) {
    if (component.component.name === newName) return;

    if (newName.length === 0) {
      toast.error(t('widget.common.widgetNameEmptyError', 'Widget name cannot be empty'));
      return setInputFocus();
    }
    if (!validateComponentName(newName)) {
      toast.error(t('widget.common.componentNameExistsError', 'Component name already exists'));
      return setInputFocus();
    }
    if (validateQueryName(newName)) {
      let newComponent = JSON.parse(JSON.stringify(component));
      newComponent.component.name = newName;
      componentDefinitionChanged(newComponent, { componentNameUpdated: true });
      // remove suggestions logic
      removeSuggestions(component);
    } else {
      toast.error(
        t(
          'widget.common.invalidWidgetName',
          'Invalid widget name. Should be unique and only include letters, numbers and underscore.'
        )
      );
      setInputFocus();
    }
  }

  const getDefaultValue = (val) => {
    if (componentMeta?.definition?.defaults) {
      return componentMeta.definition.defaults.find((el) => el.type === val);
    }
    return null;
  };

  function paramUpdated(param, attr, value, paramType, isParamFromTableColumn = false, props = {}) {
    let newComponent = JSON.parse(JSON.stringify(component));
    let newDefinition = deepClone(newComponent.component.definition);
    let allParams = newDefinition[paramType] || {};
    const paramObject = allParams[param.name];
    if (!paramObject) {
      allParams[param.name] = {};
    }
    if (attr) {
      allParams[param.name][attr] = value;
      const defaultValue = getDefaultValue(value);
      // This is needed to have enable pagination in Table as backward compatible
      // Whenever enable pagination is false, we turn client and server side pagination as false
      if (component.component.component === 'Table' && param.name === 'enablePagination' && !resolveReferences(value)) {
        if (allParams?.['clientSidePagination']?.[attr]) {
          allParams['clientSidePagination'][attr] = value;
        }
        if (allParams['serverSidePagination']?.[attr]) {
          allParams['serverSidePagination'][attr] = value;
        }
      }
      // This case is required to handle for older apps when serverSidePagination is connected to Fx
      if (param.name === 'serverSidePagination' && !allParams?.['enablePagination']?.[attr]) {
        allParams = {
          ...allParams,
          enablePagination: {
            value: true,
          },
        };
      }
      if (param.type === 'select' && defaultValue) {
        allParams[defaultValue.paramName]['value'] = defaultValue.value;
      }
      if (param.name === 'secondarySignDisplay') {
        if (value === 'negative') {
          newDefinition['styles']['secondaryTextColour']['value'] = '#EE2C4D';
        } else if (value === 'positive') {
          newDefinition['styles']['secondaryTextColour']['value'] = '#36AF8B';
        }
      }
    } else {
      allParams[param.name] = value;
    }

    if (
      component.component.component === 'Table' &&
      param.name === 'contentWrap' &&
      !resolveReferences(value) &&
      newDefinition.properties.columns.value.some((item) => item.columnType === 'image' && item.height !== '')
    ) {
      const updatedColumns = newDefinition.properties.columns.value.map((item) => {
        return item.columnType === 'image' ? { ...item, height: '' } : item; // Create a new object for image columns
      });

      // Update the columns value with the updated columns
      newDefinition.properties.columns.value = updatedColumns;
      isParamFromTableColumn = true;
    }

    newDefinition[paramType] = allParams;
    newComponent.component.definition = newDefinition;
    componentDefinitionChanged(newComponent, {
      componentPropertyUpdated: true,
      isParamFromTableColumn: isParamFromTableColumn,
      ...props,
    });
  }

  // use following function when more than one property needs to be updated

  function paramsUpdated(array, isParamFromTableColumn = false) {
    let newComponent = JSON.parse(JSON.stringify(component));
    let newDefinition = _.cloneDeep(newComponent.component.definition);
    array.map((item) => {
      const { param, attr, value, paramType } = item;
      let allParams = newDefinition[paramType] || {};
      const paramObject = allParams[param.name];
      if (!paramObject) {
        allParams[param.name] = {};
      }
      if (attr) {
        allParams[param.name][attr] = value;
        const defaultValue = getDefaultValue(value);
        // This is needed to have enable pagination in Table as backward compatible
        // Whenever enable pagination is false, we turn client and server side pagination as false
        if (
          component.component.component === 'Table' &&
          param.name === 'enablePagination' &&
          !resolveReferences(value, currentState)
        ) {
          if (allParams?.['clientSidePagination']?.[attr]) {
            allParams['clientSidePagination'][attr] = value;
          }
          if (allParams['serverSidePagination']?.[attr]) {
            allParams['serverSidePagination'][attr] = value;
          }
        }
        // This case is required to handle for older apps when serverSidePagination is connected to Fx
        if (param.name === 'serverSidePagination' && !allParams?.['enablePagination']?.[attr]) {
          allParams = {
            ...allParams,
            enablePagination: {
              value: true,
            },
          };
        }
        if (param.type === 'select' && defaultValue) {
          allParams[defaultValue.paramName]['value'] = defaultValue.value;
        }
        if (param.name === 'secondarySignDisplay') {
          if (value === 'negative') {
            newDefinition['styles']['secondaryTextColour']['value'] = '#EE2C4D';
          } else if (value === 'positive') {
            newDefinition['styles']['secondaryTextColour']['value'] = '#36AF8B';
          }
        }
      } else {
        allParams[param.name] = value;
      }
      newDefinition[paramType] = allParams;
      newComponent.component.definition = newDefinition;
    });
    componentDefinitionChanged(newComponent, {
      componentPropertyUpdated: true,
      isParamFromTableColumn,
    });
  }

  function layoutPropertyChanged(param, attr, value, paramType) {
    paramUpdated(param, attr, value, paramType);

    // User wants to show the widget on mobile devices
    if (param.name === 'showOnMobile' && value === true) {
      let newComponent = JSON.parse(JSON.stringify(component));

      const { width, height } = newComponent.layouts['desktop'];

      newComponent['layouts'] = {
        ...newComponent.layouts,
        mobile: {
          top: 100,
          left: 0,
          width: Math.min(width, 445),
          height: height,
        },
      };

      componentDefinitionChanged(newComponent, { layoutPropertyChanged: true });

      //  Child components should also have a mobile layout
      const childComponents = Object.keys(allComponents).filter((key) => allComponents[key].parent === component?.id);

      childComponents.forEach((componentId) => {
        let newChild = {
          id: componentId,
          ...allComponents[componentId],
        };

        const { width, height } = newChild.layouts['desktop'];

        newChild['layouts'] = {
          ...newChild.layouts,
          mobile: {
            top: 100,
            left: 0,
            width: Math.min(width, 445),
            height: height,
          },
        };

        componentDefinitionChanged(newChild, { withChildLayout: true });
      });
    }
  }

  const handleInspectorHeaderActions = (value) => {
    if (value === 'rename') {
      setTimeout(() => setInputFocus(), 0);
    }
    if (value === 'delete') {
      setWidgetDeleteConfirmation(true);
    }
    if (value === 'duplicate') {
      cloneComponents();
    }
  };
  const buildGeneralStyle = () => {
    const items = [];

    items.push({
      title: `${t('widget.common.general', 'General')}`,
      isOpen: true,
      children: (
        <>
          {renderElement(
            component,
            componentMeta,
            layoutPropertyChanged,
            dataQueries,
            'boxShadow',
            'generalStyles',
            currentState,
            allComponents
          )}
        </>
      ),
    });

    return <Accordion items={items} />;
  };

  const propertiesTab = isMounted && (
    <div className={`${isVersionReleased && 'disabled'}`}>
      <GetAccordion
        componentName={componentMeta.component}
        layoutPropertyChanged={layoutPropertyChanged}
        component={component}
        paramUpdated={paramUpdated}
        paramsUpdated={paramsUpdated}
        dataQueries={dataQueries}
        componentMeta={componentMeta}
        components={allComponents}
        currentState={currentState}
        darkMode={darkMode}
        pages={pages}
        allComponents={allComponents}
      />
    </div>
  );
  const stylesTab = (
    <div style={{ marginBottom: '6rem' }} className={`${isVersionReleased && 'disabled'}`}>
      <div className={!isRevampedComponent && 'p-3'}>
        <Inspector.RenderStyleOptions
          componentMeta={componentMeta}
          component={component}
          paramUpdated={paramUpdated}
          dataQueries={dataQueries}
          currentState={currentState}
          allComponents={allComponents}
        />
      </div>
      {!isRevampedComponent && buildGeneralStyle()}
    </div>
  );

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showHeaderActionsMenu && event.target.closest('.list-menu') === null) {
        setShowHeaderActionsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify({ showHeaderActionsMenu })]);

  return (
    <div className="inspector">
      <ConfirmDialog
        show={showWidgetDeleteConfirmation}
        message={'Are you sure you want to delete this component?'}
        onConfirm={() => {
          setSelectedComponents(EMPTY_ARRAY);
          removeComponent(component.id);
        }}
        onCancel={() => setWidgetDeleteConfirmation(false)}
        darkMode={darkMode}
      />
      <div>
        <div
          className={`row inspector-component-title-input-holder ${
            (isVersionReleased || isEditorFreezed) && 'disabled'
          }`}
        >
          <div className="col-1" onClick={() => setSelectedComponents(EMPTY_ARRAY)}>
            <span
              data-cy={`inspector-close-icon`}
              className="cursor-pointer d-flex align-items-center "
              style={{ height: '28px', width: '28px' }}
            >
              <ArrowLeft fill={'var(--slate12)'} width={'14'} />
            </span>
          </div>
          <div className={`col-9 p-0 ${isVersionReleased && 'disabled'}`}>
            <div className="input-icon" style={{ marginLeft: '8px' }}>
              <input
                onChange={(e) => setNewComponentName(e.target.value)}
                type="text"
                onBlur={() => handleComponentNameChange(newComponentName)}
                className="w-100 inspector-edit-widget-name"
                value={newComponentName}
                ref={inputRef}
                data-cy="edit-widget-name"
              />
            </div>
          </div>
          <div className="col-2" data-cy={'component-inspector-options'}>
            <OverlayTrigger
              trigger={'click'}
              placement={'bottom-end'}
              rootClose={false}
              show={showHeaderActionsMenu}
              overlay={
                <Popover id="list-menu" className={darkMode && 'dark-theme'}>
                  <Popover.Body bsPrefix="list-item-popover-body">
                    {INSPECTOR_HEADER_OPTIONS.map((option) => (
                      <div
                        data-cy={`component-inspector-${String(option?.value).toLowerCase()}-button`}
                        className="list-item-popover-option"
                        key={option?.value}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleInspectorHeaderActions(option.value);
                        }}
                      >
                        <div className="list-item-popover-menu-option-icon">{option.icon}</div>
                        <div
                          className={classNames('list-item-option-menu-label', {
                            'color-tomato9': option.value === 'delete',
                          })}
                        >
                          {option?.label}
                        </div>
                      </div>
                    ))}
                  </Popover.Body>
                </Popover>
              }
            >
              <span className="cursor-pointer" onClick={() => setShowHeaderActionsMenu(true)}>
                <SolidIcon data-cy={'menu-icon'} name="morevertical" width="24" fill={'var(--slate12)'} />
              </span>
            </OverlayTrigger>
          </div>
        </div>
        <div className={`${(isVersionReleased || isEditorFreezed) && 'disabled'}`}>
          <Tabs defaultActiveKey={'properties'} id="inspector">
            <Tab eventKey="properties" title="Properties">
              {propertiesTab}
            </Tab>
            <Tab eventKey="styles" title="Styles">
              {stylesTab}
            </Tab>
          </Tabs>
        </div>
      </div>
      <span className="widget-documentation-link">
        <a href={getDocsLink(componentMeta)} target="_blank" rel="noreferrer" data-cy="widget-documentation-link">
          <span>
            <Student width={13} fill={'#3E63DD'} />
            <small className="widget-documentation-link-text">
              {t('widget.common.documentation', 'Read documentation for {{componentMeta}}', {
                componentMeta:
                  componentMeta.displayName === 'Toggle Switch (Legacy)'
                    ? 'Toggle (Legacy)'
                    : componentMeta.displayName === 'Toggle Switch'
                    ? 'Toggle Switch'
                    : componentMeta.component,
              })}
            </small>
          </span>
          <span>
            <ArrowRight width={20} fill={'#3E63DD'} />
          </span>
        </a>
      </span>
    </div>
  );
};

const getDocsLink = (componentMeta) => {
  const component = componentMeta?.component ?? '';
  switch (component) {
    case 'ToggleSwitchV2':
      return 'https://docs.tooljet.io/docs/widgets/toggle-switch';
    case 'DropdownV2':
      return 'https://docs.tooljet.com/docs/widgets/dropdown';
    case 'DropDown':
      return 'https://docs.tooljet.com/docs/widgets/dropdown';
    case 'MultiselectV2':
      return 'https://docs.tooljet.com/docs/widgets/multiselect';
    case 'DaterangePicker':
      return 'https://docs.tooljet.com/docs/widgets/date-range-picker';
    default:
      return `https://docs.tooljet.io/docs/widgets/${convertToKebabCase(component)}`;
  }
};
const widgetsWithStyleConditions = {
  Modal: {
    conditions: [
      {
        definition: 'properties', //expecting properties or styles
        property: 'useDefaultButton', //expecting a property name
        conditionStyles: ['triggerButtonBackgroundColor', 'triggerButtonTextColor'], //expecting an array of style definitions names
      },
    ],
  },
  Table: {
    conditions: [
      {
        definition: 'styles',
        property: 'contentWrap',
        conditionStyles: ['maxRowHeight', 'autoHeight'],
        type: 'toggle',
      },
    ],
  },
};

const RenderStyleOptions = ({ componentMeta, component, paramUpdated, dataQueries, currentState, allComponents }) => {
  // Initialize an object to group properties by "accordian"
  const groupedProperties = {};
  if (NEW_REVAMPED_COMPONENTS.includes(component.component.component)) {
    // Iterate over the properties in componentMeta.styles
    for (const key in componentMeta.styles) {
      const property = componentMeta.styles[key];
      const accordian = property.accordian;

      // Check if the "accordian" key exists in groupedProperties
      if (!groupedProperties[accordian]) {
        groupedProperties[accordian] = {}; // Create an empty object for the "accordian" key if it doesn't exist
      }

      // Add the property to the corresponding "accordian" object
      groupedProperties[accordian][key] = property;
    }
  }

  return Object.keys(
    NEW_REVAMPED_COMPONENTS.includes(component.component.component) ? groupedProperties : componentMeta.styles
  ).map((style) => {
    const conditionWidget = widgetsWithStyleConditions[component.component.component] ?? null;
    const condition = conditionWidget?.conditions.find((condition) => condition.property) ?? {};

    if (conditionWidget && conditionWidget.conditions.find((condition) => condition.conditionStyles.includes(style))) {
      const propertyConditon = condition?.property;
      const widgetPropertyDefinition = condition?.definition;

      return handleRenderingConditionalStyles(
        component,
        componentMeta,
        dataQueries,
        paramUpdated,
        currentState,
        allComponents,
        style,
        propertyConditon,
        component?.component?.definition[widgetPropertyDefinition]
      );
    }

    const items = [];

    if (NEW_REVAMPED_COMPONENTS.includes(component.component.component)) {
      items.push({
        title: `${style}`,
        children: Object.entries(groupedProperties[style]).map(([key, value]) => ({
          ...renderCustomStyles(
            component,
            componentMeta,
            paramUpdated,
            dataQueries,
            key,
            'styles',
            currentState,
            allComponents,
            value.accordian
          ),
        })),
      });
      return <Accordion key={style} items={items} />;
    } else {
      return renderElement(
        component,
        componentMeta,
        paramUpdated,
        dataQueries,
        style,
        'styles',
        currentState,
        allComponents
      );
    }
  });
};

const resolveConditionalStyle = (definition, condition, currentState) => {
  const conditionExistsInDefinition = definition[condition] ?? false;
  if (conditionExistsInDefinition) {
    switch (condition) {
      case 'cellSize': {
        const cellSize = resolveReferences(definition[condition]?.value ?? false) === 'hugContent';
        return cellSize;
      }
      default:
        return resolveReferences(definition[condition]?.value ?? false);
    }
  }
};

const handleRenderingConditionalStyles = (
  component,
  componentMeta,
  dataQueries,
  paramUpdated,
  currentState,
  allComponents,
  style,
  renderingPropertyCondition,
  definition
) => {
  return resolveConditionalStyle(definition, renderingPropertyCondition, currentState)
    ? renderElement(component, componentMeta, paramUpdated, dataQueries, style, 'styles', currentState, allComponents)
    : null;
};

const GetAccordion = React.memo(
  ({ componentName, ...restProps }) => {
    switch (componentName) {
      case 'Table':
        return <Table {...restProps} />;

      case 'Chart':
        return <Chart {...restProps} />;

      case 'FilePicker':
        return <FilePicker {...restProps} />;

      case 'Modal':
        return <Modal {...restProps} />;

      case 'CustomComponent':
        return <CustomComponent {...restProps} />;

      case 'Icon':
        return <Icon {...restProps} />;

      case 'Form':
        return <Form {...restProps} />;

      case 'DropdownV2':
      case 'MultiselectV2':
        return <Select {...restProps} />;

      default: {
        return <DefaultComponent {...restProps} />;
      }
    }
  },
  (prevProps, nextProps) => {
    prevProps.componentName === nextProps.componentName;
  }
);

Inspector.RenderStyleOptions = RenderStyleOptions;
