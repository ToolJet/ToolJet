import React, { useState, useRef, useEffect } from 'react';
import { componentTypes } from '../WidgetManager/components';
import { Table } from './Components/Table/Table.jsx';
import { Chart } from './Components/Chart';
import { Form } from './Components/Form';
import { renderElement } from './Utils';
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
import _, { isEmpty } from 'lodash';
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

export const Inspector = ({
  componentDefinitionChanged,
  allComponents,
  apps,
  darkMode,
  removeComponent,
  pages,
  cloneComponents,
}) => {
  const dataQueries = useDataQueries();

  const currentState = useCurrentState();
  const { selectedComponentId, selectedComponents, setSelectedComponents } = useEditorStore(
    (state) => ({
      selectedComponentId: state.selectedComponents[0]?.id,
      selectedComponents: state.selectedComponents,
      setSelectedComponents: state.actions.setSelectedComponents,
    }),
    shallow
  );
  const component = {
    id: selectedComponentId,
    component: allComponents[selectedComponentId]?.component,
    layouts: allComponents[selectedComponentId]?.layouts,
    parent: allComponents[selectedComponentId]?.parent,
  };
  const [showWidgetDeleteConfirmation, setWidgetDeleteConfirmation] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [tabHeight, setTabHeight] = React.useState(0);
  const [newComponentName, setNewComponentName] = useState('');
  const [inputRef, setInputFocus] = useFocus();
  const [showHeaderActionsMenu, setShowHeaderActionsMenu] = useState(false);
  const { isVersionReleased } = useAppVersionStore(
    (state) => ({
      isVersionReleased: state.isVersionReleased,
    }),
    shallow
  );
  const { t } = useTranslation();

  useHotkeys('backspace', () => {
    if (isVersionReleased) return;
    setWidgetDeleteConfirmation(true);
  });
  useHotkeys('escape', () => setSelectedComponents(EMPTY_ARRAY));

  const componentMeta = componentTypes.find((comp) => component?.component?.component === comp?.component);

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
      let newComponent = { ...component };
      newComponent.component.name = newName;
      componentDefinitionChanged(newComponent);
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

  function paramUpdated(param, attr, value, paramType) {
    console.log({ param, attr, value, paramType });
    let newDefinition = _.cloneDeep(component.component.definition);
    let allParams = newDefinition[paramType] || {};
    const paramObject = allParams[param.name];
    if (!paramObject) {
      allParams[param.name] = {};
    }
    if (attr) {
      allParams[param.name][attr] = value;
      const defaultValue = getDefaultValue(value);
      // This is needed to have enable pagination as backward compatible
      // Whenever enable pagination is false, we turn client and server side pagination as false
      if (param.name === 'enablePagination' && !resolveReferences(value, currentState)) {
        if (allParams?.['clientSidePagination']?.[attr]) {
          allParams['clientSidePagination'][attr] = value;
        }
        allParams['serverSidePagination'][attr] = value;
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
    let newComponent = _.merge(component, {
      component: {
        definition: newDefinition,
      },
    });
    componentDefinitionChanged(newComponent);
  }

  function layoutPropertyChanged(param, attr, value, paramType) {
    paramUpdated(param, attr, value, paramType);

    // User wants to show the widget on mobile devices
    if (param.name === 'showOnMobile' && value === true) {
      let newComponent = {
        ...component,
      };

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

      componentDefinitionChanged(newComponent);

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

        componentDefinitionChanged(newChild);
      });
    }
  }

  function eventUpdated(event, actionId) {
    let newDefinition = { ...component.component.definition };
    newDefinition.events[event.name] = { actionId };

    let newComponent = {
      ...component,
    };

    componentDefinitionChanged(newComponent);
  }

  function eventsChanged(newEvents, isReordered = false) {
    let newDefinition;
    if (isReordered) {
      newDefinition = { ...component.component };
      newDefinition.definition.events = newEvents;
    } else {
      newDefinition = { ...component.component.definition };
      newDefinition.events = newEvents;
    }

    let newComponent = {
      ...component,
    };

    componentDefinitionChanged(newComponent);
  }

  function eventOptionUpdated(event, option, value) {
    console.log('eventOptionUpdated', event, option, value);

    let newDefinition = { ...component.component.definition };
    let eventDefinition = newDefinition.events[event.name] || { options: {} };

    newDefinition.events[event.name] = { ...eventDefinition, options: { ...eventDefinition.options, [option]: value } };

    let newComponent = {
      ...component,
    };

    componentDefinitionChanged(newComponent);
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
    <GetAccordion
      componentName={componentMeta.component}
      layoutPropertyChanged={layoutPropertyChanged}
      component={component}
      paramUpdated={paramUpdated}
      dataQueries={dataQueries}
      componentMeta={componentMeta}
      eventUpdated={eventUpdated}
      eventOptionUpdated={eventOptionUpdated}
      components={allComponents}
      currentState={currentState}
      darkMode={darkMode}
      eventsChanged={eventsChanged}
      apps={apps}
      pages={pages}
      allComponents={allComponents}
    />
  );

  const stylesTab = (
    <div style={{ marginBottom: '6rem' }}>
      <div className="p-3">
        <Inspector.RenderStyleOptions
          componentMeta={componentMeta}
          component={component}
          paramUpdated={paramUpdated}
          dataQueries={dataQueries}
          currentState={currentState}
          allComponents={allComponents}
        />
      </div>
      {buildGeneralStyle()}
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
  if (!selectedComponents.length) return null;
  return (
    <>
      {selectedComponents.length !== 1 && isEmpty(allComponents) && isEmpty(allComponents[selectedComponentId]) ? (
        <center className="mt-5 p-2">
          {this.props.t('editor.inspectComponent', 'Please select a component to inspect')}
        </center>
      ) : (
        <div className="inspector">
          <ConfirmDialog
            show={showWidgetDeleteConfirmation}
            message={'Widget will be deleted, do you want to continue?'}
            onConfirm={() => {
              setSelectedComponents(EMPTY_ARRAY);
              EMPTY_ARRAY;
              removeComponent(component);
            }}
            onCancel={() => setWidgetDeleteConfirmation(false)}
            darkMode={darkMode}
          />
          <div>
            <div className="row inspector-component-title-input-holder">
              <div className="col-1" onClick={() => setSelectedComponents(EMPTY_ARRAY)}>
                <span data-cy={`inspector-close-icon`} className="cursor-pointer">
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
              <div className="col-2">
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
            <div>
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
            <a
              href={`https://docs.tooljet.io/docs/widgets/${convertToKebabCase(componentMeta?.name ?? '')}`}
              target="_blank"
              rel="noreferrer"
              data-cy="widget-documentation-link"
            >
              <span>
                <Student width={13} fill={'#3E63DD'} />
                <small className="widget-documentation-link-text">
                  {t('widget.common.documentation', 'Read documentation for {{componentMeta}}', {
                    componentMeta: componentMeta.name,
                  })}
                </small>
              </span>
              <span>
                <ArrowRight width={20} fill={'#3E63DD'} />
              </span>
            </a>
          </span>
        </div>
      )}
    </>
  );
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
};

const RenderStyleOptions = ({ componentMeta, component, paramUpdated, dataQueries, currentState, allComponents }) => {
  return Object.keys(componentMeta.styles).map((style) => {
    const conditionWidget = widgetsWithStyleConditions[component?.component?.component] ?? null;
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
  });
};

const resolveConditionalStyle = (definition, condition, currentState) => {
  const conditionExistsInDefinition = definition[condition] ?? false;
  if (conditionExistsInDefinition) {
    return resolveReferences(definition[condition]?.value ?? false, currentState);
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
