import { resolveReferences } from '@/_helpers/utils';

export const getDefinitionInitialValue = (paramType, param, definition, component, currentState) => {
  const componentType = component?.component?.component;

  switch (componentType) {
    case 'Table':
      return getTableDefinitionInitialValue(param, component, currentState);

    case 'Text':
      return ensureLegacyTextComponentCompatibility(param, definition);

    default:
      return '';
  }
};

const getTableDefinitionInitialValue = (
  param,
  { component: { component: { definition: { properties } = {} } = {} } = {} },
  currentState
) => {
  const resolveProperty = (propertyName) => resolveReferences(properties?.[propertyName]?.value);

  switch (param) {
    case 'enablePagination':
      return `{{${resolveProperty('clientSidePagination') || resolveProperty('serverSidePagination')}}}`;
    case 'allowSelection':
      return `{{${resolveProperty('highlightSelectedRow') || resolveProperty('showBulkSelector')}}}`;
    case 'defaultSelectedRow':
      return '{{{id:1}}}';
    case 'showAddNewRowButton':
      return '{{true}}';
    case 'selectRowOnCellEdit':
      return properties?.selectRowOnCellEdit?.value ?? '{{true}}';
    default:
      return '';
  }
};

// A Table saved before "Show record count" existed shows the count only with pagination, so its toggle mirrors pagination
export const getMissingShowRecordCountValue = (component) => {
  if (component?.component?.component !== 'Table') return undefined;
  const properties = component.component.definition?.properties;
  const resolve = (key) => resolveReferences(properties?.[key]?.value);
  // Same order as the old count rule, which reads the old keys without checking enablePagination
  if (resolve('serverSidePagination')) {
    const totalRecords = resolve('totalRecords');
    // missing falls back to 10 in the store; an expression cannot resolve here and is usually set
    return `{{${totalRecords === undefined || !!totalRecords}}}`;
  }
  if (resolve('clientSidePagination')) return '{{true}}';
  return properties?.enablePagination?.value ?? '{{false}}';
};

const ensureLegacyTextComponentCompatibility = (param, definition) => {
  if (param !== 'textFormat') return;

  const componentTextFormatProperty = definition?.properties?.textFormat;

  if (!componentTextFormatProperty) {
    return 'html';
  }
};
