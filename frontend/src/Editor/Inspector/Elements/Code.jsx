import React from 'react';
import _ from 'lodash';
import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';
import CodeEditor from '@/Editor/CodeEditor';
import { useResolverStoreActions } from '@/_stores/resolverStore';

const CLIENT_SERVER_TOGGLE_FIELDS = ['serverSidePagination', 'serverSideSort', 'serverSideFilter'];

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
  verticalLine,
}) => {
  const currentState = useCurrentState();

  const getDefinitionForNewProps = (param) => {
    if (param === 'enablePagination') {
      const clientSidePagination = component?.component?.definition?.properties?.clientSidePagination?.value ?? false;
      const serverSidePagination = component?.component?.definition?.properties?.serverSidePagination?.value ?? false;
      const isPaginationEnabled =
        resolveReferences(clientSidePagination, currentState) || resolveReferences(serverSidePagination, currentState);

      if (isPaginationEnabled) return '{{true}}';
      return '{{false}}';
    }
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

  const { getDefaultComponentValue } = useResolverStoreActions();

  // getDefaultComponentValue(component?.component?.component);

  const defaultValue = paramMeta?.validation ? getDefaultComponentValue(component?.component?.component) : undefined;

  if (paramMeta?.validation) {
    paramMeta.validation.expectedValue = defaultValue[param.name];
  }

  return (
    <div className={`field ${options.className}`} style={{ marginBottom: '20px' }}>
      <CodeEditor
        type="fxEditor"
        initialValue={initialValue}
        paramName={param.name}
        paramLabel={displayName}
        paramType={paramMeta.type}
        fieldMeta={paramMeta}
        onFxPress={onFxPress}
        fxActive={CLIENT_SERVER_TOGGLE_FIELDS.includes(param.name) ? false : fxActive} // Client Server Toggle don't support Fx
        componentName={`component/${componentName}::${getfieldName}`}
        onChange={(value) => handleCodeChanged(value)}
        verticalLine={verticalLine}
        className={options?.className}
        componentId={component?.id}
      />
    </div>
  );
};
