import React from 'react';
import _ from 'lodash';
import { useCurrentState } from '@/_stores/currentStateStore';
import CodeEditor from '@/AppBuilder/CodeEditor';
import { getDefinitionInitialValue } from './utils';

const CLIENT_SERVER_TOGGLE_FIELDS = ['serverSidePagination', 'serverSideSort', 'serverSideFilter'];

export const Code = ({
  param,
  definition,
  onChange,
  paramType,
  componentMeta,
  componentName,
  onFxPress,
  fxActive,
  component,
  accordian,
  placeholder,
  validationFn,
  isHidden = false,
}) => {
  const currentState = useCurrentState();

  let initialValue = !_.isEmpty(definition)
    ? definition.value
    : getDefinitionInitialValue(paramType, param.name, component, currentState, definition.value);

  const paramMeta = accordian ? componentMeta[paramType]?.[param.name] : componentMeta[paramType][param.name];
  const displayName = paramMeta.displayName || param.name;

  function handleCodeChanged(value) {
    onChange(param, 'value', value, paramType);
  }

  const options = paramMeta.options || {};

  const getfieldName = React.useMemo(() => {
    return param.name;
  }, [param]);

  function onVisibilityChange(value) {
    onChange({ name: 'iconVisibility' }, 'value', value, 'styles');
  }

  if (isHidden) return null;
  return (
    <div className={`field ${options.className}`} style={{ marginBottom: '8px' }}>
      <CodeEditor
        type="fxEditor"
        initialValue={initialValue}
        paramName={param.name}
        paramLabel={paramMeta?.showLabel !== false ? displayName : ' '}
        paramType={paramMeta.type}
        fieldMeta={paramMeta}
        onFxPress={onFxPress}
        fxActive={CLIENT_SERVER_TOGGLE_FIELDS.includes(param.name) ? false : fxActive} // Client Server Toggle don't support Fx
        componentName={`component/${componentName}::${getfieldName}`}
        onChange={(value) => handleCodeChanged(value)}
        className={options?.className}
        componentId={component?.id}
        styleDefinition={component?.component?.definition?.styles ?? {}}
        component={component?.component?.component}
        onVisibilityChange={onVisibilityChange}
        placeholder={placeholder}
        validationFn={validationFn}
        cyLabel=""
      />
    </div>
  );
};
