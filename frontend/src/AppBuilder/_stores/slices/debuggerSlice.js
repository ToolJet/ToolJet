import {
  validateProperties,
  generateSchemaFromValidationDefinition,
  validate,
} from '@/AppBuilder/_utils/component-properties-validation';
import { componentTypeDefinitionMap } from '@/AppBuilder/WidgetManager';
import { any } from 'superstruct';
import _ from 'lodash';
import moment from 'moment';

const initialState = {
  logs: [],
  unreadErrorCount: 0,
  pinned: false,
};

export const createDebuggerSlice = (set, get) => ({
  debugger: {
    ...initialState,

    clear: () => {
      set(
        (state) => {
          state.debugger.logs = [];
          state.unreadErrorCount = 0;
        },
        false,
        'clearLogs'
      );
    },

    log: (log) => {
      set(
        (state) => {
          log.page = get().getCurrentPageId('canvas');
          state.debugger.logs.unshift(log);
          if (log.logLevel === 'error') state.debugger.unreadErrorCount++;
        },
        false,
        'log'
      );
    },

    logMultiple: (logs) => {
      set(
        (state) => {
          state.debugger.logs.push(...logs.map((log) => ({ ...log, page: get().getCurrentPageId('canvas') })));
          state.debugger.unreadErrorCount += logs.length;
        },
        false,
        'logMultiple'
      );
    },

    resetUnreadErrorCount: () => {
      set(
        (state) => {
          state.debugger.unreadErrorCount = 0;
        },
        false,
        'resetUnreadErrorCount'
      );
    },

    setPinned: (status) =>
      set(
        (state) => {
          state.debugger.pinned = status;
        },
        false,
        'setDebuggerPinned'
      ),

    getDefaultStyles: (resolvedStyles, componentType) => {
      const getResolvedValue = get().getResolvedValue;
      const componentMeta = componentTypeDefinitionMap[componentType];
      const defaultStyles = componentMeta.definition.styles;
      const transformedStyles = { ...resolvedStyles };
      Object.keys(transformedStyles).forEach((key) => {
        if (transformedStyles[key] === '' && defaultStyles?.[key]?.value) {
          transformedStyles[key] = getResolvedValue(defaultStyles[key].value);
        }
      });
      return transformedStyles;
    },

    validateComponents: (components, moduleId = 'canvas') => {
      const validateComponent = get().debugger.validateComponent;
      const entries = Object.entries(components).map(([id, component]) => {
        // If component is an array, validate each component in the array and return the array
        if (Array.isArray(component)) {
          return [id, component.map((c) => validateComponent(id, c, moduleId))];
        }
        return [id, validateComponent(id, component, moduleId)];
      });
      return Object.fromEntries(entries);
    },

    validateComponent: (id, component, moduleId = 'canvas') => {
      const componentDefinition = get().getComponentDefinition(id, moduleId);
      const componentName = componentDefinition.component.name;
      const componentType = componentDefinition.component.component;
      const componentMeta = componentTypeDefinitionMap[componentType];

      const [coercedProperties, allPropertyErrors] = validateProperties(
        component.properties,
        componentMeta.properties,
        'properties'
      );
      const [coercedStyles, allStyleErrors] = validateProperties(component.styles, componentMeta.styles, 'styles');
      const [coercedGeneralProperties, allGeneralPropertyErrors] = validateProperties(
        component.general,
        componentMeta.general,
        'general'
      );
      const [coercedGeneralStyles, allGeneralStyleErrors] = validateProperties(
        component.generalStyles,
        componentMeta.generalStyles,
        'generalStyles'
      );

      const allErrors = [
        ...allPropertyErrors,
        ...allStyleErrors,
        ...allGeneralPropertyErrors,
        ...allGeneralStyleErrors,
      ];

      const newComponent = {
        ...component,
        properties: coercedProperties,
        styles: coercedStyles,
        general: coercedGeneralProperties,
        generalStyles: coercedGeneralStyles,
      };

      const logs = allErrors.map((error) => ({
        page: get().getCurrentPageId('canvas'),
        type: 'component',
        kind: 'component',
        key: `${componentName} - ${error.property}`,
        componentId: id,
        strace: 'page_level',
        message: `${error.message}`,
        status: true,
        error: {
          resolvedProperty: { [error.propertyHandle]: component[error.type][error.propertyHandle] },
          effectiveProperty: { [error.propertyHandle]: newComponent[error.type][error.propertyHandle] },
          componentId: id,
        },
        logLevel: 'error',
        errorTarget: 'Component Property',
        timestamp: moment().toISOString(),
      }));

      get().debugger.logMultiple(logs);

      return newComponent;
    },

    validateProperty: (componentId, type, property, value, moduleId = 'canvas') => {
      const log = get().debugger.log;

      const componentDefinition = get().getComponentDefinition(componentId, moduleId);
      const componentName = componentDefinition.component.name;
      const componentType = componentDefinition.component.component;
      const componentMeta = componentTypeDefinitionMap[componentType];
      const validationSchema = componentMeta[type][property]?.validation?.schema;

      const defaultValue = validationSchema?.defaultValue
        ? validationSchema?.defaultValue
        : validationSchema
        ? findDefault(validationSchema, value)
        : undefined;

      const schema = _.isUndefined(validationSchema) ? any() : generateSchemaFromValidationDefinition(validationSchema);

      const [valid, errors, newValue] = validate(value, schema, defaultValue);

      if (valid === false) {
        log({
          page: get().getCurrentPageId('canvas'),
          type: 'component',
          kind: 'component',
          key: `${componentName} - ${componentMeta[type][property]?.displayName}`,
          componentId: componentId,
          strace: 'page_level',
          message: `${errors.join('.')}`,
          status: true,
          error: {
            resolvedProperty: { [property]: value },
            effectiveProperty: { [property]: defaultValue },
            componentId,
          },
          errorTarget: 'Component Property',
          logLevel: 'error',
          timestamp: moment().toISOString(),
        });

        value = defaultValue;
      } else {
        value = newValue;
      }

      return value;
    },
  },
});

function findDefault(definition, value) {
  switch (definition.type) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return value;
    case 'array':
      return [];
    case 'object':
      return {};
    case 'union':
      return findDefault(definition.schemas[0], value);
    default:
      return undefined;
  }
}
