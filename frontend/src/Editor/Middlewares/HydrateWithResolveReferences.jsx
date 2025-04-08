import React, { useEffect, useMemo } from 'react';
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
import { useCurrentStateStore } from '@/_stores/currentStateStore';

const shouldAddBoxShadowAndVisibility = ['TextInput', 'PasswordInput', 'NumberInput', 'Text'];

const getComponentMetaData = memoizeFunction((componentType) => {
  return componentTypes.find((comp) => componentType === comp.component);
});

const HydrateWithResolveReferences = ({ id, mode, component, customResolvables, children }) => {
  const componentMeta = useMemo(() => getComponentMetaData(component?.component), []);

  const resolvedProperties = resolveProperties(component, {}, null, customResolvables, id);

  const resolvedStyles = resolveStyles(component, {}, null, customResolvables);

  const resolvedGeneralProperties = resolveGeneralProperties(component, {}, null, customResolvables);

  const resolvedGeneralStyles = resolveGeneralStyles(component, {}, null, customResolvables);

  const [validatedProperties, propertyErrors] = component.validate
    ? validateProperties(resolvedProperties, componentMeta.properties)
    : [resolvedProperties, []];

  if (shouldAddBoxShadowAndVisibility.includes(component.component)) {
    validatedProperties.visibility = validatedProperties.visibility !== false ? true : false;
  }

  const [validatedStyles, styleErrors] = component.validate
    ? validateProperties(resolvedStyles, componentMeta.styles)
    : [resolvedStyles, []];

  if (!shouldAddBoxShadowAndVisibility.includes(component.component)) {
    validatedStyles.visibility = validatedStyles.visibility !== false ? true : false;
  }

  const [validatedGeneralProperties, generalPropertiesErrors] = component.validate
    ? validateProperties(resolvedGeneralProperties, componentMeta.general)
    : [resolvedGeneralProperties, []];

  const [validatedGeneralStyles, generalStylesErrors] = component.validate
    ? validateProperties(resolvedGeneralStyles, componentMeta.generalStyles)
    : [resolvedGeneralStyles, []];

  useEffect(() => {
    const isEditorReady = useCurrentStateStore.getState().isEditorReady;

    if (!isEditorReady) return;
    const currentState = useCurrentStateStore.getState();

    const currentPage = currentState?.page;
    const componentName = getComponentName(currentState, id);
    const errorLog = Object.fromEntries(
      [...propertyErrors, ...styleErrors, ...generalPropertiesErrors, ...generalStylesErrors].map((error) => [
        `${componentName} - ${error.property}`,
        {
          page: currentPage,
          type: 'component',
          kind: 'component',
          componentId: id,
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
