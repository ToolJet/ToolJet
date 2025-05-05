import React, { useMemo, useCallback } from 'react';
import { getComponentToRender } from '@/AppBuilder/_helpers/editorHelpers';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const RenderSchema = ({ component, parent, id, onOptionChange, onOptionsChange, darkMode }) => {
  const ComponentToRender = useMemo(() => getComponentToRender(component?.component), [component?.component]);
  const validateWidget = useStore((state) => state.validateWidget, shallow);

  const setExposedVariable = useCallback(
    (key, value) => {
      onOptionChange(component, key, value, id);
    },
    [id, onOptionChange]
  );

  const setExposedVariables = useCallback(
    (exposedValues) => {
      onOptionsChange(component, exposedValues, id);
    },
    [id, onOptionsChange]
  );

  const validate = useCallback(
    (value) => {
      return validateWidget({
        ...{ widgetValue: value },
        ...{ validationObject: component.definition.validation },
        componentType: component?.component,
      });
    },
    [component.definition.validation]
  );

  const fireEvent = useCallback(() => {
    return Promise.resolve();
  }, []);

  const formId = `${parent}-${id}`;
  return (
    <ComponentToRender
      properties={component?.definition?.properties}
      styles={component?.definition?.styles}
      generalProperties={component?.definition?.general}
      generalStyles={component?.definition?.generalStyles}
      width={component?.defaultSize?.width}
      height={component?.defaultSize?.height}
      setExposedVariable={setExposedVariable}
      setExposedVariables={setExposedVariables}
      validate={validate}
      darkMode={darkMode}
      fireEvent={fireEvent}
      formId={formId}
      id={id}
    />
  );
};

export default RenderSchema;
