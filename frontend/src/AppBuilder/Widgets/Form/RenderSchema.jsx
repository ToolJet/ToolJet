import React, { useMemo, useCallback } from 'react';
import { getComponentToRender } from '@/AppBuilder/_helpers/editorHelpers';
import useStore from '@/AppBuilder/_stores/store';
import { shallow } from 'zustand/shallow';

const RenderSchema = ({ component, id, onOptionChange, onOptionsChange }) => {
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

  const validate = (value) => {
    return validateWidget({
      ...{ widgetValue: value },
      ...{ validationObject: component.definition.validation },
    });
  };

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
      fireEvent={() => {}}
    />
  );
};

export default RenderSchema;
