import React, { useEffect, useState, useMemo, useContext, memo } from 'react';

import {
  renderTooltip,
  getComponentName,
  onComponentOptionChanged,
  onComponentOptionsChanged,
  debuggerActions,
} from '@/_helpers/appUtils';

import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import '@/_styles/custom.scss';
import { validateProperties } from './component-properties-validation';
import { validateWidget } from '@/_helpers/utils';
import { componentTypes } from './WidgetManager/components';
import {
  resolveProperties,
  resolveStyles,
  resolveGeneralProperties,
  resolveGeneralStyles,
} from './component-properties-resolution';
import _ from 'lodash';
import { EditorContext } from '@/Editor/Context/EditorContextWrapper';
import { useTranslation } from 'react-i18next';
import { useCurrentState } from '@/_stores/currentStateStore';
import { useAppInfo } from '@/_stores/appDataStore';
import { isPDFSupported } from '@/_stores/utils';
import ControlledComponentToRender from './ControlledComponentToRender';

/**
 * Conditionally importing PDF component since importing it breaks app in older versions of browsers.
 * refer: https://github.com/wojtekmaj/react-pdf?tab=readme-ov-file#compatibility
 **/
// if (isPDFSupported()) {
//   AllComponents.PDF = await import('./Components/PDF').then((module) => module.PDF);
// }

export const Box = memo(
  ({
    id,
    width,
    height,
    yellow,
    preview,
    component,
    inCanvas,
    onComponentClick,
    onEvent,
    paramUpdated,
    changeCanDrag,
    removeComponent,
    canvasWidth,
    mode,
    customResolvables,
    parentId,
    readOnly,
    currentLayout,
    getContainerProps,
  }) => {
    const { t } = useTranslation();
    const backgroundColor = yellow ? 'yellow' : '';
    const currentState = useCurrentState();
    const { events } = useAppInfo();
    const shouldAddBoxShadowAndVisibility = ['TextInput', 'PasswordInput', 'NumberInput', 'Text'];

    const componentMeta = useMemo(() => {
      return componentTypes.find((comp) => component.component === comp.component);
    }, [component]);

    const [renderCount, setRenderCount] = useState(0);
    const [renderStartTime, setRenderStartTime] = useState(new Date());
    const [resetComponent, setResetStatus] = useState(false);

    const resolvedProperties = resolveProperties(component, currentState, null, customResolvables);
    const [validatedProperties, propertyErrors] =
      mode === 'edit' && component.validate
        ? validateProperties(resolvedProperties, componentMeta.properties)
        : [resolvedProperties, []];
    if (shouldAddBoxShadowAndVisibility.includes(component.component)) {
      validatedProperties.visibility = validatedProperties.visibility !== false ? true : false;
    }

    const resolvedStyles = resolveStyles(component, currentState, null, customResolvables);
    const [validatedStyles, styleErrors] =
      mode === 'edit' && component.validate
        ? validateProperties(resolvedStyles, componentMeta.styles)
        : [resolvedStyles, []];
    if (!shouldAddBoxShadowAndVisibility.includes(component.component)) {
      validatedStyles.visibility = validatedStyles.visibility !== false ? true : false;
    }
    const resolvedGeneralProperties = resolveGeneralProperties(component, currentState, null, customResolvables);
    const [validatedGeneralProperties, generalPropertiesErrors] = component.validate
      ? validateProperties(resolvedGeneralProperties, componentMeta.general)
      : [resolvedGeneralProperties, []];

    const resolvedGeneralStyles = resolveGeneralStyles(component, currentState, null, customResolvables);

    const [validatedGeneralStyles, generalStylesErrors] =
      mode === 'edit' && component.validate
        ? validateProperties(resolvedGeneralStyles, componentMeta.generalStyles)
        : [resolvedGeneralStyles, []];

    const darkMode = localStorage.getItem('darkMode') === 'true';
    const { variablesExposedForPreview, exposeToCodeHinter } = useContext(EditorContext) || {};

    let styles = {
      height: '100%',
    };

    if (inCanvas) {
      styles = {
        ...styles,
      };
    }
    useEffect(() => {
      if (!component?.parent) {
        onComponentOptionChanged(component, 'id', id);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); /*computeComponentState was not getting the id on initial render therefore exposed variables were not set.
  computeComponentState was being executed before addNewWidgetToTheEditor was completed.*/

    useEffect(() => {
      const currentPage = currentState?.page;
      const componentName = getComponentName(currentState, id);
      const errorLog = Object.fromEntries(
        [...propertyErrors, ...styleErrors, ...generalPropertiesErrors, ...generalStylesErrors].map((error) => [
          `${componentName} - ${error.property}`,
          {
            page: currentPage,
            type: 'component',
            kind: 'component',
            strace: 'page_level',
            data: { message: `${error.message}`, status: true },
            resolvedProperties: resolvedProperties,
            effectiveProperties: validatedProperties,
          },
        ])
      );
      debuggerActions?.error(errorLog);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify({ propertyErrors, styleErrors, generalPropertiesErrors })]);

    useEffect(() => {
      setRenderCount(renderCount + 1);
      if (renderCount > 10) {
        setRenderCount(0);
        const currentTime = new Date();
        const timeDifference = Math.abs(currentTime - renderStartTime);
        if (timeDifference < 1000) {
          throw Error;
        }
        setRenderStartTime(currentTime);
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify({ validatedProperties, validatedStyles })]);

    useEffect(() => {
      if (customResolvables && !readOnly && mode === 'edit') {
        const newCustomResolvable = {};
        newCustomResolvable[id] = { ...customResolvables };
        exposeToCodeHinter((prevState) => ({ ...prevState, ...newCustomResolvable }));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(customResolvables), readOnly]);
    useEffect(() => {
      if (resetComponent) setResetStatus(false);
    }, [resetComponent]);

    let exposedVariables = currentState?.components[component.name] ?? {};
    const fireEvent = (eventName, options) => {
      if (mode === 'edit' && eventName === 'onClick') {
        onComponentClick(id, component);
      }

      const componentEvents = events.filter((event) => event.sourceId === id);

      onEvent(eventName, componentEvents, { ...options, customVariables: { ...customResolvables } });
    };
    const validate = (value) =>
      validateWidget({
        ...{ widgetValue: value },
        ...{ validationObject: component.definition.validation, currentState },
        customResolveObjects: customResolvables,
      });

    const shouldHideWidget = component.component === 'PDF' && !isPDFSupported();

    return (
      <OverlayTrigger
        placement={inCanvas ? 'auto' : 'top'}
        delay={{ show: 500, hide: 0 }}
        trigger={
          inCanvas && shouldAddBoxShadowAndVisibility.includes(component.component)
            ? !validatedProperties.tooltip?.toString().trim()
              ? null
              : ['hover', 'focus']
            : !validatedGeneralProperties.tooltip?.toString().trim()
            ? null
            : ['hover', 'focus']
        }
        overlay={(props) =>
          renderTooltip({
            props,
            text: inCanvas
              ? `${
                  shouldAddBoxShadowAndVisibility.includes(component.component)
                    ? validatedProperties.tooltip
                    : validatedGeneralProperties.tooltip
                }`
              : `${t(`widget.${component.name}.description`, component.description)}`,
          })
        }
      >
        <div
          style={{
            ...styles,
            backgroundColor,
            padding: validatedStyles?.padding == 'none' ? '0px' : '2px', //chart and image has a padding property other than container padding
          }}
          role={preview ? 'BoxPreview' : 'Box'}
        >
          {!resetComponent && !shouldHideWidget ? (
            <ControlledComponentToRender
              componentName={component.component}
              onComponentClick={onComponentClick}
              onComponentOptionChanged={onComponentOptionChanged}
              currentState={currentState}
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
              properties={validatedProperties}
              exposedVariables={exposedVariables}
              styles={{
                ...validatedStyles,
                ...(!shouldAddBoxShadowAndVisibility.includes(component.component)
                  ? { boxShadow: validatedGeneralStyles?.boxShadow }
                  : {}),
              }}
              setExposedVariable={(variable, value) => onComponentOptionChanged(component, variable, value, id)}
              setExposedVariables={(variableSet) =>
                onComponentOptionsChanged(component, Object.entries(variableSet), id)
              }
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
              resetComponent={() => setResetStatus(true)}
              dataCy={`draggable-widget-${String(component.name).toLowerCase()}`}
              currentLayout={currentLayout}
            ></ControlledComponentToRender>
          ) : (
            <></>
          )}
        </div>
      </OverlayTrigger>
    );
  }
);
