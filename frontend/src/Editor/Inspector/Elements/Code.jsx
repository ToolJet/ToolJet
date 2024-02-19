import React from 'react';
import { CodeHinter } from '../../CodeBuilder/CodeHinter';
import _ from 'lodash';
import { resolveReferences } from '@/_helpers/utils';
import { useCurrentState } from '@/_stores/currentStateStore';

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
  accordian,
  placeholder,
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
    // Following condition is needed to support older Text component not having textFormat switch
    if (component?.component?.component === 'Text' && param === 'textFormat') {
      const doTextFormatAlreadyExist = component?.component?.definition?.properties?.textFormat;
      if (!doTextFormatAlreadyExist) {
        return 'html';
      }
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
    }
    if (param === 'selectRowOnCellEdit') {
      const selectRowOnCellEdit =
        component?.component?.definition?.properties?.selectRowOnCellEdit?.value ?? '{{true}}';
      return selectRowOnCellEdit;
    }
    return '';
  };

  let initialValue = !_.isEmpty(definition) ? definition.value : getDefinitionForNewProps(param.name);
  const paramMeta = accordian ? componentMeta[paramType]?.[param.name] : componentMeta[paramType][param.name];
  const displayName = paramMeta?.displayName || param?.name;

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

  function onVisibilityChange(value) {
    onChange({ name: 'iconVisibility' }, 'value', value, 'styles');
  }

  const options = paramMeta?.options || {};

  const getfieldName = React.useMemo(() => {
    return param.name;
  }, [param]);

  return (
    <div className={`field ${options.className}`} style={{ marginBottom: '8px' }}>
      <CodeHinter
        enablePreview={true}
        initialValue={initialValue}
        mode={options.mode}
        theme={darkMode ? 'monokai' : options.theme}
        lineWrapping={true}
        className={options.className}
        onChange={(value) => handleCodeChanged(value)}
        onVisibilityChange={(value) => onVisibilityChange(value)}
        componentName={`component/${componentName}::${getfieldName}`}
        type={paramMeta?.type}
        paramName={param.name}
        paramLabel={paramMeta?.showLabel !== false ? displayName : ' '}
        fieldMeta={paramMeta}
        onFxPress={onFxPress}
        fxActive={CLIENT_SERVER_TOGGLE_FIELDS.includes(param.name) ? false : fxActive} // Client Server Toggle don't support Fx
        component={component}
        verticalLine={verticalLine}
        isIcon={paramMeta?.isIcon}
        staticText={paramMeta?.staticText}
        placeholder={placeholder}
        inspectorTab={paramType}
        bold={true}
      />
    </div>
  );
};
