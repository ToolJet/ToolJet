import React, { useState, useRef, useEffect } from 'react';
import cx from 'classnames';
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

export const Inspector = ({
  selectedComponentId,
  componentDefinitionChanged,
  allComponents,
  apps,
  darkMode,
  switchSidebarTab,
  removeComponent,
  pages,
}) => {
  const dataQueries = useDataQueries();
  const component = {
    id: selectedComponentId,
    component: allComponents[selectedComponentId].component,
    layouts: allComponents[selectedComponentId].layouts,
    parent: allComponents[selectedComponentId].parent,
  };
  const currentState = useCurrentState();
  const [showWidgetDeleteConfirmation, setWidgetDeleteConfirmation] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [tabHeight, setTabHeight] = React.useState(0);
  const componentNameRef = useRef(null);
  const [newComponentName, setNewComponentName] = useState(component.component.name);
  const [inputRef, setInputFocus] = useFocus();
  const [selectedTab, setSelectedTab] = useState('properties');
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
  useHotkeys('escape', () => switchSidebarTab(2));

  const componentMeta = componentTypes.find((comp) => component.component.component === comp.component);

  const isMounted = useMounted();

  useEffect(() => {
    componentNameRef.current = newComponentName;
  }, [newComponentName]);

  useEffect(() => {
    return () => {
      handleComponentNameChange(componentNameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateComponentName = (name) => {
    const isValid = !Object.values(allComponents)
      .map((component) => component.component.name)
      .includes(name);

    if (component.component.name === name) {
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
      const childComponents = Object.keys(allComponents).filter((key) => allComponents[key].parent === component.id);

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

  return (
    <div className="inspector">
      <ConfirmDialog
        show={showWidgetDeleteConfirmation}
        message={'Widget will be deleted, do you want to continue?'}
        onConfirm={() => {
          switchSidebarTab(2);
          removeComponent(component);
        }}
        onCancel={() => setWidgetDeleteConfirmation(false)}
        darkMode={darkMode}
      />
      <div>
        <div className="row inspector-component-title-input-holder">
          <div className={`col-11 p-0 ${isVersionReleased && 'disabled'}`}>
            <div className="input-icon">
              <input
                onChange={(e) => setNewComponentName(e.target.value)}
                type="text"
                onBlur={() => handleComponentNameChange(newComponentName)}
                className="w-100 form-control-plaintext form-control-plaintext-sm mt-1"
                value={newComponentName}
                ref={inputRef}
                data-cy="edit-widget-name"
              />
              <span className="input-icon-addon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M13.1667 3.11667L10.8833 0.833337C10.5853 0.553417 10.1948 0.392803 9.78611 0.382047C9.3774 0.371291 8.97899 0.511145 8.66667 0.775004L1.16667 8.275C0.897308 8.54664 0.72959 8.90267 0.69167 9.28334L0.333336 12.7583C0.322111 12.8804 0.337948 13.0034 0.379721 13.1187C0.421493 13.2339 0.488172 13.3385 0.575003 13.425C0.65287 13.5022 0.745217 13.5633 0.846748 13.6048C0.948279 13.6463 1.057 13.6673 1.16667 13.6667H1.24167L4.71667 13.35C5.09733 13.3121 5.45337 13.1444 5.725 12.875L13.225 5.375C13.5161 5.06748 13.6734 4.65709 13.6625 4.23378C13.6516 3.81047 13.4733 3.40876 13.1667 3.11667ZM4.56667 11.6833L2.06667 11.9167L2.29167 9.41667L7 4.76667L9.25 7.01667L4.56667 11.6833ZM10.3333 5.9L8.1 3.66667L9.725 2L12 4.275L10.3333 5.9Z"
                    fill="#8092AC"
                  />
                </svg>
              </span>
            </div>
          </div>
          <div className="col-1" onClick={() => switchSidebarTab(2)}>
            <div className="inspector-close-icon-wrapper cursor-pointer" data-cy={`inspector-close-icon`}>
              <svg
                width="20"
                height="21"
                viewBox="0 0 20 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="close-svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9.99931 10.9751L15.0242 16.0014L16 15.027L10.9737 10.0007L16 4.97577L15.0256 4L9.99931 9.0263L4.97439 4L4 4.97577L9.02492 10.0007L4 15.0256L4.97439 16.0014L9.99931 10.9751Z"
                  fill="#8092AC"
                />
              </svg>
            </div>
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

      <a
        href={`https://docs.tooljet.io/docs/widgets/${convertToKebabCase(componentMeta?.name ?? '')}`}
        target="_blank"
        rel="noreferrer"
        className="widget-documentation-link"
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
    </div>
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
        component.component?.definition[widgetPropertyDefinition]
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
