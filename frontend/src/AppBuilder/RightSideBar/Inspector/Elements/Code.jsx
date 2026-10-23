import React from 'react';
import { limitCheck } from './maxValueCheck';
import _ from 'lodash';
import { useCurrentState } from '@/_stores/currentStateStore';
import CodeEditor from '@/AppBuilder/CodeEditor';
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

  const getfieldName = React.useMemo(() => {
    return param.name;
  }, [param]);

  function onVisibilityChange(value) {
    onChange({ name: 'iconVisibility' }, 'value', value, 'styles');
  }

  // A note under the field (a UI 2.0 config's `note`, or `noteFor` keyed by the field's value): Card content's Custom
  // says how a card's components read the card's data. The value may be written as a literal binding ({{'custom'}}).
  const noteKey = String(initialValue ?? '')
    .trim()
    .replace(/^\{\{\s*['"`]?|['"`]?\s*\}\}$/g, '');
  const note = paramMeta?.noteFor?.[noteKey] ?? paramMeta?.note;

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
        // A config may bound its own number field (minValue/maxValue): a value outside is flagged with what the widget takes.
        validationFn={validationFn ?? limitCheck(paramMeta)}
        cyLabel={paramMeta?.showLabel === false ? param.name?.toLowerCase() : ''}
        setCodeEditorView={setCodeEditorView}
        canRefresh={canRefresh}
      />
      {note ? (
        <p
          className="tw-m-0 tw-mt-1 tw-text-xs"
          style={{ color: 'var(--text-placeholder, var(--slate10))' }}
          data-cy={`${param.name}-field-note`}
        >
          {note}
        </p>
      ) : null}
    </div>
  );
};
