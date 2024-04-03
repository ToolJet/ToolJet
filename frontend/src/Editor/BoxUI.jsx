import React, { useContext, useEffect } from 'react';
import ControlledComponentToRender from './ControlledComponentToRender';
import { renderTooltip, onComponentOptionChanged, onComponentOptionsChanged } from '@/_helpers/appUtils';
import { useTranslation } from 'react-i18next';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import '@/_styles/custom.scss';
import { EditorContext } from './Context/EditorContextWrapper';
import { validateWidget } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import { useAppInfo } from '@/_stores/appDataStore';

const shouldAddBoxShadowAndVisibility = ['TextInput', 'PasswordInput', 'NumberInput', 'Text'];

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
    // exposedVariables,
    // fireEvent,
    parentId,
    customResolvables,
    currentLayout,
    readOnly,
    currentPageId,
  } = props;

  const darkMode = localStorage.getItem('darkMode') === 'true';

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

  let exposedVariables = currentState?.components[component.name] ?? {};
  const { events } = useAppInfo();

  const fireEvent = (eventName, options) => {
    if (mode === 'edit' && eventName === 'onClick') {
      onComponentClick(id, component);
    }

    const componentEvents = events.filter((event) => event.sourceId === id);

    onEvent(eventName, componentEvents, { ...options, customVariables: { ...customResolvables } });
  };

  let _styles = {
    height: '100%',
  };

  if (inCanvas) {
    _styles = {
      ..._styles,
    };
  }
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
          //   backgroundColor,
          padding: _styles?.padding == 'none' ? '0px' : '2px', //chart and image has a padding property other than container padding
        }}
        // role={preview ? 'BoxPreview' : 'Box'}
        role={'Box'}
      >
        <ControlledComponentToRender
          componentName={component.component}
          onComponentClick={onComponentClick}
          onComponentOptionChanged={onComponentOptionChanged}
          onEvent={onEvent}
          id={id}
          paramUpdated={paramUpdated}
          width={width}
          changeCanDrag={changeCanDrag}
          onComponentOptionsChanged={onComponentOptionsChanged}
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
          setExposedVariable={(variable, value) => onComponentOptionChanged(component, variable, value, id)}
          setExposedVariables={(variableSet) => onComponentOptionsChanged(component, Object.entries(variableSet), id)}
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
        />
      </div>
    </OverlayTrigger>
  );
};

export default BoxUI;
