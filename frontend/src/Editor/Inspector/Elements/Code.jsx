import React from 'react';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import _ from 'lodash';
import { resolveReferences } from '@/_helpers/utils';

export const Code = ({
  param,
  definition,
  onChange,
  paramType,
  componentMeta,
  currentState,
  darkMode,
  componentName,
  onFxPress,
  fxActive,
  component,
}) => {
  const getDefinitionForNewProps = (param) => {
    if (['showAddNewRowButton', 'allowSelection', 'defaultSelectedRow'].includes(param)) {
      if (param === 'allowSelection') {
        const highlightSelectedRow = component?.component?.definition?.properties?.highlightSelectedRow?.value ?? false;
        const showBulkSelector = component?.component?.definition?.properties?.showBulkSelector?.value ?? false;
        const allowSelection =
          resolveReferences(highlightSelectedRow, currentState) || resolveReferences(showBulkSelector, currentState);

        return '{{' + `${allowSelection}` + '}}';
      } else if (param === 'defaultSelectedRow') {
        console.log('kavin');
        return `{{manish}}`;
      } else {
        return '{{true}}';
      }
    } else {
      return '';
    }
  };

  const initialValue = !_.isEmpty(definition) ? definition.value : getDefinitionForNewProps(param.name);
  const paramMeta = componentMeta[paramType][param.name];
  const displayName = paramMeta.displayName || param.name;

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
        currentState={currentState}
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
