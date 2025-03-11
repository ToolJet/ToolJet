import React, { useContext, useEffect } from 'react';
import ControlledComponentToRender from './ControlledComponentToRender';
import { renderTooltip, onComponentOptionChanged, onComponentOptionsChanged } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import '@/_styles/custom.scss';
import { EditorContext } from './Context/EditorContextWrapper';
import { validateWidget } from '@/_helpers/utils';
import { useCurrentState, useCurrentStateStore } from '@/_stores/currentStateStore';
import { useAppDataStore } from '@/_stores/appDataStore';
import _ from 'lodash';

const shouldAddBoxShadowAndVisibility = [
  'Table',
  'TextInput',
  'PasswordInput',
  'NumberInput',
  'Text',
  'Checkbox',
  'Button',
  'ToggleSwitchV2',
  'DropdownV2',
  'MultiselectV2',
  'Tabs',
];

const BoxUI = (props) => {
  const { t } = useTranslation();

  const {
    inCanvas,
    component,
    properties,
    styles,
    generalProperties,
    generalStyles,
    mode,
    onComponentClick,
    onEvent,
    id,
    getContainerProps,
    paramUpdated,
    width,
    height,
    changeCanDrag,
    removeComponent,
    canvasWidth,
    parentId,
    customResolvables,
    currentLayout,
    readOnly,
    currentPageId,
    onOptionChanged,
    onOptionsChanged,
    isFromSubContainer,
    childComponents,
    darkMode,
  } = props;

  const { variablesExposedForPreview, exposeToCodeHinter } = useContext(EditorContext) || {};

  const currentState = useCurrentState();

  const validate = (value) =>
    validateWidget({
      ...{ widgetValue: value },
      ...{ validationObject: component.definition.validation, currentState },
      customResolveObjects: customResolvables,
    });

  useEffect(() => {
    if (customResolvables && !readOnly && mode === 'edit') {
      const newCustomResolvable = {};
      newCustomResolvable[id] = { ...customResolvables };
      exposeToCodeHinter((prevState) => ({ ...prevState, ...newCustomResolvable }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(customResolvables), readOnly]);

  let exposedVariables = !_.isEmpty(currentState?.components) ? currentState?.components[component.name] ?? {} : {};
  const fireEvent = (eventName, options) => {
    if (!useCurrentStateStore.getState().isEditorReady) return;
    if (mode === 'edit' && eventName === 'onClick') {
      onComponentClick(id, component);
    }

    const componentEvents = useAppDataStore.getState().events.filter((event) => event.sourceId === id);

    onEvent(eventName, componentEvents, { ...options, customVariables: { ...customResolvables } });
  };

  let _styles = {
    height: '100%',
  };

  useEffect(() => {
    if (!component?.parent) {
      onComponentOptionChanged(component, 'id', id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OverlayTrigger
      placement={inCanvas ? 'auto' : 'top'}
      delay={{ show: 500, hide: 0 }}
      trigger={
        inCanvas && shouldAddBoxShadowAndVisibility.includes(component.component)
          ? !properties.tooltip?.toString().trim()
            ? null
            : ['hover', 'focus']
          : !generalProperties.tooltip?.toString().trim()
          ? null
          : ['hover', 'focus']
      }
      overlay={(props) =>
        renderTooltip({
          props,
          text: inCanvas
            ? `${
                shouldAddBoxShadowAndVisibility.includes(component.component)
                  ? properties.tooltip
                  : generalProperties.tooltip
              }`
            : `${t(`widget.${component.name}.description`, component.description)}`,
        })
      }
    >
      <div
        style={{
          ..._styles,
          padding: styles?.padding == 'none' ? '0px' : '2px', //chart and image has a padding property other than container padding
        }}
        role={'Box'}
        className={inCanvas ? `_tooljet-${component.component} _tooljet-${component.name}` : ''} //required for custom CSS
      >
        <ControlledComponentToRender
          componentName={component.component}
          onComponentClick={onComponentClick}
          onEvent={onEvent}
          id={id}
          paramUpdated={paramUpdated}
          width={width}
          changeCanDrag={changeCanDrag}
          onComponentOptionChanged={isFromSubContainer ? onOptionChanged : onComponentOptionChanged}
          onComponentOptionsChanged={isFromSubContainer ? onOptionsChanged : onComponentOptionsChanged}
          setExposedVariable={(variable, value) =>
            isFromSubContainer
              ? onOptionChanged(component, variable, value, id)
              : onComponentOptionChanged(component, variable, value, id)
          }
          setExposedVariables={(variableSet) => {
            if (isFromSubContainer) {
              onOptionsChanged(component, Object.entries(variableSet), id);
            } else {
              onComponentOptionsChanged(component, Object.entries(variableSet), id);
            }
          }}
          height={height}
          component={component}
          containerProps={getContainerProps(id)}
          darkMode={darkMode}
          removeComponent={removeComponent}
          canvasWidth={canvasWidth}
          properties={properties}
          exposedVariables={exposedVariables}
          styles={{
            ...styles,
            ...(!shouldAddBoxShadowAndVisibility.includes(component.component)
              ? { boxShadow: generalStyles?.boxShadow }
              : {}),
          }}
          fireEvent={fireEvent}
          validate={validate}
          parentId={parentId}
          customResolvables={customResolvables}
          variablesExposedForPreview={variablesExposedForPreview}
          exposeToCodeHinter={exposeToCodeHinter}
          setProperty={(property, value) => {
            paramUpdated(id, property, { value });
          }}
          mode={mode}
          //   resetComponent={() => setResetStatus(true)}
          dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
          currentLayout={currentLayout}
          currentState={currentState}
          currentPageId={currentPageId}
          getContainerProps={component.component === 'Form' ? getContainerProps : null}
          childComponents={childComponents}
        />
      </div>
    </OverlayTrigger>
  );
};

export default BoxUI;
