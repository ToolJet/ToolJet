import React from 'react';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import _ from 'lodash';
import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';

export const Code = ({
  param,
  definition,
  onChange,
  paramType,
  componentMeta,
  darkMode,
  componentName,
  onFxPress,
  fxActive,
  component,
}) => {
  const currentState = useCurrentState();
  const getDefinitionForNewProps = (param) => {
    if (['showAddNewRowButton', 'allowSelection', 'defaultSelectedRow'].includes(param)) {
      if (param === 'allowSelection') {
        const highlightSelectedRow = component?.component?.definition?.properties?.highlightSelectedRow?.value ?? false;
        const showBulkSelector = component?.component?.definition?.properties?.showBulkSelector?.value ?? false;
        const allowSelection =
          resolveReferences(highlightSelectedRow, currentState) || resolveReferences(showBulkSelector, currentState);

        return '{{' + `${allowSelection}` + '}}';
      } else if (param === 'defaultSelectedRow') {
        return `{{{id:1}}}`;
      } else {
        return '{{true}}';
      }
    } else {
      return '';
    }
  };

  let initialValue = !_.isEmpty(definition) ? definition.value : getDefinitionForNewProps(param.name);
  const paramMeta = componentMeta[paramType][param.name];
  const displayName = paramMeta.displayName || param.name;

  /*
    following block is written for cellSize Prop to support backward compatibility, 
    because from older app we also get cellSize value as compact or spacious, 
    so accordigly we update the initial value with the new values respectively
  */
  if (paramType === 'styles' && param.name === 'cellSize') {
    switch (initialValue) {
      case 'compact':
        initialValue = 'condensed';
        break;
      case 'spacious':
        initialValue = 'regular';
        break;
      default:
        break;
    }
  }

  function handleCodeChanged(value) {
    onChange(param, 'value', value, paramType);
  }

  const options = paramMeta.options || {};

  const getfieldName = React.useMemo(() => {
    return param.name;
  }, [param]);

  return (
    <div className={`mb-2 field ${options.className}`}>
      <CodeHinter
        enablePreview={true}
        initialValue={initialValue}
        mode={options.mode}
        theme={darkMode ? 'monokai' : options.theme}
        lineWrapping={true}
        className={options.className}
        onChange={(value) => handleCodeChanged(value)}
        componentName={`component/${componentName}::${getfieldName}`}
        type={paramMeta.type}
        paramName={param.name}
        paramLabel={displayName}
        fieldMeta={paramMeta}
        onFxPress={onFxPress}
        fxActive={fxActive}
        component={component}
      />
    </div>
  );
};
