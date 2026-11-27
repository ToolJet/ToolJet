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
  if (properties?.enablePagination) return properties.enablePagination.value;
  const legacyPagination = ['clientSidePagination', 'serverSidePagination'].some((key) =>
    resolveReferences(properties?.[key]?.value)
  );
  return `{{${legacyPagination}}}`;
};

const ensureLegacyTextComponentCompatibility = (param, definition) => {
  if (param !== 'textFormat') return;

  const componentTextFormatProperty = definition?.properties?.textFormat;

  if (!componentTextFormatProperty) {
    return 'html';
  }
};
