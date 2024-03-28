import React, { useEffect, useMemo, useState } from 'react';
import {
  resolveGeneralProperties,
  resolveGeneralStyles,
  resolveProperties,
  resolveStyles,
} from '../component-properties-resolution';
import { validateProperties } from '../component-properties-validation';
import { getComponentName, debuggerActions } from '@/_helpers/appUtils';
import { memoizeFunction } from '../../_helpers/editorHelpers';
import { componentTypes } from '../WidgetManager/components';
import { useCurrentState } from '@/_stores/currentStateStore';

const shouldAddBoxShadowAndVisibility = ['TextInput', 'PasswordInput', 'NumberInput', 'Text'];

const getComponentMetaData = memoizeFunction((componentType) => {
  return componentTypes.find((comp) => componentType === comp.component);
});

const HydrateWithResolveReferences = ({ id, mode, component, customResolvables, children }) => {
  const componentMeta = useMemo(() => getComponentMetaData(component?.component), []);

  const currentState = useCurrentState();

  const resolvedProperties = useMemo(() => {
    // console.log('---piku resol--arpit', { x, component });
    return resolveProperties(component, currentState, null, customResolvables, id);
  }, [component, currentState, customResolvables, id]);

  const resolvedStyles = useMemo(() => {
    return resolveStyles(component, currentState, null, customResolvables);
  }, [component, currentState, customResolvables]);

  const resolvedGeneralProperties = useMemo(() => {
    return resolveGeneralProperties(component, currentState, null, customResolvables);
  }, [component, currentState, customResolvables]);

  const resolvedGeneralStyles = useMemo(() => {
    return resolveGeneralStyles(component, currentState, null, customResolvables);
  }, [component, currentState, customResolvables]);

  //!-----

  const [validatedProperties, propertyErrors] =
    mode === 'edit' && component.validate
      ? validateProperties(resolvedProperties, componentMeta.properties)
      : [resolvedProperties, []];

  if (shouldAddBoxShadowAndVisibility.includes(component.component)) {
    validatedProperties.visibility = validatedProperties.visibility !== false ? true : false;
  }

  const [validatedStyles, styleErrors] =
    mode === 'edit' && component.validate
      ? validateProperties(resolvedStyles, componentMeta.styles)
      : [resolvedStyles, []];

  if (!shouldAddBoxShadowAndVisibility.includes(component.component)) {
    validatedStyles.visibility = validatedStyles.visibility !== false ? true : false;
  }

  const [validatedGeneralProperties, generalPropertiesErrors] = component.validate
    ? validateProperties(resolvedGeneralProperties, componentMeta.general)
    : [resolvedGeneralProperties, []];

  const [validatedGeneralStyles, generalStylesErrors] =
    mode === 'edit' && component.validate
      ? validateProperties(resolvedGeneralStyles, componentMeta.generalStyles)
      : [resolvedGeneralStyles, []];

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

  const resolvedReferences = useMemo(() => {
    return {
      properties: validatedProperties,
      styles: validatedStyles,
      generalProperties: validatedGeneralProperties,
      generalStyles: validatedGeneralStyles,
    };
  }, [validatedProperties, validatedStyles, validatedGeneralProperties, validatedGeneralStyles]);

  // Clone the child component with resolved props
  const childWithProps = React.Children.map(children, (child) => {
    return React.cloneElement(child, { ...resolvedReferences });
  });

  return <>{childWithProps}</>;
};

export default HydrateWithResolveReferences;
