import {
  parseMongoDBConnectionString,
  detectConnectionStringChange,
  validateMongoDBConnectionString,
} from '../mongoDbHelpers';

/**
 * Maps the keys returned by detectConnectionStringChange to the
 * actual option field keys. These differ because the change detection
 * uses semantic names (protocol, ssl, query) while the options use
 * the MongoDB config field names (connection_format, use_ssl, query_params).
 */
const CHANGE_KEY_TO_FIELD_KEY = {
  protocol: 'connection_format',
  host: 'host',
  port: 'port',
  username: 'username',
  password: 'password',
  database: 'database',
  ssl: 'use_ssl',
  query: 'query_params',
};

export const mongoDbAutoFillStrategy = {
  kind: 'mongodb',
  connectionStringKey: 'connection_string',
  connectionTypeKey: 'connection_type',
  activeConnectionTypeValue: 'string',
  autoFillableFields: [
    'host',
    'port',
    'username',
    'password',
    'database',
    'connection_format',
    'use_ssl',
    'query_params',
  ],

  parse(connectionString) {
    return parseMongoDBConnectionString(connectionString);
  },

  detectChanges(oldString, newString) {
    const result = detectConnectionStringChange(oldString, newString);
    if (!result) return null;

    // Remap change keys to match field keys
    const { changes, newParsed } = result;
    const mappedChanges = {};
    for (const [changeKey, fieldKey] of Object.entries(CHANGE_KEY_TO_FIELD_KEY)) {
      mappedChanges[fieldKey] = changes[changeKey] || false;
    }

    return { changes: mappedChanges, newParsed };
  },

  validate(connectionString, options) {
    const selectedFormat = options?.connection_format?.value;
    return validateMongoDBConnectionString(connectionString, selectedFormat);
  },

  /**
   * Filters AJV validation errors based on the current connection type.
   *
   * When connection_type is 'string':
   *   - Remove 'if' keyword errors (conditional schema noise)
   *   - Remove 'required' errors for connection_string from allOf (handled by custom validation)
   * When connection_type is 'manual':
   *   - Remove any errors related to connection_string (not used in manual mode)
   */
  filterValidationErrors(errors, options) {
    const connectionType = options?.[this.connectionTypeKey]?.value;

    return errors.filter((err) => {
      if (connectionType === 'string' && err.keyword === 'if') {
        return false;
      }
      if (
        connectionType === 'string' &&
        err.dataPath === '.connection_string' &&
        err.keyword === 'required' &&
        err.schemaPath.includes('allOf')
      ) {
        return false;
      }
      if (connectionType === 'manual' && err.dataPath.includes('connection_string')) {
        return false;
      }
      return true;
    });
  },

  getManualEditResetBehavior(fieldKey, value, currentConnString) {
    if (fieldKey !== 'connection_string') {
      return { clearAll: false, preserve: [], remove: [] };
    }

    if (!value || value.trim() === '') {
      return { clearAll: true, preserve: [], remove: [] };
    }

    const protocolChanged =
      !currentConnString || currentConnString.includes('mongodb+srv://') !== value.includes('mongodb+srv://');

    if (protocolChanged) {
      return { clearAll: true, preserve: [], remove: ['connection_format'] };
    }

    return { clearAll: true, preserve: ['connection_format'], remove: [] };
  },

  /**
   * Determines if a manually edited autofillable field should be
   * tracked for protection from future autofill overwrites.
   * For MongoDB, only connection_format is protected.
   */
  shouldTrackManualEdit(fieldKey) {
    return fieldKey === 'connection_format';
  },
};
