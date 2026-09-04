import React from 'react';
import _ from 'lodash';
import { useCurrentState } from '@/_stores/currentStateStore';
import CodeEditor from '@/AppBuilder/CodeEditor';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { getFlexAxisAwareMeta } from '../Components/FlexContainer/flexChildInspectorUtils';
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
  setCodeEditorView,
  customMeta,
  canRefresh = true,
}) => {
  const currentState = useCurrentState();

  function getInitialValue() {
    if (customMeta && customMeta.defaultValue) {
      return customMeta.defaultValue;
    }
    return !_.isEmpty(definition)
      ? definition.value
      : getDefinitionInitialValue(paramType, param.name, component, currentState, definition.value);
  }

  let initialValue = getInitialValue();
  const rawParamMeta = accordian
    ? customMeta ?? componentMeta[paramType]?.[param.name]
    : customMeta ?? componentMeta[paramType][param.name];
  const isFlexContainer = component?.component?.component === 'FlexContainer';
  const paramMeta = isFlexContainer ? getFlexAxisAwareMeta(rawParamMeta, component, param.name) : rawParamMeta;
  const displayName = paramMeta.displayName || param.name;

  function handleCodeChanged(value) {
    onChange(param, 'value', value, paramType);
  }

  const options = paramMeta?.options || {};

  // `paramType` is the definition section here but the field type inside the editor, so the stash
  // key and widget default can only be built in this scope.
  const componentType = component?.component?.component;
  const fxFallbackValue = componentTypeDefinitionMap[componentType]?.definition?.[paramType]?.[param.name]?.value;
  const fxStashKey = component?.id && `${component.id}-${paramType}-${param.name}`;

  const getfieldName = React.useMemo(() => {
    return param.name;
  }, [param]);

  function onVisibilityChange(value) {
    onChange({ name: 'iconVisibility' }, 'value', value, 'styles');
  }

  if (isHidden) return null;
  return (
    <div className={`field tw-mb-2 last:tw-mb-0 ${options.className ?? ''}`}>
      <CodeEditor
        type="fxEditor"
        initialValue={initialValue}
        paramName={param.name}
        paramLabel={paramMeta?.showLabel !== false ? displayName : ' '}
        paramType={paramMeta?.type}
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
        cyLabel={paramMeta?.showLabel === false ? param.name?.toLowerCase() : ''}
        setCodeEditorView={setCodeEditorView}
        canRefresh={canRefresh}
        fxStashKey={fxStashKey}
        fxFallbackValue={fxFallbackValue}
      />
    </div>
  );
};
